import { renderBusinessList, businessListMetadata } from '@/views/BusinessListView'

// Read live D1 per request — build-time D1 prerenders this no-param page empty.
export const dynamic = 'force-dynamic'

export default function Page() {
  return renderBusinessList('en')
}

export async function generateMetadata() {
  return businessListMetadata('en')
}
