import { permanentRedirect } from 'next/navigation'

// 301 the legacy bare `/pl` home to the new unprefixed home `/`.
// (Nested `/pl/...` URLs are handled by the sibling `[...rest]` catch-all.)
export default function LegacyPlHome() {
  permanentRedirect('/')
}
