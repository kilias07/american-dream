# ADC — Continuation brief (faithful page reproduction + Payload-backed sections)

> Pick this up in a FRESH session. This file is the handoff — you do **not** need the
> previous chat transcript. Working dir: `american-dream/`. Stack: Payload 3.85 +
> Next 16.2.6 + Cloudflare D1/R2 (OpenNext). Design source: 14 PDFs in
> `../project/sites/ADC_*.pdf`. Also read `IMPLEMENTATION_PLAN.md` and the user's
> memory files for prior context.

## Goal (from the user)
1. Go through **the rest of the pages and reproduce them faithfully** vs the PDFs.
2. **Every section must have its representation in Payload** — i.e. be editable in
   `/admin`, not hardcoded in a route/component. Prefer page-builder **blocks** (on the
   `Pages` collection) or **collection/global fields** over hardcoded JSX.
3. **The calendar ("kalendarium") is the top priority.** Do NOT silently implement it —
   first expand the scope WITH THE USER (see §5). They want to spend real time here.

## 1. Current state (already done in a prior session)
- All 14 pages reviewed vs PDFs; major gaps fixed. Build ✅, `pnpm run test:int` 8/8 ✅.
- Footer: PL localization fixed + GODZINY OTWARCIA column (reads `opening-hours` global).
- Rezerwacje: weekday day-pills (from `opening-hours`) + amber REZERWACJA `salesContact` band.
- Cykliczne route: added "Nadchodzące wydarzenia w cyklu" + "Aktualności" sections.
- Program: removed a duplicate teaser; calendar colors special days amber, standard blue.
- Cigars 11→27; article prev/next + date; homepage hero serif; performer instruments PL;
  room default tab = VIP; contact column emblem + serif "Napisz/Zadzwoń do nas"; event share row.
- **Placeholder photos**: 15 grayscale stock images in `public/images/placeholders/` wired
  through the seed `img.*` helpers (`scripts/seed-adc.ts`). Swappable via CMS. Real photos pending.
- **CMS verified**: admin user `admin@americandreamclub.pl` / `ADCadmin!2026` (LOCAL DEV — change).
  `scripts/verify-cms.ts` re-creates it + inventories collections/globals/upload fields + write test.

## 2. Dev workflow gotchas (READ — these cost hours otherwise)
- **Never `rm -rf .next` while the dev server runs** → ENOENT/getcwd crash, 500s. Sequence:
  stop server → `rm -rf .next` → start server.
- After **re-seed**, the homepage Page doc stays **stale in `.next/cache`** (unstable_cache)
  showing OLD image/data refs. Restarting the process is NOT enough — clear `.next` (above).
- `pnpm run test:int` **wipes the local D1** and leaves test fixtures behind. Always
  `pnpm run seed` afterwards. The seed has a `deleteStray` cleanup pass for those fixtures
  (Special Recital, Test Cigar/Test Cigars, Test Pianist, Sax Player, Jan Manager, test-page).
- Fresh DB order: `pnpm payload migrate` → `pnpm run seed` → `pnpm run dev`.
- Seed runs with `pnpm run seed` (tsx), NOT `payload run`.
- **Localization trap**: arrays whose inner fields are `localized` but the ARRAY is not
  array-level localized → writing PL then a fresh EN array REPLACES the rows and drops PL
  (PL falls back to EN). Fix pattern used for the footer in `scripts/seed-adc.ts`: write PL,
  re-read row ids, write EN reusing those ids. Watch for this on any new localized arrays.
- Media served at `/api/media/file/<filename>`. Node 20 ok for dev/build; deploy needs Node 22.

## 3. The "every section → Payload" audit (the main task)
Most pages are already block-driven via the `Pages` collection (good). The gap is **sections
that are hardcoded in route components** and therefore not CMS-editable. Audit each page; for
every hardcoded section decide: convert to a **new block** (config in `src/blocks/`, renderer in
`src/components/blocks/`, register in `src/blocks/index.ts` + `BlockRenderer.tsx` + `Pages.ts`,
then `payload generate:importmap` + `generate:types`), or back it with collection/global fields.

Known hardcoded sections to address (verify against current code):
- `src/app/(frontend)/[locale]/wydarzenia-cykliczne/[slug]/page.tsx` — "Nadchodzące wydarzenia
  w cyklu", gallery, "Pozostałe wydarzenia cykliczne", "Aktualności" are all hardcoded JSX.
  Either make these configurable on the `RecurringSeries` collection (toggles, headings,
  counts) or as blocks. At minimum expose headings/visibility as fields.
- `src/app/(frontend)/[locale]/aktualnosci/[slug]/page.tsx` — hero/back/prev-next/related are
  hardcoded; map labels/toggles to fields where the design needs control.
- `src/app/(frontend)/[locale]/program/[id]/page.tsx` — event detail sections map to Event
  fields (good); the "Nadchodzące wydarzenia" strip + share row are hardcoded — confirm desired.
- `src/Footer/Component.tsx` (hours column), `ContactInfoBlock.tsx`, `EveningPhasesBlock.tsx`
  (day-pills) read globals but render fixed structure — fine if data is editable; confirm.
- Per page, re-open the matching PDF and check **section order, copy, and that every element is
  reachable in the CMS**. The block list lives in `src/blocks/` (≈25 blocks already).

Pages/PDF map: home `ADC_homepage`, restauracja `ADC_restauracja`, bar `ADC_coctail_bar`,
cigar-room `ADC_cigar_room`, program `ADC_program`, program/[id] `ADC_wydarzenia_single_event`
+ `ADC_wydarzenia_special_event`, wydarzenia-cykliczne/[slug] `ADC_wydarzenia_cykliczne`,
twoje-wydarzenie `ADC_Twoje_wydarzenia`, rezerwacje `ADC_Rezerwacje`, aktualnosci
`ADC_Aktualności`, aktualnosci/[slug] `ADC_Artykuł`, kontakt `ADC_Kontakt`,
kontakt-dla-artystow `ADC_Kontakt_artyści`.

## 4. Verification loop (per change)
Use the running dev server + curl text extraction for structure, screenshots for layout.
After CMS/schema changes: `generate:types` + `generate:importmap`, create+apply a migration,
re-seed, `pnpm run test:int` + `pnpm run build`. Confirm each edited page in `/admin` too.

## 5. CALENDAR ("kalendarium") — ✅ DONE (2026-06-07, built to the FINALIZED SPEC below)
Built and verified (build ✅, test:int 8/8 ✅). Recurrence removed (migration), Europe/Warsaw TZ
throughout, 7-col Monday grid with adjacent-month bleed + nav bounds, per-event popover, add-to-
calendar (.ics + Google), mobile agenda list, a11y grid. Series + event-detail page sections are now
Payload-editable. The historical breakdown is kept below for reference.

This was the priority. Do not just code it — bring the breakdown below to the user and let them
choose scope. Current implementation today:
- `src/components/blocks/EventsFullCalendar.tsx` — client month grid, Monday-first, prev/next
  month, day badge amber(special)/blue(standard), cell card = (placeholder) thumb + date badge +
  title + time + price, links to `ticketUrl` or `/program/[id]`.
- `src/components/blocks/EventsCalendarBlock.tsx` — server; fetches up to 1000 events, expands
  via `expandEvents`, renders `EventsFullCalendar` (variant `full`) or teaser.
- `src/lib/recurring-events.ts` — `expandEvents()` supports `repeatType` `weekly` (by
  `repeatDays`) and `monthly` (by day-of-month), bounded by `repeatUntil`.
- `src/app/api/events-by-month/route.ts` — month fetch for client nav.
- `Events` collection fields: `date`, `endTime`, `price`, `ticketUrl`, `reservationUrl`,
  `eventType` (standard|special), `isRecurring`, `repeatType` (weekly|monthly), `repeatDays`,
  `repeatUntil`, `recurringSeries`, `genres`, `performers`, etc.

### FINALIZED SPEC (decided with the user 2026-06-07 — build to this)
1. **NO recurrence at all.** Every event is a single, unique, individually-created document with
   one concrete date/time. **Remove** recurrence machinery:
   - Drop `Events` fields `isRecurring`, `repeatType`, `repeatDays`, `repeatUntil` (schema change
     → migration + `generate:types` + `generate:importmap`).
   - Simplify `src/lib/recurring-events.ts`: `expandEvents` becomes a plain **range filter**
     (return events whose `date` ∈ [rangeStart, rangeEnd); no expansion). Update the month API
     and calendar accordingly.
   - Seed: convert the 6 `recurringEvents` in `scripts/seed-adc.ts` into individual dated events
     (no repeat fields). Seed a realistic spread across the month for testing.
2. **Holidays/exceptions: N/A.** A day is just a day — an editor either creates an event there or
   not. No skip/exception mechanism needed (falls out of "no recurrence").
3. **Every event is unique + DUPLICATE workflow.** Editors must be able to **duplicate an existing
   event** as a starting point and then change anything (e.g. a different lineup on Friday). Enable
   Payload's built-in row **Duplicate** action on `Events` (do NOT build a "pick from template
   list" UI — duplication of real docs only).
4. **Month grid = full Monday-aligned grid with adjacent-month bleed.** The grid always starts on
   Monday: leading cells before the 1st show the **real trailing days of the previous month**, and
   after the last day show the **real leading days of the next month** (muted), and events on those
   days render too. (Today `buildCalendarGrid` pads with `null` — change to real prev/next dates.)
5. **No filters.**
6. **Add to calendar (per event):** **iCal (.ics) download** + **Google Calendar** link (in the
   day popover and/or on the event detail page), times in Europe/Warsaw.
7. **Nav bounds:** forward up to **current month + 3** (no further); backward down to the month of
   the **earliest event**. Disable prev/next at the bounds. Past events stay visible (greyed is fine).
8. **Single source of truth:** `Events` is the ONLY source. Upcoming-events teasers, the
   special-events carousel, and series ("wydarzenia cykliczne") pages all DERIVE from `Events`
   (filter by date / `eventType` / `recurringSeries`). No duplicate event lists anywhere.
   NOTE: **series stay as a concept** — a themed brand (e.g. Jazzowe Wtorki) with its own page;
   each event is created individually and linked via `recurringSeries`. (Confirm with user if unsure.)
9. **CMS UX:** generally OK. Improvements to make: remove the now-unused recurrence fields from the
   Events edit UI; group fields sensibly (When / Details / Lineup / Links); make Duplicate one click.
10. **Click a day's event → POPOVER** with details (title, time, price, lineup/genres, reserve/ticket
    CTA, link to `/program/[id]`, add-to-calendar). Match the PDF (`ADC_program.pdf`) for content/layout.
11. **Timezone: Europe/Warsaw ONLY** — all formatting/grouping server + client (use a fixed
    `timeZone: 'Europe/Warsaw'`); verify DST.
12. **Performance: no special work** (low traffic/volume expected).
13. **Accessibility (builder's call):** `role=grid`/`gridcell`, arrow-key navigation across days,
    Enter/Space to open the event popover, Esc + focus-return to close, labelled month-nav buttons,
    `aria-current="date"` on today.

**Build order (new context):** (a) strip recurrence from `Events` + simplify `expandEvents` + seed
individual events → `generate:types`/`importmap` + migration; (b) month grid with real adjacent-month
days + nav bounds (now+3 fwd / earliest-event back); (c) event popover; (d) add-to-calendar (.ics +
Google); (e) confirm carousels/series all derive from `Events`; (f) enforce Europe/Warsaw TZ; (g) a11y;
(h) re-seed + verify vs `ADC_program.pdf` (grid, popover, badges) + mobile; keep everything CMS-editable.

## Key files
- Blocks: `src/blocks/*` (config) + `src/components/blocks/*` (renderers) + `src/blocks/index.ts`
  + `src/components/BlockRenderer.tsx` + `src/collections/Pages.ts`.
- Collections: `src/collections/*` (Events, Musicians, RecurringSeries, MenuItems, MenuCategories,
  Rooms, TeamMembers, Testimonials, ArtistApplications, Posts, Categories, Media, Users).
- Globals: `src/globals/*` (Header, Footer, SiteSettings, OpeningHours, Legal).
- Routes: `src/app/(frontend)/[locale]/*`. Calendar lib: `src/lib/recurring-events.ts`.
- Seed: `scripts/seed-adc.ts` (img helpers, footer id-reuse pattern, stray cleanup).
- CMS check: `scripts/verify-cms.ts`.
