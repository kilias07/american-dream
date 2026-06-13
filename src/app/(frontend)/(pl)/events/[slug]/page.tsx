import { renderEvent, eventMetadata, eventStaticParams } from '@/views/EventView'

export const generateStaticParams = eventStaticParams

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return renderEvent(slug, 'pl')
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return eventMetadata(slug, 'pl')
}
