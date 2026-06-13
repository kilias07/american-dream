import { renderBusinessList, businessListMetadata } from '@/views/BusinessListView'

export default function Page() {
  return renderBusinessList('en')
}

export async function generateMetadata() {
  return businessListMetadata('en')
}
