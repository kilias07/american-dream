import { renderLegal, legalMetadata } from '@/views/LegalView'

const TITLE = 'Dane firmy'

export default function Page() {
  return renderLegal('companyData', TITLE, 'pl')
}

export async function generateMetadata() {
  return legalMetadata(TITLE, 'dane-firmy', 'pl')
}
