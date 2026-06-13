import { renderNewsList, newsListMetadata } from '@/views/NewsListView'

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams
  return renderNewsList(page, 'pl')
}

export async function generateMetadata() {
  return newsListMetadata('pl')
}
