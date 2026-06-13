import { renderLegal, legalMetadata } from '@/views/LegalView'

const TITLE = 'Company details'

export default function Page() {
  return renderLegal('companyData', TITLE, 'en')
}

export async function generateMetadata() {
  return legalMetadata(TITLE, 'dane-firmy', 'en')
}
