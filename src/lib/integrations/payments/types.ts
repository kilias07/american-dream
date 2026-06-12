// Thin payment-provider abstraction (spec §4). The reservation flow only ever
// talks to this interface, so swapping PayU for another PSP stays cheap.

export type PaymentBuyer = {
  email: string
  phone?: string
  firstName?: string
  lastName?: string
  /** Buyer IP — PayU requires `customerIp` on order creation. */
  ip?: string
}

export type CreateOrderInput = {
  /** Our reservation number — sent as the PSP's external order id. */
  reservationNumber: string
  /** Amount in PLN (major units). Converted to minor units by the provider. */
  amount: number
  description: string
  buyer: PaymentBuyer
  /** Where the PSP redirects the user back to after payment. */
  continueUrl: string
  /** Server-to-server webhook URL for status notifications. */
  notifyUrl: string
  /** Notification language for PSP-hosted pages. */
  locale?: 'pl' | 'en'
}

export type CreateOrderResult = {
  orderId: string
  /** URL to redirect the user to in order to pay. */
  redirectUrl: string
}

export type RefundResult = {
  refundId: string
  status: 'pending' | 'finalized' | 'failed'
}

/** Normalised payment status, mapped from provider-specific webhook payloads. */
export type PaymentNotificationStatus = 'paid' | 'pending' | 'failed' | 'cancelled'

export type WebhookResult = {
  /** PSP order id (idempotency key). */
  orderId: string
  status: PaymentNotificationStatus
  /** Raw provider payload, for auditing/logging. */
  raw: unknown
}

export interface PaymentProvider {
  readonly name: string
  createOrder(input: CreateOrderInput): Promise<CreateOrderResult>
  refund(orderId: string, amount?: number, description?: string): Promise<RefundResult>
  /**
   * Verify a webhook request's signature and parse it into a normalised result.
   * Throws when the signature is invalid (caller returns 400). Idempotency is
   * the caller's responsibility, keyed on the returned `orderId`.
   */
  verifyAndParseWebhook(rawBody: string, headers: Headers): Promise<WebhookResult>
}

/** Thrown when a provider is called but its secrets are not configured. */
export class PaymentNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`Payment provider "${provider}" is not configured (missing secrets).`)
    this.name = 'PaymentNotConfiguredError'
  }
}
