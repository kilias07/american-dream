import {
  renderBusinessDetail,
  businessDetailMetadata,
  businessDetailStaticParams,
} from '@/views/BusinessDetailView'

export const generateStaticParams = businessDetailStaticParams

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return renderBusinessDetail(slug, 'pl')
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return businessDetailMetadata(slug, 'pl')
}
