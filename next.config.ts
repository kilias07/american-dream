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
