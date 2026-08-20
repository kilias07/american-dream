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

  // `sharp` cannot run in the Workers runtime, so Next can never resize images
  // itself. Cloudflare Image Transformations do it at the edge instead — see
  // src/cloudflare-image-loader.ts. This REQUIRES Transformations to be enabled
  // for the zone (dashboard → Images → Transformations); without it the
  // /cdn-cgi/image/ URLs 404 and every image on the site disappears.
  images: {
    loader: 'custom' as const,
    loaderFile: './src/cloudflare-image-loader.ts',
    // Each distinct width is a separate billable transformation, and the Free
    // plan allows 5000 unique ones per month. Next's defaults (8 device + 8
    // image widths) would multiply ~200 uploads well past that, so keep a
    // deliberately small ladder that still covers phone → 4K.
    deviceSizes: [640, 828, 1080, 1920, 2560],
    imageSizes: [128, 256, 384],
    // Uploads are transformed on the R2 hostname, so allow it as a source.
    remotePatterns: [{ protocol: 'https' as const, hostname: 'media.americandreamclub.pl' }],
  },

  // The Worker keeps answering on its `*.workers.dev` deployment hostname even
  // after the custom domain is attached. Canonicals now always point at
  // americandreamclub.pl (src/utilities/siteUrl.ts), but the dev host is still
  // reachable and crawlable — so mark anything served from it as noindex.
  // Weryfikacja audytu 2026-08-06, punkt 1.
  async headers() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host' as const, value: '.*\\.workers\\.dev' }],
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        // Uploads served through the Worker (video sources, og:image, direct
        // links) had NO Cache-Control at all, so Cloudflare cached nothing and
        // every view cost a Worker invocation plus an R2 read. Most images now
        // bypass this route via the R2 hostname; this covers the rest.
        // Deliberately not `immutable`: replacing a file in the CMS can reuse
        // the same filename, and a year-long cache would pin the stale bytes.
        source: '/api/media/file/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ]
  },

  // SEO audit: 301 redirects from the old (Polish) WordPress URLs + the old
  // Payload slugs to the new English canonical URLs (per the migration sheet;
  // a few erroneous sheet targets were corrected, e.g. /kuchnia → /restaurant).
  // PL is the default served at UNPREFIXED URLs; English lives under `/en`.
  // The legacy `/pl/*` prefix is stripped separately by the `/pl/[...rest]`
  // catch-all, and unknown paths fall through to the redirect-up not-found logic.
  async redirects() {
    const p = (source: string, destination: string) => ({ source, destination, permanent: true })

    const PL: [string, string][] = [
      // renamed Payload page slugs / dedicated routes
      ['/restauracja', '/restaurant'],
      ['/bar', '/bar-and-cocktails'],
      ['/cigar-room', '/cigar-lounge'],
      ['/twoje-wydarzenie', '/business'],
      ['/oferta', '/business'],
      ['/kontakt', '/contact'],
      ['/polityka-prywatnosci', '/privacy'],
      ['/program', '/events'],
      ['/aktualnosci', '/news'],
      // old WordPress URLs → closest current section
      ['/wino', '/bar-and-cocktails'],
      ['/topowe-drinki-w-barach-i-klubach', '/bar-and-cocktails'],
      ['/palarnia-cygar', '/cigar-lounge'],
      ['/kuchnia', '/restaurant'], // sheet said /en/ (wrong) — corrected
      ['/menu', '/restaurant'],
      ['/wydarzenia', '/events'],
      ['/kalendarium', '/events'],
      ['/kwietniowy-przeglad-jazzowy', '/events'],
      ['/category/wydarzenia', '/events'],
      ['/category/blog', '/news'],
      ['/spotkania-biznesowe', '/business'],
      ['/oferta/imprezy-okolicznosciowe', '/business'],
      ['/oferta/spotkania-biznesowe', '/business/meetings'],
      ['/oferta/urodziny', '/business/birthday'],
      ['/oferta/wieczory-kawalerskie', '/business/stag'],
      ['/oferta/wynajem-sali-na-imprezy', '/business/venue-hire'],
      ['/spotkania-wigilijne', '/business/christmas'],
      ['/dlaczego-klub-to-swietne-miejsce-na-wyprawienie-urodzin', '/news'],
      ['/o-czym-pamietac-przy-organizacji-imprezy-okolicznosciowej', '/news'],
      // old blog posts with no migrated content → home
      ['/jak-muzyka-na-zywo-uatrakcyjnia-doswiadczenie-klubowe', '/'],
      ['/jak-wybrac-miejsce-na-spotkanie-firmowe', '/'],
      ['/jak-zaznac-relaksu-w-rytmie-muzyki-poza-domem', '/'],
      ['/kiedy-wyjscie-do-klubu-to-dobra-alternatywa-dla-domowki', '/'],
      ['/z-czego-wynika-popularnosc-klubow-grajacych-muzyke-na-zywo', '/'],
      ['/z-czego-wynika-popularnosc-klubow-muzycznych', '/'],
      ['/atrakcje-polecane-wielbicielom-whisky', '/'],
    ]

    const EN: [string, string][] = [
      ['/en/bar', '/en/bar-and-cocktails'],
      ['/en/wine', '/en'],
      ['/en/menu', '/en'],
      ['/en/home-page', '/en'],
      ['/en/food', '/en/restaurant'],
      ['/en/calendar', '/en/events'],
      ['/en/category/events', '/en/events'],
      ['/en/offer', '/en/business'],
      ['/en/privacy-policy', '/en/privacy'],
      // old EN slugs that mirror the renamed PL ones
      ['/en/restauracja', '/en/restaurant'],
      ['/en/cigar-room', '/en/cigar-lounge'],
      ['/en/twoje-wydarzenie', '/en/business'],
      ['/en/kontakt', '/en/contact'],
      ['/en/polityka-prywatnosci', '/en/privacy'],
      ['/en/aktualnosci', '/en/news'],
      ['/en/program', '/en/events'],
    ]

    return [
      ...PL.map(([s, d]) => p(s, d)),
      ...EN.map(([s, d]) => p(s, d)),
      // wildcard families
      p('/mec-category/:slug*', '/events'),
      // Leftover WordPress plumbing — uploads, themes/plugins assets and the
      // REST API all still get crawled/linked. Send the lot to the home page
      // instead of serving 404s (weryfikacja audytu 2026-08-06, punkt 4).
      p('/wp-content/:path*', '/'),
      p('/wp-includes/:path*', '/'),
      p('/wp-json/:path*', '/'),
      // old article/event deep URLs keep their slug where possible
      p('/aktualnosci/:slug', '/news/:slug'),
      p('/en/aktualnosci/:slug', '/en/news/:slug'),
      p('/program/:path*', '/events'),
      p('/en/program/:path*', '/en/events'),
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
