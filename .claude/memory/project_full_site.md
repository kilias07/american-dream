---
name: american-dream full site implementation
description: Full-featured Payload CMS website on Cloudflare D1 + R2 with multi-language and ISR
type: project
---

Full website implementation completed on 2026-03-19.

**Stack:** Payload CMS 3.77.0, Next.js 15.4.11, Cloudflare D1 (SQLite), R2 storage, @opennextjs/cloudflare 1.17.1

**Key decisions:**
- Plugins pinned at 3.77.0 to match payload version (3.79.1 had peer dep warnings)
- `experimental.dynamicIO` NOT enabled (requires canary Next.js) — use `unstable_cache` + `revalidateTag` instead
- `generateStaticParams` wraps DB calls in try/catch so build succeeds without applied migrations
- `r2IncrementalCache` imported from `@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache` (default export) — NOT `@opennextjs/cloudflare/kv-cache`
- Both `NEXT_INC_CACHE_R2_BUCKET` and `R2` bindings point to `american-dream` bucket in wrangler.jsonc

**Collections:** Users, Media, Pages (9 blocks, drafts, versions), Posts (drafts, versions), Categories (nested-docs)
**Globals:** Header (nav, max 8), Footer (nav + localized copyright)
**Blocks:** HeroBanner, RichText, ImageGallery, LiveStream, Content, CallToAction, MediaBlock, Archive, Banner
**Plugins:** seo, redirects, form-builder, nested-docs (all at 3.77.0)
**Locales:** en (default), pl with fallback: true
**Middleware:** Detects locale from NEXT_LOCALE cookie → Accept-Language → 'en'

**Migration status:** 2 migrations applied locally (20250929_111647 + 20260319_121518). Remote D1 needs `pnpm run deploy:database` before deploying.

**How to apply:** `pnpm run deploy:database` — runs migrations on remote D1, then `pnpm opennextjs-cloudflare build && npx wrangler deploy`
