import { renderPage, pageMetadata, pageStaticParams } from '@/views/PageView'

export const generateStaticParams = pageStaticParams

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return renderPage(slug, 'pl')
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return pageMetadata(slug, 'pl')
}
