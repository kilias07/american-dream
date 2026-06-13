import {
  renderRecurringSeries,
  recurringSeriesMetadata,
  recurringSeriesStaticParams,
} from '@/views/RecurringSeriesView'

export const generateStaticParams = recurringSeriesStaticParams

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return renderRecurringSeries(slug, 'pl')
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return recurringSeriesMetadata(slug, 'pl')
}
