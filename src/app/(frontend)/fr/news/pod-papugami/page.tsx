import { renderPodPapugami, podPapugamiMetadata } from '@/views/PodPapugamiView'

export default function Page() {
  return renderPodPapugami('fr')
}

export async function generateMetadata() {
  return podPapugamiMetadata('fr')
}
