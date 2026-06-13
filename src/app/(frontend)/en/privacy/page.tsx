import { renderLegal, legalMetadata } from '@/views/LegalView'

const TITLE = 'Privacy policy'

export default function Page() {
  return renderLegal('privacy', TITLE, 'en')
}

export async function generateMetadata() {
  return legalMetadata(TITLE, 'privacy', 'en')
}
