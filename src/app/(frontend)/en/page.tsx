import { renderHome, homeMetadata } from '@/views/HomeView'

// Render at request time against the live D1 binding (build-time D1 returns an
// empty result for this no-param prerender → empty home). See (pl)/page.tsx.
export const dynamic = 'force-dynamic'

export default async function Page() {
  return renderHome('en')
}

export async function generateMetadata() {
  return homeMetadata('en')
}
