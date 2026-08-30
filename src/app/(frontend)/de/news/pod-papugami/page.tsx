import { renderPodPapugami, podPapugamiMetadata } from '@/views/PodPapugamiView'

export default function Page() {
  return renderPodPapugami('de')
}

export async function generateMetadata() {
  return podPapugamiMetadata('de')
}
