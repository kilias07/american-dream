import { renderLegal, legalMetadata } from '@/views/LegalView'

const TITLE = 'Polityka prywatności'

export default function Page() {
  return renderLegal('privacy', TITLE, 'pl')
}

export async function generateMetadata() {
  return legalMetadata(TITLE, 'privacy', 'pl')
}
