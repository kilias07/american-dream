import { renderMusician, musicianMetadata, musicianStaticParams } from '@/views/MusicianView'

export const generateStaticParams = musicianStaticParams

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return renderMusician(slug, 'en')
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return musicianMetadata(slug, 'en')
}
