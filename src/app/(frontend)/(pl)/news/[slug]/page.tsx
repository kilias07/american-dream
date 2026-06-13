import { renderArticle, articleMetadata, articleStaticParams } from '@/views/ArticleView'

export const generateStaticParams = articleStaticParams

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return renderArticle(slug, 'pl')
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return articleMetadata(slug, 'pl')
}
