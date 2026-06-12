import { createHash } from 'crypto'
import { getSecret } from '../env'
import {
  CreateOrderInput,
  CreateOrderResult,
  PaymentNotConfiguredError,
  PaymentNotificationStatus,
  PaymentProvider,
  RefundResult,
  WebhookResult,
} from './types'

// PayU REST integration (spec §4). Docs: https://developers.payu.com/
// Sandbox base: https://secure.snd.payu.com — production: https://secure.payu.com
//
// Secrets (Wrangler secrets / .dev.vars, never committed):
//   PAYU_BASE_URL       e.g. https://secure.snd.payu.com (defaults to sandbox)
//   PAYU_CLIENT_ID      OAuth client_id (usually = POS id)
//   PAYU_CLIENT_SECRET  OAuth client_secret
//   PAYU_POS_ID         merchantPosId for orders (usually = client_id)
//   PAYU_SECOND_KEY     MD5 signature key for webhook verification

type PayuConfig = {
  baseUrl: string
  clientId: string
  clientSecret: string
  posId: string
  secondKey: string
}

function readConfig(): PayuConfig | null {
  const clientId = getSecret('PAYU_CLIENT_ID')
  const clientSecret = getSecret('PAYU_CLIENT_SECRET')
  const secondKey = getSecret('PAYU_SECOND_KEY')
  const posId = getSecret('PAYU_POS_ID') || clientId
  if (!clientId || !clientSecret || !secondKey || !posId) return null
  return {
    baseUrl: getSecret('PAYU_BASE_URL') || 'https://secure.snd.payu.com',
    clientId,
    clientSecret,
    posId,
    secondKey,
  }
}

// PayU access tokens live ~12h; cache module-side and refresh a minute early.
let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(cfg: PayuConfig): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token

  const res = await fetch(`${cfg.baseUrl}/pl/standard/user/oauth/authorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
    }),
  })
  if (!res.ok) {
    throw new Error(`PayU OAuth failed: ${res.status} ${await res.text()}`)
  }
  const data = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  }
  return cachedToken.token
}

function mapOrderStatus(status: string | undefined): PaymentNotificationStatus {
  switch (status) {
    case 'COMPLETED':
      return 'paid'
    case 'CANCELED':
      return 'cancelled'
    case 'PENDING':
    case 'WAITING_FOR_CONFIRMATION':
    case 'NEW':
      return 'pending'
    default:
      return 'failed'
  }
}

export function createPayuProvider(): PaymentProvider {
  return {
    name: 'payu',

    async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
      const cfg = readConfig()
      if (!cfg) throw new PaymentNotConfiguredError('payu')
      const token = await getAccessToken(cfg)

      const body = {
        notifyUrl: input.notifyUrl,
        continueUrl: input.continueUrl,
        customerIp: input.buyer.ip || '127.0.0.1',
        merchantPosId: cfg.posId,
        description: input.description,
        currencyCode: 'PLN',
        // PayU amounts are in minor units (grosze).
        totalAmount: String(Math.round(input.amount * 100)),
        extOrderId: input.reservationNumber,
        buyer: {
          email: input.buyer.email,
          phone: input.buyer.phone,
          firstName: input.buyer.firstName,
          lastName: input.buyer.lastName,
          language: input.locale || 'pl',
        },
        products: [
          {
            name: input.description,
            unitPrice: String(Math.round(input.amount * 100)),
            quantity: '1',
          },
        ],
      }

      // PayU replies 302 with the redirect URL; `redirect: manual` keeps the
      // JSON body (which also carries orderId + redirectUri + status).
      const res = await fetch(`${cfg.baseUrl}/api/v2_1/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
        redirect: 'manual',
      })

      const data = (await res.json().catch(() => ({}))) as {
        status?: { statusCode?: string }
        redirectUri?: string
        orderId?: string
      }
      const ok = res.status === 302 || res.status === 201 || data.status?.statusCode === 'SUCCESS'
      if (!ok || !data.orderId || !data.redirectUri) {
        throw new Error(`PayU createOrder failed: ${res.status} ${JSON.stringify(data)}`)
      }
      return { orderId: data.orderId, redirectUrl: data.redirectUri }
    },

    async refund(orderId, amount, description): Promise<RefundResult> {
      const cfg = readConfig()
      if (!cfg) throw new PaymentNotConfiguredError('payu')
      const token = await getAccessToken(cfg)

      const refund: Record<string, unknown> = {
        description: description || 'Zwrot rezerwacji American Dream Club',
      }
      // Omit amount for a full refund (spec §4: zwrot pełny).
      if (typeof amount === 'number') refund.amount = String(Math.round(amount * 100))

      const res = await fetch(`${cfg.baseUrl}/api/v2_1/orders/${orderId}/refunds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ refund }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        status?: { statusCode?: string }
        refund?: { refundId?: string; status?: string }
      }
      if (!res.ok || data.status?.statusCode !== 'SUCCESS') {
        throw new Error(`PayU refund failed: ${res.status} ${JSON.stringify(data)}`)
      }
      return {
        refundId: data.refund?.refundId || '',
        status: data.refund?.status === 'FINALIZED' ? 'finalized' : 'pending',
      }
    },

    async verifyAndParseWebhook(rawBody, headers): Promise<WebhookResult> {
      const cfg = readConfig()
      if (!cfg) throw new PaymentNotConfiguredError('payu')

      // PayU signs notifications via the `OpenPayU-Signature` header:
      //   signature=<md5(rawBody + secondKey)>;algorithm=MD5;...
      const header = headers.get('openpayu-signature') || headers.get('OpenPayU-Signature') || ''
      const sigMatch = header.match(/signature=([^;]+)/i)
      const provided = sigMatch?.[1]?.trim()
      const expected = createHash('md5').update(rawBody + cfg.secondKey).digest('hex')
      if (!provided || provided.toLowerCase() !== expected.toLowerCase()) {
        throw new Error('PayU webhook signature verification failed')
      }

      const payload = JSON.parse(rawBody) as {
        order?: { orderId?: string; status?: string; extOrderId?: string }
      }
      const orderId = payload.order?.orderId
      if (!orderId) throw new Error('PayU webhook missing order.orderId')

      return {
        orderId,
        status: mapOrderStatus(payload.order?.status),
        raw: payload,
      }
    },
  }
}
