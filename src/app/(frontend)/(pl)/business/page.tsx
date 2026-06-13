import { renderBusinessList, businessListMetadata } from '@/views/BusinessListView'

export default function Page() {
  return renderBusinessList('pl')
}

export async function generateMetadata() {
  return businessListMetadata('pl')
}
