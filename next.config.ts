import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Packages with Cloudflare Workers (workerd) specific code
  // Read more: https://opennext.js.org/cloudflare/howtos/workerd
  serverExternalPackages: ['jose', 'pg-cloudflare'],

  // @payloadcms/drizzle requires `drizzle-kit/api` only for schema push/migration
  // generation, which never runs in the Worker. Turbopack otherwise emits an
  // unresolvable hashed external that breaks the OpenNext esbuild bundle, so we
  // alias it to a no-op stub. The Payload CLI (`payload migrate`) imports the
  // config directly in Node and is unaffected by this Turbopack-only alias.
  turbopack: {
    resolveAlias: {
      'drizzle-kit/api': './src/stubs/drizzle-kit-api.cjs',
    },
  },

  // sharp is unavailable in the Workers runtime, and Cloudflare Image Resizing
  // (cdn-cgi/image) requires a custom domain on a Pro+ plan we don't have yet.
  // Until then images are served as-is — `unoptimized` reflects that and avoids
  // the "loader does not implement width" warning a pass-through loader triggers.
  // When CF Image Resizing is set up, switch this back to:
  //   images: { loader: 'custom', loaderFile: './src/cloudflare-image-loader.ts' }
  images: {
    unoptimized: true,
  },

  // Redirect unprefixed page slugs → /pl/:slug so visitors can use
  // /restauracja, /program etc. directly (without the locale prefix).
  // The root / already detects locale and redirects to /pl or /en.
  async redirects() {
    const pages = [
      'restauracja',
      'bar',
      'cigar-room',
      'program',
      'twoje-wydarzenie',
      'rezerwacje',
      'kontakt',
      'kontakt-dla-artystow',
      'aktualnosci',
    ]
    return [
      // Top-level page slugs → /pl/:slug
      {
        source: `/:slug(${pages.join('|')})`,
        destination: '/pl/:slug',
        permanent: false,
      },
      // /aktualnosci/:article → /pl/aktualnosci/:article
      {
        source: '/aktualnosci/:slug',
        destination: '/pl/aktualnosci/:slug',
        permanent: false,
      },
      // /program/:id → /pl/program/:id
      {
        source: '/program/:id',
        destination: '/pl/program/:id',
        permanent: false,
      },
      // /wydarzenia-cykliczne/:slug → /pl/wydarzenia-cykliczne/:slug
      {
        source: '/wydarzenia-cykliczne/:slug',
        destination: '/pl/wydarzenia-cykliczne/:slug',
        permanent: false,
      },
    ]
  },

  // Your Next.js config here
  webpack: (webpackConfig: any) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
