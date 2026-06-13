import { renderLegal, legalMetadata } from '@/views/LegalView'

const TITLE = 'Regulamin klubu'

export default function Page() {
  return renderLegal('regulamin', TITLE, 'pl')
}

export async function generateMetadata() {
  return legalMetadata(TITLE, 'regulamin', 'pl')
}
