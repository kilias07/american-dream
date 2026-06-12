import { createPayuProvider } from './payu'
import type { PaymentProvider } from './types'

export * from './types'

// Single entry point for the rest of the app. Today this returns PayU; swapping
// providers means changing only this factory (spec §4 — thin interface).
export function getPaymentProvider(): PaymentProvider {
  return createPayuProvider()
}
