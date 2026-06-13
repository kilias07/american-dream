import { renderEventsList, eventsListMetadata } from '@/views/EventsListView'

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams
  return renderEventsList(page, 'en')
}

export async function generateMetadata() {
  return eventsListMetadata('en')
}
