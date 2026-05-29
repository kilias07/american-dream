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

  // Use Cloudflare's native image resizing (cdn-cgi/image) instead of sharp,
  // which is not available in the Workers runtime.
  images: {
    loader: 'custom' as const,
    loaderFile: './src/cloudflare-image-loader.ts',
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
