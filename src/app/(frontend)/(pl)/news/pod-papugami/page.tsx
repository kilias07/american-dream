import { renderPodPapugami, podPapugamiMetadata } from '@/views/PodPapugamiView'

export default function Page() {
  return renderPodPapugami('pl')
}

export async function generateMetadata() {
  return podPapugamiMetadata('pl')
}
