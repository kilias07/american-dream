type LoaderProps = {
  src: string
  width: number
  quality?: number
}

// Cloudflare Image Resizing (cdn-cgi/image) requires a custom domain on a Pro+ plan.
// When that is set up, replace the function body with:
//   const params = [`width=${width}`, `quality=${quality ?? 75}`, 'format=auto']
//   return `/cdn-cgi/image/${params.join(',')}${src}`
export default function cloudflareLoader({ src }: LoaderProps): string {
  return src
}
