import { renderPodPapugami, podPapugamiMetadata } from '@/views/PodPapugamiView'

export default function Page() {
  return renderPodPapugami('en')
}

export async function generateMetadata() {
  return podPapugamiMetadata('en')
}
