import { getCloudflareContext } from '@opennextjs/cloudflare'

// Single accessor for runtime configuration. On Workers the worker `env` holds
// both string secrets/vars AND binding objects (e.g. SEND_EMAIL); during build
// or outside a request we fall back to `process.env` (string vars only).
//
// All integration secrets are read here so the rest of the code never touches
// `process.env`/bindings directly. Secrets are NEVER committed — they live as
// Wrangler secrets / `.dev.vars` locally (see .env.example for the key list).
export function getRuntimeEnv(): Record<string, unknown> {
  try {
    const ctx = getCloudflareContext()
    if (ctx?.env) return ctx.env as unknown as Record<string, unknown>
  } catch {
    // Not inside a Cloudflare request context (build / CLI / local node) —
    // fall through to process.env.
  }
  return process.env as unknown as Record<string, unknown>
}

/** Read a string secret/var. Returns undefined when unset. */
export function getSecret(key: string): string | undefined {
  const value = getRuntimeEnv()[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

/** Read a binding object (e.g. the SEND_EMAIL email binding). */
export function getBinding<T = unknown>(key: string): T | undefined {
  const value = getRuntimeEnv()[key]
  return value && typeof value !== 'string' ? (value as T) : undefined
}

/** Public site URL, used to build PayU continue/return URLs. */
export function getServerUrl(): string {
  return getSecret('NEXT_PUBLIC_SERVER_URL') || 'http://localhost:3000'
}
