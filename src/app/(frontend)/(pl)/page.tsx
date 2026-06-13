import { renderHome, homeMetadata } from '@/views/HomeView'

// ISR safety net (mirrors original [locale]/page.tsx). Tag invalidation
// ('page-home' / 'pages') is the primary revalidation path.
export const revalidate = 3600

export default async function Page() {
  return renderHome('pl')
}

export async function generateMetadata() {
  return homeMetadata('pl')
}
