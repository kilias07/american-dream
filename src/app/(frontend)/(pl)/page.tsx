import { renderHome, homeMetadata } from '@/views/HomeView'

// Render at request time against the live D1 binding. On Cloudflare/OpenNext the
// build-time D1 returns an empty result for this no-param prerender, which would
// bake an empty home page; force-dynamic reads the real data per request.
export const dynamic = 'force-dynamic'

export default async function Page() {
  return renderHome('pl')
}

export async function generateMetadata() {
  return homeMetadata('pl')
}
