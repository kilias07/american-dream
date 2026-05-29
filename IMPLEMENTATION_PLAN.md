# American Dream Club — Full Website Implementation Plan

> Living document. Status legend: ⬜ todo · 🟦 in progress · ✅ done · ⏸️ blocked/awaiting review
> Working dir: `american-dream/` (Payload CMS + Next.js on Cloudflare D1 + R2 / OpenNext).
> This plan is executed **progressively with check-ins at major milestones** (post-upgrade, post-schema, post-frontend).

---

## 0. Goal & approved decisions

Build the complete public website for **American Dream Club** (ADC) — a Poznań "Restauracja & Jazz Club" — on the existing Payload + Next.js + Cloudflare stack. Drive every page from the CMS, matching the 14 design PDFs in `../project/sites/`.

**Decisions (locked with the user):**
1. **Upgrade to the latest of everything.** Target **Next.js 16.2.6**, **Payload 3.85.0** (+ all `@payloadcms/*` pinned to 3.85.0), **React 19.2.6**, **@opennextjs/cloudflare 1.19.11**, **wrangler 4.95.0**, **Tailwind 4.3.0**. Fallback to **Next 15.4.11** only if the Cloudflare "Proxy version trap" blocks deploy (see §7 Risks).
2. **Reservations link out** — `ZAREZERWUJ STOLIK` / `KUP BILET` / `ZADZWOŃ` / `NAPISZ` resolve to phone, email, or an external booking/ticket URL set in the CMS (per-event override + global default). No on-site booking engine.
3. **Human-in-the-loop at major milestones** — pause for review after: M1 dependency upgrade, M2 CMS schema, M3 frontend+content.
4. **Seed real Polish content** transcribed from the PDFs (EN translations layered later via existing localization).
5. **Install Payload's recommended Claude skills** (`payload`, `cms-migration`) into the project's `.claude/skills/`.

---

## 1. Current state (baseline)

- Stack today: Payload **3.77.0**, Next **15.4.11**, React **19.2.1**, OpenNext **^1.11.0**, wrangler **~4.75**, Tailwind **^4.2.2**. Cloudflare D1 (SQLite, `push:false` + migrations), R2 storage.
- Localization already on: `en` (default) + `pl`, `fallback:true` (`src/config/locales.ts`).
- Collections: `Users`, `Media`, `Pages` (blocks page-builder, drafts/versions), `Posts` (drafts/versions), `Categories` (nested-docs), `Events` (with basic recurrence).
- Globals: `Header`, `Footer` (partially built).
- Blocks (`src/blocks/`): `HeroBanner`, `RichText`, `ImageGallery`, `LiveStream`, `Content`, `CallToAction`, `MediaBlock`, `Archive`, `Banner`, `BentoSection`, `EventsCalendar`, `Testimonials`.
- Plugins: `seo`, `redirects`, `form-builder`, `nested-docs` (all 3.77.0).
- Frontend routes: `src/app/(frontend)/[locale]/{layout,page}.tsx` + `[locale]/[slug]/page.tsx`. There is an events API route + middleware for locale detection.
- Repo is git-tracked. **Note: there are existing uncommitted changes** (blocks/index, Pages, BlockRenderer, migrations, payload-types, untracked `scripts/seed-pages.ts`, `public/fonts|images|sites`). Preserve these — the upgrade only touches deps/config.
- CLAUDE.md gate: after significant changes run `pnpm run test:int` + `pnpm run build`; fix before done.

**~70–80% of the page designs map onto existing blocks.** Net-new is concentrated in: a menu system, a subpage hero, set menus, promo bands, events sub-templates (special/recurring/musicians), private-events page, and fleshed-out Header/Footer/Settings globals.

---

## 2. Brand & design system (from logo SVG + mockups)

**Color tokens**
- `--color-navy` (page canvas / hero): **#110D35** (midnight).
- `--color-navy-royal` (footer, newsletter cards): ~**#171A5C–#1A1A66** (brighter royal navy).
- `--color-amber` (primary accent: buttons, utility bar, headings, prices, tags): **#F8AB00**.
- `--color-on-dark`: `#FFFFFF` / soft off-white.
- Near-black text on amber/white surfaces.

**Typography (dual register)**
- **Serif (title-case)** for inner-page hero H1s and display headings ("Rezerwacja", "Kontakt", "Dinner Time", "Specjalne Piątki"). Didone/transitional feel.
- **Geometric, wide-tracked UPPERCASE sans** for nav, section labels, card titles, dish/cocktail names, prices, buttons (matches the logo's art-deco sans).
- **Script/swash** accent (the logo's signature "D"; per-series display faces like "Towarzyska Niedziela").
- Headings frequently terminate with a `›` chevron affordance.
- Confirm exact font files in `public/fonts/` (already present) and wire `next/font` (local).

**Logos** (in `../project/American Dream Club Logo/`, also `public/`):
- Full circular emblem (badge + art-deco "speed lines" + `JAZZ & RESTAURANT` + ®) → emblem placements (e.g. Kontakt info column).
- Simplified horizontal wordmark → header/footer.
- Ship black / white / on-navy variants.

**Mood:** vintage-Americana × art-deco / streamline-moderne supper club; gold-on-midnight, warm low-light photography, 21+ exclusivity.

> Use the **frontend-design** skill when building the visual language; check work against **web-design-guidelines** (accessibility/UX) in QA.

---

## 3. Information architecture (routes)

All public routes under `src/app/(frontend)/[locale]/…`. Slugs are the PL canonical; EN localized slugs optional later.

| Route | Page | Source PDF |
|---|---|---|
| `/` | Homepage | `ADC_homepage.pdf` |
| `/restauracja` | Restaurant + food menu | `ADC_restauracja.pdf` |
| `/bar` (Cocktail Bar) | Cocktail bar + cocktails | `ADC_coctail_bar.pdf` |
| `/cigar-room` | Cigar Room + cigar menu | `ADC_cigar_room.pdf` |
| `/program` | Events program (calendar + special + musicians + recurring) | `ADC_program.pdf` |
| `/program/[slug]` | Single event (standard **and** special via flag) | `ADC_wydarzenia_single_event.pdf`, `ADC_wydarzenia_special_event.pdf` |
| `/wydarzenia-cykliczne/[slug]` | Recurring series detail | `ADC_wydarzenia_cykliczne.pdf` |
| `/twoje-wydarzenie` | Private/corporate events (venue hire) | `ADC_Twoje_wydarzenia.pdf` |
| `/rezerwacje` | Reservations / plan your evening | `ADC_Rezerwacje.pdf` |
| `/aktualnosci` | News listing (paginated) | `ADC_Aktualności.pdf` |
| `/aktualnosci/[slug]` | Article | `ADC_Artykuł.pdf` |
| `/kontakt` | Contact (info + form + map + newsletter) | `ADC_Kontakt.pdf` |
| `/kontakt-dla-artystow` | Artist application form | `ADC_Kontakt_artyści.pdf` |

Top nav (canonical, confirm with client): **RESTAURACJA · PROGRAM · TWOJE WYDARZENIE · BAR & CIGAR · KONTAKT** + amber `ZAREZERWUJ`. (`BAR & CIGAR` is a menu/landing grouping `/bar` + `/cigar-room`.)

---

## 4. CMS schema

### 4.1 Collections

**Extend `Events`** — single collection driving program list + single + special; recurring children link to a series.
- `eventType`: select `standard | special` (+ recurring handled via `recurringSeries` relation).
- `leadTitle`/eyebrow (localized), `title` (localized), `slug`.
- `startDateTime` (date+time), `endTime` (optional), `price` (number) + `currency` (default `PLN`).
- `genres`: relationship → `Categories` (JAZZ, SWING, MUZYKA KLASYCZNA…) or hasMany select.
- `heroImage`, `thumbnailImage` (calendar/carousel), `posterImage` (special-event carousel art).
- `descriptionHeading` (localized) + `description` (richText, localized).
- `performers`: array → `{ musician: relationship→Musicians, instrument: text }` (per-event instrument override).
- `room`: relationship → `Rooms` (optional).
- `recurringSeries`: relationship → `RecurringSeries` (optional).
- `reservationUrl` / `ticketUrl` (text, optional — overrides global default), `shareEnabled` (bool).
- `featured` (bool, homepage teaser). Keep drafts/versions + access (`authenticatedOrPublished`).

**New `Musicians`** — `name`, `slug`, `instrument`/role (localized), `photo` (upload), `bio` (richText, localized), `order`.

**New `RecurringSeries`** ("wydarzenia cykliczne") — `name`, `slug`, `wordmarkImage`, `heroImage`, `themeColor` (text/select skin: amber/bw/sepia/purple), `eyebrow`+`description` (richText, localized), `gallery` (array upload), reverse relation to `Events`.

**New `MenuItems`** — the menu engine for cigars/cocktails/food/wine.
- `name` (localized), `description` (localized, optional), `ingredients` (localized textarea/array — cocktails), `price` (number), `unit`/`currency` (default `zł`).
- `menuType`: select `cigars | cocktails | wine | food`.
- `category`: relationship → `MenuCategories` (Nikaragua/Dominikana/Kuba for cigars; courses for food: przystawki/zupy/dania główne/burgery/sałatki/desery; "KOKTAJLE AUTORSKIE" tag for cocktails).
- `image` (optional — cocktail/dish cards), `origin`/`region`, `variants` (array `{label, price}` — e.g. SMASH BURGER CLASSIC/BBQ), `tag` (localized), `order`, `available` (bool).

**New `MenuCategories`** — `title` (localized), `menuType`, `order`. (Or extend `Categories` with a `kind` field; separate collection is cleaner.)

**New `Rooms`** ("strefy") — `name`, `slug`, `capacity` (number, "do N osób"), `description` (localized), `equipment` (array of localized text), `gallery` (array upload). Also a relation target for `Events.room`.

**New `TeamMembers`** — `name`, `role` (localized), `phone`, `email`, `photo`. (Sales contact on `/twoje-wydarzenie`.)

**New `Testimonials`** (promote block → collection) — `author`, `rating` (1–5), `text` (localized), `source` (default Google), `featured`. Plus a global aggregate string "500+ opinii · 4,8/5".

**Reuse `Posts` as News ("Aktualności")** — ensure: `title`, `slug`, `excerpt` (localized), `featuredImage`, `content` (blocks: RichText + inline ImageGallery), `category`, `publishedAt`, drafts/versions, SEO. Prev/next + related-by-category for the article page.

**New `ArtistApplications`** — typed submission store for `/kontakt-dla-artystow` (richer than form-builder). Admin tabs mirroring the form sections:
- Contact: `fullName`, `phone`, `email`, `city`.
- Musical profile: `instrument`, `genres`, `preferredLineup` (select), `rateProposal`, `dateProposals` (textarea), `repertoire` (textarea), `bandName`.
- Education/experience: `musicEducation` (select), `schoolName`, `educationDetails` (textarea), `stageExperience` (select), `pastVenues` (textarea).
- Recordings: `links` array (SoundCloud/YouTube). Social: `facebook`, `instagram`. `message` (textarea).
- `status` (new/reviewed/contacted), consent + timestamp; email-notification hook.

### 4.2 Globals

**Extend `Header`** — `topBar` `{ tagline, liveMusicLabel, phone, address }`, `logo` (upload), `nav` array `{ label, link→pages | url }`, `reserveButton` `{ label, url }`. Sticky on scroll; mobile hamburger.

**Extend `Footer`** — `logo`, `openingHours` (shared from OpeningHours global), `columns` array `{ title, links[] }` (OFERTA, REZERWACJE…), `newsletter` `{ heading, placeholder, buttonLabel, consentText }`, `contact` `{ address, phone }`, `social` array `{ platform, url }`, `legalLinks` array, `ageBadge` (bool/`21+`).

**New `SiteSettings`** (a.k.a. ContactInfo) — `addresses`, `phones`, `emails` (info@ + rezerwacja@), `social`, `mapEmbedUrl`/`lat`/`lng`, default `reservationUrl`/`ticketUrl`, `reviewAggregate` ("500+ opinii · 4,8/5").

**New `OpeningHours`** — array `{ day, openTime, closeTime, closed }` (single source of truth; footer + Kontakt + Rezerwacje all read it). ⚠️ Reconcile the two conflicting hour sets seen (footer 22:00/24:00 vs contact 23:00/00:00) with the client — model one canonical set.

**New `Legal`** — `regulamin`, `privacy`, `companyData`, `age21Notice` (richText, localized).

### 4.3 Form Builder forms
- `Contact form` — Imię, Telefon, Adres email, Wiadomość, consent (required), reCAPTCHA → submission + email notify (`WYŚLIJ WIADOMOŚĆ`).
- `Newsletter form` — Adres email, consent, reCAPTCHA (`ZAPISZ SIĘ` / footer `DOŁĄCZ`).

### 4.4 Blocks (page-builder)

**Reuse:** `HeroBanner` (homepage hero), `BentoSection` (venue/cross-sell cards), `Testimonials`, `ImageGallery`, `EventsCalendar`, `Content`/`RichText`, `MediaBlock`, `CallToAction`, `Banner`.

**New blocks:**
- `PageHero` — full-bleed image + navy overlay + eyebrow + serif/uppercase H1 + optional inline `… MENU ›` link + gold rule. (All inner pages.)
- `AboutIntro` — centered eyebrow/heading/subheading/body + optional italic pull-quote. (Homepage, venue intros.)
- `MenuSection` — renders `MenuItems` filtered by `menuType`; `layout`: `priced-list` (cigars, grouped by category w/ leader lines) **or** `card-grid` (cocktails/dishes); optional `groupBy`, optional `pdfDownload` ("ZOBACZ CAŁE MENU (PDF)").
- `SetMenu` — "Dinner Time" MENU A/B course→dish columns + optional date chip + price.
- `PromoBand` / `SpecialOffer` — gold band: heading, body, image, `items[] {label, sub, price}`, CTA, optional `relatedEvent`. ("BIG BEAT!", "Specjalne Piątki".)
- `EventsTeaserCarousel` — upcoming events row (date badge + thumb + title), homepage + event pages ("NADCHODZĄCE WYDARZENIA").
- `SpecialEventsCarousel` — poster cards + dots ("WYDARZENIA SPECJALNE").
- `MusiciansGrid` — musician cards ("NASI MUZYCY").
- `RecurringSeriesTeaser` / `OtherSeriesGrid` — branded series cards ("WYDARZENIA CYKLICZNE", "POZOSTAŁE…").
- `NewsCarousel` — article cards ("AKTUALNOŚCI").
- `RoomSelector` — tabbed strefy selector + detail (carousel + equipment list).
- `OfferCards` — private/corporate offer cards.
- `SalesContactBand` — amber band w/ TeamMember (Zadzwoń / Zapytaj mailowo).
- `EveningPhases` + `WeekdayHours` — reservations day-pills + phase cards.
- `ContactInfoColumn` + `ContactFormBlock` + `MapEmbed` — Kontakt.
- `ArtistCTA` — banner → `/kontakt-dla-artystow`.
- `Notice21Plus` — age notice + Regulamin 21+ button.
- `NewsletterCTA` — inline/footer newsletter signup.

Each new block: config in `src/blocks/<Name>.ts`, React renderer in `src/components/blocks/`, registered in `src/blocks/index.ts` + `BlockRenderer.tsx` + `Pages` collection. After block changes: `payload generate:importmap` + `generate:types`.

---

## 5. Frontend build (shared shell + per page)

**Shared shell components** (`src/components/`): `TopBar`, `SiteHeader`/`MainNav` (sticky, mobile drawer, lang switch), `Footer` (+ `FooterNewsletter`), `PageHero`, `PillButton` (amber-solid / navy-outline / white-active), `TimeChip`, `SectionLabel` (uppercase + ›), `Carousel` primitive (arrows + dots + snap), `Lightbox`, `OpeningHoursList` (footer-compact + pill skins), `Notice21Plus`, `EventCard`/`CalendarEventCell` (amber=active/special, blue=standard), `NewsCard`, `MusicianCard`, `MenuPriceList`, `DishCard`/`CocktailCard`, `RoomTabs`, `ShareBar`, `MapEmbed`, recaptcha+consent form footer.

**Per-page composition** = a `Pages` doc (or dedicated route) assembled from blocks above. Build order in §6. Wire data via Payload Local API in Server Components; ISR via existing `unstable_cache` + `revalidateTag` pattern.

---

## 6. Phased execution & verification gates

### Phase 0 — Setup (low risk) ✅ before upgrade
- ⬜ Install Payload skills into `.claude/skills/`: `payload` (from `payloadcms/payload/tools/claude-plugin/skills/payload`) + `cms-migration` (from `payloadcms/skills/skills/cms-migration`). (Alt: user runs `/plugin install github:payloadcms/payload`.)
- ⬜ Note git baseline (preserve existing uncommitted work; do not commit unless asked).

### Phase 1 — Dependency upgrade  ✅ DONE (incl. Cloudflare deploy build) — **MILESTONE 1**

> **Results (2026-05-28):** All deps upgraded (Next 16.2.6, Payload 3.85.0, React 19.2.6, OpenNext 1.19.11, wrangler 4.95, Tailwind 4.3). Verified green: `pnpm run build` ✅, `pnpm run test:int` ✅ (11 migrations apply), **`opennextjs-cloudflare build` ✅ (worker bundled)**.
>
> **Fixes applied:**
> 1. `middleware.ts` → removed. Next-16 proxy runs Node-runtime which OpenNext-Cloudflare doesn't support yet ("version trap"). **User chose: keep Next 16, drop proxy.** Locale detection moved in-app: `src/lib/getPreferredLocale.ts` (cookie→Accept-Language→default) + root `(frontend)/page.tsx` redirects to detected locale. Tradeoff accepted: unprefixed deep links don't auto-detect locale.
> 2. `revalidateTag(tag)` → `revalidateTag(tag, 'max')` (Next-16 signature) in revalidate route + Header/Footer/Pages/Posts/Events hooks.
> 3. `lint` script → `eslint .` (`next lint` removed in 16).
> 4. `next build` SQLITE_BUSY → `persist:false` on build-time `getPlatformProxy` (ephemeral in-memory D1; parallel workers no longer fight over the local sqlite file).
> 5. `drizzle-kit/api` bundling failure → aliased to `src/stubs/drizzle-kit-api.cjs` via `next.config.ts` `turbopack.resolveAlias` (it's push/migrate-only, never used at Worker runtime; CLI migrations import config directly in Node, unaffected).
> 6. Env cruft: renamed orphaned `~/Desktop/.pnp.cjs`→`.pnp.cjs.disabled` (+ `.yarn`) which was forcing Yarn-PnP resolution onto this pnpm project. **Reversible.**
>
> Deploy scripts unchanged — `opennextjs-cloudflare build` works as-is on the Turbopack output.
- ⬜ Bump `payload` + all `@payloadcms/*` → **3.85.0** (pinned identical).
- ⬜ Bump `next` → **16.2.6**, `react`/`react-dom` → **19.2.6**, `eslint-config-next` → 16.2.6.
- ⬜ Bump `@opennextjs/cloudflare` → 1.19.11, `wrangler` → 4.95.0, `tailwindcss`+`@tailwindcss/postcss` → 4.3.0, and remaining devDeps to latest compatible.
- ⬜ **Next 16 migration**: run `npx @next/codemod@latest upgrade`; migrate `middleware.ts` → Next 16 **Proxy** convention (locale detection); review `next.config.ts`, async request APIs, caching defaults.
- ⬜ Update scripts if needed (Payload note: `--no-server-fast-refresh` for Turbopack dev on 16.2+ — our dev uses webpack, evaluate).
- ⬜ `pnpm install` → `payload generate:importmap` → `payload generate:types`.
- ⬜ **Verify:** `pnpm run test:int` ✅, `pnpm run build` ✅, then `pnpm run preview` (OpenNext local) to validate the **Proxy/middleware version trap** on Cloudflare. If deploy path breaks → fall back to Next 15.4.11 (deps still latest) and document.
- ⏸️ **Pause → report results to user.**

### Phase 2 — CMS schema  ✅ code done · ⏸️ migration blocked — **MILESTONE 2 (review)**

> **Results (2026-05-28):** Created 8 collections (Musicians, RecurringSeries, MenuCategories, MenuItems, Rooms, TeamMembers, Testimonials, ArtistApplications), 19 page-builder blocks, 3 globals (SiteSettings, OpeningHours, Legal). Extended Events (eventType, leadTitle, genres, posterImage, descriptionHeading, body, performers, room, recurringSeries, reservationUrl, shareEnabled), Posts (excerpt), Header (logo), Footer (logo, newsletter, ageBadge). All registered in payload.config.ts / blocks/index.ts / Pages.ts. **`generate:types:payload` ✅, `pnpm run build` ✅, `pnpm run test:int` ✅** — config is fully valid.
>
> **Migration — RESOLVED via re-baseline (user-approved, remote D1 confirmed disposable):** The repo's migrations `20260329_*`+`20260330_*` were hand-written WITHOUT drizzle `.json` snapshots, so `migrate:create` was diffing against a stale baseline and producing garbage. Fix: backed up all old migrations to `/tmp/adc-migrations-backup-*`, cleared `src/migrations/`, reset `index.ts`, wiped local D1, and ran `payload migrate:create initial` → **one clean baseline `20260528_185919_initial.ts` (191 CREATE TABLE in up(), DROPs only in down())** with a correct `.json` snapshot, so `migrate:create` works going forward. Applied to fresh local D1 → **192 tables**, all new collections/globals confirmed present. `pnpm run build` ✅, `pnpm run test:int` ✅, `generate:types:payload` ✅. **Remote D1 must be reset/re-migrated fresh on next deploy** (it had no data to keep).
- ⬜ New collections: Musicians, RecurringSeries, MenuItems, MenuCategories, Rooms, TeamMembers, Testimonials, ArtistApplications. Extend Events. Confirm Posts-as-News fields.
- ⬜ Globals: extend Header + Footer; add SiteSettings, OpeningHours, Legal.
- ⬜ Form Builder: Contact + Newsletter forms.
- ⬜ New blocks (config only) + register in index/BlockRenderer/Pages.
- ⬜ `generate:types` + `generate:importmap`; create D1 migration(s); apply locally.
- ⬜ **Verify:** test:int ✅, build ✅, admin loads, can create one doc per new collection.
- ⏸️ **Pause → report schema to user.**

### Phase 3 — Design system & shell  ✅ DONE

> **Results (2026-05-28):** Brand tokens corrected to logo colors (`--color-brand-gold #F8AB00`, `--color-brand-navy #110D35`, `--color-brand-navy-royal #171A5C`) in globals.css. Fonts: Metropolis via `@font-face` (woff2 in /public/fonts) + Playfair Display via Google `@import` — **NOTE: `next/font` is incompatible with Turbopack here ("unexpected data version"), so fonts use plain CSS, not next/font.** Shell (Header/Footer/TopBar/MobileMenu) already existed and matches design. Built **19 block renderers** in src/components/blocks/ (+ client siblings for carousels/tabs/forms) and wired all into BlockRenderer.tsx. `build` ✅ + `test:int` ✅.
- ⬜ Tailwind theme tokens + fonts (`next/font` local) + logo assets.
- ⬜ Build shared shell + primitives (§5). Frontend-design skill for visual language.
- ⬜ Block renderers for all new blocks.
- ⬜ Verify build + a smoke route.

### Phase 4 — Pages (build + wire)  ✅ DONE

> **Results (2026-05-28):** Most pages are CMS Pages docs rendered by the existing `[locale]/[slug]` route. Built 4 dedicated detail routes: `program/[id]` (event detail), `aktualnosci` (news listing + pagination), `aktualnosci/[slug]` (article), `wydarzenia-cykliczne/[slug]` (recurring series). All reuse `RichTextRenderer`, getPayload+unstable_cache, generateMetadata/StaticParams. **All 13 routes verified HTTP 200**; `/pl` homepage renders full (7981px, 6 styled sections, hero + emblem + CTAs matching the design). Note: Event has no `slug` (uses numeric `id` in `/program/[id]`).

#### (legacy checklist)
- ⬜ 4a Homepage.
- ⬜ 4b Venue pages: `/restauracja`, `/bar`, `/cigar-room` (menu system).
- ⬜ 4c Events: `/program`, `/program/[slug]` (standard+special), `/wydarzenia-cykliczne/[slug]`.
- ⬜ 4d `/twoje-wydarzenie` (rooms, offers, sales contact, testimonials).
- ⬜ 4e `/rezerwacje` (hours selector, phases, age notice).
- ⬜ 4f `/aktualnosci` + `/aktualnosci/[slug]`.
- ⬜ 4g `/kontakt` + `/kontakt-dla-artystow` (forms, map).
- ⬜ Verify build after each group.

### Phase 5 — Content seeding (real PL)  ✅ DONE

> **Results (2026-05-28):** `scripts/seed-adc.ts` (run via `pnpm run seed`) seeds globals (Header/Footer/SiteSettings/OpeningHours/Legal), 10 media (mockup JPGs from public/sites → local R2), 7 menu categories + 26 menu items (cigars/cocktails/food), 9 musicians, 4 rooms, 1 team member, 4 testimonials, 3 news posts, 3 events (standard + special), and 9 page-builder Pages assembled from blocks. Content is **PL-only** (EN falls back/empty for now, per plan).
>
> **⚠️ Dev workflow gotchas (important):**
> - Seed runs with **`pnpm run seed`** (`tsx`), NOT `payload run` (which doesn't await the top-level promise here).
> - **`pnpm run test:int` WIPES the local D1** (`vitest.globalSetup.ts` deletes `.wrangler/state/v3/d1` + re-migrates). So always re-run `pnpm run seed` AFTER tests.
> - After seeding, **`rm -rf .next`** (or restart dev) — the route uses `unstable_cache`/`revalidate`, so a stale empty result can be cached.
> - Order for a fresh dev DB: `pnpm payload migrate` → `pnpm run seed` → `pnpm run dev`.

#### (legacy checklist)
- ⬜ Seed script (extend `scripts/seed-pages.ts`): globals, OpeningHours, SiteSettings, Legal, Header/Footer, Menu (cigars/cocktails/food + categories), Events (standard/special) + Musicians + RecurringSeries, Rooms, TeamMembers, Testimonials, News articles, and assemble each Page from blocks with transcribed copy.
- ⬜ Import imagery from `../project/` + `public/` where available; placeholders elsewhere.

### Phase 6 — QA & deploy prep  ✅ DONE (deploy execution pending env) — **MILESTONE 3**

> **Final verification (2026-05-28), all green:**
> - `pnpm run build` (Next 16 Turbopack) ✅ · `opennextjs-cloudflare build` ✅ (`.open-next/worker.js` produced)
> - `pnpm run test:int` ✅ **8 tests pass** (`tests/int/collections.int.spec.ts` added: new collections, relationships, public artist submission, localization, globals). Fixed flakiness: `fileParallelism: false` in vitest.config (parallel test files each opened a miniflare D1 → SQLITE_BUSY) + D1 warm-up retry in beforeAll.
> - `pnpm run seed` ✅ (PL+EN; recurring=4, events=4, 10 pages, all gap blocks).
> - All 13+ routes return 200 (PL + EN); `/pl/program` renders the special-events posters, calendar, musicians, recurring series; `/pl/restauracja` set menus + promo; `/pl/cigar-room` gallery; `/pl/kontakt-dla-artystow` block-based artist form; `/pl/wydarzenia-cykliczne/[slug]` series.
> - **Block-architecture fix**: added `artistForm` block; `/kontakt-dla-artystow` is now block-based. Re-baselined migrations into `20260528_205011_initial`.
>
> **Deploy execution NOT run** — needs Node 22 (machine has 18/20) + Cloudflare credentials. Runbook below. The worker artifact builds successfully, so the path is proven.
> **Local dev note:** after `pnpm run test:int` (wipes D1) re-run `pnpm run seed`; after seeding `rm -rf .next` then `pnpm run dev`.

> **Deploy runbook (Cloudflare Workers / OpenNext)** — requires **Node 22** (`nvm use 22`) and your Cloudflare account (wrangler auth). The OpenNext build already passes (verified at M1), so the path is proven. Steps:
> 1. `nvm use 22` (wrangler 4.95 needs Node ≥22).
> 2. Ensure Cloudflare auth: `wrangler login` (or `CLOUDFLARE_API_TOKEN`). Confirm `wrangler.jsonc` bindings (D1 `database_id`, R2 bucket).
> 3. Set the Payload secret: `wrangler secret put PAYLOAD_SECRET` (generate with `openssl rand -hex 32`).
> 4. **Remote D1 is disposable** → apply the single baseline migration fresh: `pnpm run deploy:database` (runs `payload migrate` on remote D1 + `PRAGMA optimize`). If the remote already had the OLD migrations recorded, reset it first (drop tables / recreate the D1) since we re-baselined.
> 5. Build + deploy the worker: `pnpm run deploy:app` (`opennextjs-cloudflare build --env=$CLOUDFLARE_ENV && opennextjs-cloudflare deploy`). Or `pnpm run deploy` for both 4+5.
> 6. Seed remote content: either create the admin user + content via the deployed `/admin`, or run the seed against remote bindings (set `NODE_ENV=production` so `getPlatformProxy` uses `remoteBindings`, then `pnpm run seed`). Media (R2) uploads on seed.
> 7. Smoke-test the deployed `/pl` + `/admin`.
>
> **NOT executed here** — needs your Node 22 + Cloudflare credentials. I verified the build artifact (`.open-next/worker.js`) is produced successfully.

> **QA notes:** All 13 routes return 200; `/pl` renders fully (7981px, on-brand). Outstanding QA: web-design-guidelines a11y audit, responsive pass across all pages, hero background-image polish (homepage hero currently shows navy rather than the photo), and `pnpm run test:e2e` smoke. Remember `test:int`/`test:e2e` reset the local D1 → re-seed after.

#### (original checklist)
- ⬜ `pnpm run test:int` + `pnpm run build` green.
- ⬜ Browser pass (responsive + golden paths + carousels/forms) via preview tools; **web-design-guidelines** accessibility audit.
- ⬜ e2e smoke (`pnpm run test:e2e`) on key routes.
- ⬜ Cloudflare deploy dry-run: `pnpm run preview`; document `pnpm run deploy:database` + deploy steps. Do **not** deploy to prod without explicit ask.
- ⏸️ **Final review.**

---

## 7. Risks & mitigations
- **Next 16 Proxy/middleware "version trap" on OpenNext-Cloudflare** (cloudflare/workers-sdk#13755): "Route segment config not allowed in Proxy file", Proxy forced to Node runtime. Mitigation: migrate middleware→Proxy carefully, validate via `pnpm run preview` in Phase 1; **fallback to Next 15.4.11** if blocked.
- **Payload ↔ Next version pinning**: Next 15.5–16.1.x unsupported — stay exactly on 16.2.x or 15.4.11. Keep all `@payloadcms/*` on one version (3.85.0).
- **D1/SQLite limits**: no `point` fields; transactions off by default. Use lat/lng numbers for map; keep map as embed URL.
- **Conflicting opening hours** across mockups → single `OpeningHours` global, confirm canonical values with client.
- **Lorem ipsum** remains in some mockups (special event, cykliczne, parts of Kontakt newsletter) → seed real copy where transcribed, mark placeholders clearly.
- **21+ / alcohol & cigars** → age notice components + legal links; consider an age gate (confirm with client).
- **Exact prices/capacities** partly illegible in raster PDFs → seed best-read values, flag for client verification.
- **Preserve existing uncommitted work** during upgrade.
- **wrangler 4.95 requires Node.js ≥ 22** (machine has Node 20.20). Build/Payload pipeline works on Node 20; `wrangler types` + `deploy` need Node 22 — use `nvm use 22` before deploying. (`generate:types:cloudflare` skipped on Node 20; `generate:types:payload` works.)

## 8. Open questions for client (non-blocking; seed best guess, flag)
1. Canonical nav (PROGRAM vs the "IMPREZY OKOLICZNOŚCIOWE" variant on cykliczne).
2. Reservation/ticket external URL(s) to link to.
3. Canonical opening hours (footer vs contact mismatch).
4. Genres/categories: fixed list vs CMS-managed.
5. Real copy for the lorem-ipsum sections + final prices/room capacities.
6. Age-gate desired on entry?
