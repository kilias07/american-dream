import { revalidateTag } from 'next/cache'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret')

  if (secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ message: 'Invalid secret' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as { slug?: string; tag?: string }

    // `'max'` marks the entry stale and serves it once more while it
    // regenerates — right for the CMS hooks, wrong here. This endpoint is
    // called from outside a Server Action (deploy scripts, webhooks) precisely
    // when the caller needs the next request to already show the new content,
    // so expire immediately instead.
    if (body.tag) {
      revalidateTag(body.tag, { expire: 0 })
    }

    if (body.slug) {
      revalidateTag(`page-${body.slug}`, { expire: 0 })
    }

    return Response.json({ revalidated: true, timestamp: Date.now() })
  } catch {
    return Response.json({ message: 'Error revalidating' }, { status: 500 })
  }
}
