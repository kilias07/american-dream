import { renderLegal, legalMetadata } from '@/views/LegalView'

// Legal copy comes from the `legal` global at request time. During `next build`
// Payload uses an empty in-memory DB, so a static render would bake a notFound();
// force-dynamic reads the real data per request.
export const dynamic = 'force-dynamic'

const TITLE = 'Club rules'

export default function Page() {
  return renderLegal('regulamin', TITLE, 'en')
}

export async function generateMetadata() {
  return legalMetadata(TITLE, 'regulamin', 'en')
}
