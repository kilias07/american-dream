import { revalidateTag } from 'next/cache'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret')

  if (secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ message: 'Invalid secret' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as { slug?: string; tag?: string }

    if (body.tag) {
      revalidateTag(body.tag)
    }

    if (body.slug) {
      revalidateTag(`page-${body.slug}`)
    }

    return Response.json({ revalidated: true, timestamp: Date.now() })
  } catch {
    return Response.json({ message: 'Error revalidating' }, { status: 500 })
  }
}
