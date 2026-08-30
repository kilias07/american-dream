import { renderPodPapugami, podPapugamiMetadata } from '@/views/PodPapugamiView'

export default function Page() {
  return renderPodPapugami('es')
}

export async function generateMetadata() {
  return podPapugamiMetadata('es')
}
