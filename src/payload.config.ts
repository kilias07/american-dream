import fs from 'fs'
import path from 'path'
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import { CloudflareContext, getCloudflareContext } from '@opennextjs/cloudflare'
import { GetPlatformProxyOptions } from 'wrangler'
import { r2Storage } from '@payloadcms/storage-r2'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'

import { defaultLexical } from './fields/defaultLexical'
import { localeDefinitions, defaultLocale } from './config/locales'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Categories } from './collections/Categories'
import { Events } from './collections/Events'
import { Musicians } from './collections/Musicians'
import { RecurringSeries } from './collections/RecurringSeries'
import { MenuCategories } from './collections/MenuCategories'
import { MenuItems } from './collections/MenuItems'
import { Rooms } from './collections/Rooms'
import { TeamMembers } from './collections/TeamMembers'
import { Testimonials } from './collections/Testimonials'
import { ArtistApplications } from './collections/ArtistApplications'
import { Header } from './globals/Header'
import { Footer } from './globals/Footer'
import { SiteSettings } from './globals/SiteSettings'
import { OpeningHours } from './globals/OpeningHours'
import { Legal } from './globals/Legal'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const realpath = (value: string) => (fs.existsSync(value) ? fs.realpathSync(value) : undefined)

const isBuild = process.env.NEXT_PHASE === 'phase-production-build'
const isCLI = !isBuild && process.argv.some((value) => realpath(value)?.endsWith(path.join('payload', 'bin.js')))
const isProduction = process.env.NODE_ENV === 'production'

const createLog =
  (level: string, fn: typeof console.log) => (objOrMsg: object | string, msg?: string) => {
    if (typeof objOrMsg === 'string') {
      fn(JSON.stringify({ level, msg: objOrMsg }))
    } else {
      fn(JSON.stringify({ level, ...objOrMsg, msg: msg ?? (objOrMsg as { msg?: string }).msg }))
    }
  }

const cloudflareLogger = {
  level: process.env.PAYLOAD_LOG_LEVEL || 'info',
  trace: createLog('trace', console.debug),
  debug: createLog('debug', console.debug),
  info: createLog('info', console.log),
  warn: createLog('warn', console.warn),
  error: createLog('error', console.error),
  fatal: createLog('fatal', console.error),
  silent: () => {},
} as any

const cloudflare =
  isCLI || !isProduction || isBuild
    ? await getCloudflareContextFromWrangler()
    : await getCloudflareContext({ async: true })

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    Pages,
    Posts,
    Categories,
    Events,
    Musicians,
    RecurringSeries,
    MenuCategories,
    MenuItems,
    Rooms,
    TeamMembers,
    Testimonials,
    ArtistApplications,
  ],
  globals: [Header, Footer, SiteSettings, OpeningHours, Legal],
  editor: defaultLexical,
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteD1Adapter({ binding: cloudflare.env.D1, push: false }),
  logger: isProduction ? cloudflareLogger : undefined,
  localization: {
    locales: [...localeDefinitions],
    defaultLocale,
    fallback: true,
  },
  plugins: [
    r2Storage({
      bucket: cloudflare.env.R2,
      collections: { media: true },
    }),
    seoPlugin({
      collections: ['pages', 'posts'],
      uploadsCollection: 'media',
      generateTitle: ({ doc }) => `${doc.title ?? ''} | American Dream`,
      generateDescription: ({ doc }) => (doc.excerpt as string) ?? '',
    }),
    redirectsPlugin({
      collections: ['pages', 'posts'],
    }),
    formBuilderPlugin({}),
    nestedDocsPlugin({ collections: ['categories'] }),
  ],
})

function getCloudflareContextFromWrangler(): Promise<CloudflareContext> {
  return import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then(
    ({ getPlatformProxy }) =>
      getPlatformProxy({
        environment: process.env.CLOUDFLARE_ENV,
        remoteBindings: isProduction && !isBuild,
        // During `next build`, Next 16 collects route config in parallel workers that
        // each open the persisted local D1 sqlite -> SQLITE_BUSY. Use an ephemeral
        // in-memory DB at build time (data isn't needed; static params try/catch to []).
        ...(isBuild ? { persist: false } : {}),
      } satisfies GetPlatformProxyOptions),
  )
}
