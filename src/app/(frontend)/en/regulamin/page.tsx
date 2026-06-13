import { renderLegal, legalMetadata } from '@/views/LegalView'

const TITLE = 'Club rules'

export default function Page() {
  return renderLegal('regulamin', TITLE, 'en')
}

export async function generateMetadata() {
  return legalMetadata(TITLE, 'regulamin', 'en')
}
