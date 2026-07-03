/**
 * American Dream Club — full content seed (Polish + English).
 * Run with: pnpm run seed   (i.e. `tsx scripts/seed-adc.ts` — NOT `payload run`,
 * which doesn't await the top-level promise on this stack).
 *
 * Idempotent: skips/updates existing docs by a natural key. Seeds globals,
 * media (from public/sites + public/images), menus, musicians, events, rooms,
 * team, testimonials, news, and the page-builder Pages assembled from blocks.
 *
 * Each document is created in the `pl` locale first (the canonical content),
 * then the LOCALIZED text fields are translated and written to the `en` locale
 * via a second `payload.update` / `payload.updateGlobal` call. Non-localized
 * fields (numbers, urls, emails, dates, enums, relationships) are shared and
 * only written once. See the `upsert` / `setGlobal` / `page` helpers below.
 */
import 'dotenv/config'
import os from 'os'
import path from 'path'
import * as fsp from 'fs/promises'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'
import { warsawParts } from '../src/lib/recurring-events'
import { legalContentPL, legalContentEN } from './legal-content'

const LOCALE = 'pl' as const
const EN = 'en' as const
const ROOT = process.cwd()

// ── lexical richText helper ────────────────────────────────────────────────
function rich(paragraphs: string[]) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr' as const,
        textFormat: 0,
        children: [
          { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 },
        ],
      })),
    },
  }
}

async function run() {
  const payload = await getPayload({ config: configPromise })
  const log = (m: string) => payload.logger.info(m)

  // ── Cleanup stray test records ─────────────────────────────────────────────
  // These are NOT created by this seed — they're leftover dev/admin test data
  // (an orphan "Special Recital" event, a "Test Cigar" menu item/category, and a
  // "test-page") that pollute the calendar, special-events carousel and cigar
  // menu. Remove them so the public site matches the design exactly.
  async function deleteStray(collection: string, where: Record<string, unknown>) {
    try {
      const found = await payload.find({
        collection: collection as 'pages',
        where: where as never,
        limit: 50,
        locale: LOCALE,
      })
      for (const doc of found.docs) {
        await payload.delete({ collection: collection as 'pages', id: doc.id })
        log(`🗑  removed stray ${collection} #${doc.id}`)
      }
    } catch (e) {
      log(`⚠ stray cleanup ${collection} failed: ${(e as Error).message}`)
    }
  }
  await deleteStray('events', { title: { equals: 'Special Recital' } })
  await deleteStray('menu-items', { name: { contains: 'Test Cigar' } })
  await deleteStray('menu-categories', { title: { contains: 'Test Cigar' } })
  await deleteStray('pages', { slug: { equals: 'test-page' } })
  await deleteStray('musicians', { name: { contains: 'Test' } })
  await deleteStray('musicians', { slug: { equals: 'sax-player' } })
  await deleteStray('team-members', { name: { equals: 'Jan Manager' } })

  // ── Media ────────────────────────────────────────────────────────────────
  const mediaCache = new Map<string, number | null>()
  async function media(rel: string, alt: string): Promise<number | null> {
    if (mediaCache.has(rel)) return mediaCache.get(rel)!
    const filename = path.basename(rel)
    try {
      const existing = await payload.find({
        collection: 'media',
        where: { filename: { equals: filename } },
        limit: 1,
      })
      if (existing.docs[0]) {
        mediaCache.set(rel, existing.docs[0].id as number)
        return existing.docs[0].id as number
      }
      const created = await payload.create({
        collection: 'media',
        data: { alt },
        filePath: path.resolve(ROOT, rel),
      })
      mediaCache.set(rel, created.id as number)
      return created.id as number
    } catch (e) {
      log(`⚠ media "${rel}" failed: ${(e as Error).message}`)
      mediaCache.set(rel, null)
      return null
    }
  }

  // PLACEHOLDER PHOTOS. The real ADC_*.jpg files are full page-design screenshots
  // (text baked in), so they can't be used as backgrounds. These grayscale stock
  // photos in public/images/placeholders/ stand in so the layout reads correctly;
  // the client replaces each one via the CMS (every block/item has an `image`/
  // `heroImage` upload field). Swapping a photo in /admin needs no code change.
  const ph = (name: string, alt: string) => () =>
    media(`public/images/placeholders/${name}.jpg`, alt)
  const img = {
    home: ph('home', 'Klub muzyczny — wnętrze'),
    restauracja: ph('restauracja', 'Restauracja — danie'),
    bar: ph('bar', 'Cocktail bar — koktajl'),
    cigar: ph('cigar', 'Cigar room — wnętrze'),
    program: ph('program', 'Koncert na żywo'),
    twoje: ph('twoje', 'Impreza okolicznościowa'),
    single: ph('single', 'Wydarzenie muzyczne'),
    special: ph('special', 'Wydarzenie specjalne'),
    gallery: ph('gallery', 'Galeria klubu'),
    cigarMenu: ph('cigar-menu', 'Karta cygar'),
    logo: () => media('public/images/logo-on-navy.jpg', 'American Dream Club logo'),
  }
  // Hero background video — uploaded as Media so it lives in R2 (NOT in /public,
  // which would bundle it as a Workers static asset and hit the 25 MiB limit).
  const heroVideo = () => media('scripts/assets/hero-banner.mp4', 'American Dream Club — film w tle hero')

  // ── helper: per-page hero background (its OWN media doc) ────────────────────
  // `media()` caches by source path, so two heroes pointing at the same
  // placeholder would share ONE media doc — editing/replacing that image then
  // bleeds across both pages. `heroImg` gives every page hero its own document
  // (filename `<slug>-hero.jpg`) by copying the source to a uniquely-named temp
  // file and uploading via `filePath` (the in-memory buffer path does NOT
  // upload reliably through the remote R2 proxy). Cached per slug so the pl + en
  // hero of the SAME page correctly share one doc; different pages never do.
  async function heroImg(slug: string, sourceRel: string, alt: string): Promise<number | null> {
    const cacheKey = `hero:${slug}`
    if (mediaCache.has(cacheKey)) return mediaCache.get(cacheKey)!
    const filename = `${slug}-hero${path.extname(sourceRel) || '.jpg'}`
    try {
      const existing = await payload.find({
        collection: 'media',
        where: { filename: { equals: filename } },
        limit: 1,
      })
      if (existing.docs[0]) {
        mediaCache.set(cacheKey, existing.docs[0].id as number)
        return existing.docs[0].id as number
      }
      const tmp = path.join(os.tmpdir(), filename)
      await fsp.copyFile(path.resolve(ROOT, sourceRel), tmp)
      try {
        const created = await payload.create({ collection: 'media', data: { alt }, filePath: tmp })
        mediaCache.set(cacheKey, created.id as number)
        return created.id as number
      } finally {
        await fsp.unlink(tmp).catch(() => {})
      }
    } catch (e) {
      log(`⚠ heroImg "${slug}" failed: ${(e as Error).message}`)
      mediaCache.set(cacheKey, null)
      return null
    }
  }
  // ── helper: unique media doc per upload SLOT (menu tiles etc.) ─────────────
  // Same rationale as `heroImg`: every slot that the client will replace
  // independently must own its media doc, or re-uploading one image bleeds into
  // every other slot sharing the doc. Filename = `<key>.jpg`; cached per key so
  // the pl + en copy of the SAME slot share one doc.
  async function slotImg(key: string, sourceRel: string, alt: string): Promise<number | null> {
    const cacheKey = `slot:${key}`
    if (mediaCache.has(cacheKey)) return mediaCache.get(cacheKey)!
    const filename = `${key}${path.extname(sourceRel) || '.jpg'}`
    try {
      const existing = await payload.find({
        collection: 'media',
        where: { filename: { equals: filename } },
        limit: 1,
      })
      if (existing.docs[0]) {
        mediaCache.set(cacheKey, existing.docs[0].id as number)
        return existing.docs[0].id as number
      }
      const tmp = path.join(os.tmpdir(), filename)
      await fsp.copyFile(path.resolve(ROOT, sourceRel), tmp)
      try {
        const created = await payload.create({ collection: 'media', data: { alt }, filePath: tmp })
        mediaCache.set(cacheKey, created.id as number)
        return created.id as number
      } finally {
        await fsp.unlink(tmp).catch(() => {})
      }
    } catch (e) {
      log(`⚠ slotImg "${key}" failed: ${(e as Error).message}`)
      mediaCache.set(cacheKey, null)
      return null
    }
  }

  // Source placeholder for each page's hero (client replaces per page in CMS).
  const PLACEHOLDER = (name: string) => `public/images/placeholders/${name}.jpg`
  // Distinct portrait placeholders for musicians (rotated round-robin).
  const musicianPhotos = [
    'musician-1', 'musician-2', 'musician-3', 'musician-4', 'musician-5', 'musician-6',
  ]
  const musicianPhoto = (i: number) =>
    media(`public/images/placeholders/${musicianPhotos[i % musicianPhotos.length]}.jpg`, 'Muzyk')

  // ── helper: upsert by slug / unique field ──────────────────────────────────
  // Creates/updates the doc in PL (the canonical content). If `en` is provided
  // it must contain ONLY the localized text fields (in English) — those are
  // written to the `en` locale in a second pass on the same doc, leaving every
  // non-localized (shared) field untouched. Idempotent / re-runnable.
  async function upsert(
    collection: string,
    where: Record<string, unknown>,
    data: Record<string, unknown>,
    en?: Record<string, unknown>,
  ): Promise<number> {
    // Match on the canonical PL locale: several natural keys (event title,
    // menu-item name, menu-category title) are localized, and `find` filters
    // against the *default* locale (en) unless told otherwise — which would
    // miss PL-only docs and create duplicates on re-run.
    const existing = await payload.find({
      collection: collection as 'pages',
      where: where as never,
      limit: 1,
      locale: LOCALE,
    })
    let id: number
    if (existing.docs[0]) {
      const updated = await payload.update({
        collection: collection as 'pages',
        id: existing.docs[0].id,
        data: data as never,
        locale: LOCALE,
      })
      id = updated.id as number
    } else {
      const created = await payload.create({
        collection: collection as 'pages',
        data: data as never,
        locale: LOCALE,
      })
      id = created.id as number
    }
    if (en) {
      await payload.update({
        collection: collection as 'pages',
        id,
        data: en as never,
        locale: EN,
      })
    }
    return id
  }

  // PL canonical, then EN localized-only overrides in a second pass.
  async function setGlobal(
    slug: string,
    data: Record<string, unknown>,
    en?: Record<string, unknown>,
  ) {
    await payload.updateGlobal({ slug: slug as 'header', data: data as never, locale: LOCALE })
    if (en) {
      await payload.updateGlobal({ slug: slug as 'header', data: en as never, locale: EN })
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // GLOBALS
  // ════════════════════════════════════════════════════════════════════════
  log('Seeding globals…')
  await setGlobal('site-settings', {
    siteName: 'American Dream Club',
    address: 'ul. Dominikańska 9, 61-762 Poznań',
    phones: [{ label: 'Rezerwacje', number: '+48 500 210 333' }],
    emails: [
      { label: 'Kontakt', email: 'info@americandreamclub.pl' },
      { label: 'Rezerwacje', email: 'rezerwacja@americandreamclub.pl' },
    ],
    social: [
      { platform: 'facebook', url: 'https://www.facebook.com/americandreamclubpoznan' },
      { platform: 'instagram', url: 'https://www.instagram.com/americandreamclubpoznan/' },
      { platform: 'youtube', url: 'https://www.youtube.com/@americandreamclubpoznan' },
    ],
    mapEmbedUrl:
      'https://www.google.com/maps?q=ul.+Dominika%C5%84ska+9,+61-762+Pozna%C5%84&output=embed',
    reservationUrl: 'tel:+48500210333',
    reviewAggregate: '478 opinii · 4,8/5 w Google',
    metaDescription:
      'American Dream Club — restauracja i klub jazzowy w sercu Poznania. Koncerty na żywo, autorska kuchnia, bar i cigar room.',
  }, {
    // localized: address, reviewAggregate, metaDescription
    address: '9 Dominikańska St., 61-762 Poznań',
    reviewAggregate: '478 reviews · 4.8/5 on Google',
    metaDescription:
      'American Dream Club — a restaurant and jazz club in the heart of Poznań. Live concerts, a signature kitchen, bar and cigar room.',
  })

  await setGlobal('ui-labels', {
    common: {
      readMore: 'Czytaj więcej',
      openingHours: 'Godziny otwarcia',
      closed: 'Zamknięte',
      newsletter: 'Newsletter',
      noNews: 'Brak aktualności.',
      writeToUs: 'Napisz do nas',
      callUs: 'Zadzwoń do nas',
    },
    days: {
      monday: 'Poniedziałek',
      tuesday: 'Wtorek',
      wednesday: 'Środa',
      thursday: 'Czwartek',
      friday: 'Piątek',
      saturday: 'Sobota',
      sunday: 'Niedziela',
    },
    forms: {
      name: 'Imię',
      phone: 'Telefon',
      email: 'Adres email',
      message: 'Wiadomość',
      consent: 'Akceptuję politykę prywatności',
      submit: 'Wyślij wiadomość',
      sending: 'Wysyłanie…',
      success: 'Dziękujemy! Wiadomość została wysłana.',
      error: 'Wystąpił błąd. Spróbuj ponownie później.',
      contactHeading: 'SKONTAKTUJ SIĘ Z NAMI',
    },
    menu: {
      fullMenuPdf: 'Zobacz całe menu (PDF)',
      legendPair: 'danie dla dwóch osób',
      legendVeg: 'danie wegetariańskie',
      legendVegan: 'danie wegańskie',
    },
    event: {
      reserveTable: 'Zarezerwuj stolik',
      specialEvent: 'Wydarzenie specjalne',
    },
  }, {
    common: {
      readMore: 'Read more',
      openingHours: 'Opening hours',
      closed: 'Closed',
      newsletter: 'Newsletter',
      noNews: 'No news yet.',
      writeToUs: 'Write to us',
      callUs: 'Call us',
    },
    days: {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
    },
    forms: {
      name: 'Name',
      phone: 'Phone',
      email: 'Email address',
      message: 'Message',
      consent: 'I accept the privacy policy',
      submit: 'Send message',
      sending: 'Sending…',
      success: 'Thank you! Your message has been sent.',
      error: 'Something went wrong. Please try again later.',
      contactHeading: 'CONTACT US',
    },
    menu: {
      fullMenuPdf: 'See full menu (PDF)',
      legendPair: 'dish for two',
      legendVeg: 'vegetarian dish',
      legendVegan: 'vegan dish',
    },
    event: {
      reserveTable: 'Reserve a table',
      specialEvent: 'Special event',
    },
  })

  await setGlobal('opening-hours', {
    days: [
      { day: 'monday', closed: true, openTime: '', closeTime: '' },
      { day: 'tuesday', closed: false, openTime: '17:00', closeTime: '23:00' },
      { day: 'wednesday', closed: false, openTime: '17:00', closeTime: '23:00' },
      { day: 'thursday', closed: false, openTime: '17:00', closeTime: '23:00' },
      { day: 'friday', closed: false, openTime: '17:00', closeTime: '24:00' },
      { day: 'saturday', closed: false, openTime: '17:00', closeTime: '24:00' },
      { day: 'sunday', closed: false, openTime: '16:00', closeTime: '21:00' },
    ],
  })

  // Legal docs are rich text (formatted), kept consistent with the old site
  // americandreamclub.pl. See scripts/legal-content.ts for the source notes.
  await setGlobal('legal', {
    regulamin: legalContentPL.regulamin,
    privacy: legalContentPL.privacy,
    companyData: legalContentPL.companyData,
    age21Notice:
      'Uprzejmie informujemy, że American Dream Club jest miejscem przeznaczonym wyłącznie dla osób dorosłych powyżej 21. roku życia. Dziękujemy za zrozumienie i zapraszamy serdecznie wszystkich pełnoletnich miłośników dobrej zabawy!',
  }, {
    regulamin: legalContentEN.regulamin,
    privacy: legalContentEN.privacy,
    companyData: legalContentEN.companyData,
    age21Notice:
      'Please note that American Dream Club is a venue reserved exclusively for adults aged 21 and over. Thank you for understanding — we warmly welcome all guests of legal age who love a great night out!',
  })

  const logoId = await img.logo()
  await setGlobal('header', {
    logo: logoId,
    topBarText: 'Restauracja & Jazz Club — kolacja i drinki w trakcie koncertu na żywo',
    phone: '+48 500 210 333',
    address: 'ul. Dominikańska 9, 61-762 Poznań',
    // Social links live in the `site-settings` global (single source of truth).
    navItems: [
      { link: { type: 'custom', label: 'RESTAURACJA', url: '/restaurant' } },
      { link: { type: 'custom', label: 'PROGRAM', url: '/events' } },
      { link: { type: 'custom', label: 'TWOJE WYDARZENIE', url: '/business' } },
      { link: { type: 'custom', label: 'BAR', url: '/bar-and-cocktails' } },
      { link: { type: 'custom', label: 'CIGAR ROOM', url: '/cigar-lounge' } },
      { link: { type: 'custom', label: 'KONTAKT', url: '/contact' } },
    ],
    ctaEnabled: true,
    ctaButton: { type: 'custom', label: 'ZAREZERWUJ', url: '/rezerwacje' },
  }, {
    // localized: only topBarText (nav labels live in non-localized link groups)
    topBarText: 'Restaurant & Jazz Club — dinner and drinks during a live concert',
  })

  // Footer: navColumns/bottomBarLinks are arrays whose *inner* fields are
  // localized but the array itself is NOT array-level localized. Writing PL then
  // a fresh EN array would make Payload replace the rows and drop PL → the PL
  // site falls back to EN. Fix: write PL first, re-read the generated row ids,
  // then write EN reusing those ids so each locale persists on the same rows.
  await payload.updateGlobal({
    slug: 'footer' as 'header',
    locale: LOCALE,
    data: {
      logo: logoId,
      newsletter: {
        heading: 'NEWSLETTER',
        placeholder: 'Adres email',
        buttonLabel: 'DOŁĄCZ',
        consentText: 'Akceptuję politykę prywatności',
      },
      ageBadge: true,
      navColumns: [
        {
          heading: 'OFERTA',
          links: [
            { label: 'Wydarzenia muzyczne', url: '/events' },
            { label: 'Restauracja', url: '/restaurant' },
            { label: 'Cocktail Bar & Wino', url: '/bar-and-cocktails' },
            { label: 'Cygara', url: '/cigar-lounge' },
          ],
        },
        {
          heading: 'REZERWACJE',
          links: [
            { label: 'Rezerwacje indywidualne', url: '/rezerwacje' },
            { label: 'Imprezy prywatne', url: '/business' },
            { label: 'Imprezy firmowe', url: '/business' },
            { label: 'Kontakt', url: '/contact' },
          ],
        },
      ],
      bottomBarLinks: [
        { label: 'AMERICAN DREAM CLUB® 2026 Wszelkie prawa zastrzeżone', url: '/' },
        { label: 'Regulamin klubu', url: '/regulamin' },
        { label: 'Polityka prywatności', url: '/privacy' },
        { label: 'Dane firmy', url: '/dane-firmy' },
      ],
      // Social links live in the `site-settings` global (single source of truth).
    } as never,
  })

  const footerPL = await payload.findGlobal({ slug: 'footer' as 'header', locale: LOCALE, depth: 0 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fp = footerPL as any
  const enNav = [
    {
      heading: 'WHAT WE OFFER',
      labels: ['Live music events', 'Restaurant', 'Cocktail Bar & Wine', 'Cigars'],
    },
    {
      heading: 'RESERVATIONS',
      labels: ['Individual reservations', 'Private parties', 'Corporate events', 'Contact'],
    },
  ]
  const enBottom = [
    'AMERICAN DREAM CLUB® 2026 All rights reserved',
    'Club rules',
    'Privacy policy',
    'Company details',
  ]
  await payload.updateGlobal({
    slug: 'footer' as 'header',
    locale: EN,
    data: {
      newsletter: {
        heading: 'NEWSLETTER',
        placeholder: 'Email address',
        buttonLabel: 'JOIN',
        consentText: 'I accept the privacy policy',
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navColumns: (fp.navColumns ?? []).map((col: any, i: number) => ({
        id: col.id,
        heading: enNav[i]?.heading ?? col.heading,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        links: (col.links ?? []).map((l: any, j: number) => ({
          id: l.id,
          label: enNav[i]?.labels[j] ?? l.label,
          url: l.url,
        })),
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bottomBarLinks: (fp.bottomBarLinks ?? []).map((b: any, i: number) => ({
        id: b.id,
        label: enBottom[i] ?? b.label,
        url: b.url,
      })),
    } as never,
  })

  // ════════════════════════════════════════════════════════════════════════
  // MENU CATEGORIES + ITEMS
  // ════════════════════════════════════════════════════════════════════════
  log('Seeding menu…')
  // `title` is localized; pass an English title for the EN pass.
  async function menuCat(title: string, menuType: string, order: number, titleEn?: string) {
    return upsert(
      'menu-categories',
      { title: { equals: title } },
      { title, menuType, order },
      { title: titleEn ?? title },
    )
  }
  // `en` holds the English values for the localized fields only
  // (name, description, ingredients, origin, tag, options[].label).
  async function menuItem(d: Record<string, unknown>, en?: Record<string, unknown>) {
    return upsert('menu-items', { name: { equals: d.name } }, d, en)
  }

  // Cigars
  const catNikaragua = await menuCat('Nikaragua', 'cigars', 1, 'Nicaragua')
  const catDominikana = await menuCat('Dominikana', 'cigars', 2, 'Dominican Republic')
  const catKuba = await menuCat('Kuba', 'cigars', 3, 'Cuba')
  const cigars: [string, number, number][] = [
    ['Oliva Serie G Cameroon', 37, catNikaragua],
    ['Oliva Connecticut Reserve Robusto', 75, catNikaragua],
    ['Plasencia Alma Del Campo Tribu', 117, catNikaragua],
    ['Rocky Patel Vintage 1990 Junior', 45, catNikaragua],
    ['Aurora 1903 Ed Corojo Corona', 77, catDominikana],
    ['La Flor Dominicana Andalusian Bull', 204, catDominikana],
    ['La Flor Dominicana Oro No. 6 Tubos', 93, catDominikana],
    ['Cohiba Siglo II', 237, catKuba],
    ['Montecristo No. 4', 147, catKuba],
    ['Partagas Serie D No. 4', 147, catKuba],
    ['Romeo y Julieta Romeo No. 1', 89, catKuba],
    // Additional cigars transcribed from ADC_cigar_room.pdf. Prices are best-read
    // estimates (PDF raster illegible) — verify against the real menu.
    ['Oliva Serie G Doble Robusto', 49, catNikaragua],
    ['Oliva Connecticut Reserve Petit Corona', 59, catNikaragua],
    ['Oliva Serie V No. 4', 69, catNikaragua],
    ['Plasencia Alma Del Cielo Celeste Robusto', 129, catNikaragua],
    ['Plasencia Reserva Original Resticos', 99, catNikaragua],
    ['Rocky Patel Vintage 1999 Connecticut Corona', 55, catNikaragua],
    ['Rocky Patel Vintage 2003 Cabinet Selection Junior', 59, catNikaragua],
    ['Rocky Patel Edge 20th Anniversary Robusto', 75, catNikaragua],
    ['Laura Chevin Classik No. 33 Corona', 69, catDominikana],
    ['Laura Chevin Virginia No. 2 Belicoso', 79, catDominikana],
    ['PDR El Trovador Rosado Robusto', 85, catDominikana],
    ['PDR & Flores Gran Reserva Desflorado Half Corona', 75, catDominikana],
    ['La Flor Dominicana Ligero No. 250 Tubos', 99, catDominikana],
    ['La Flor Dominicana Oro No. 6 Natural Tubos', 93, catDominikana],
    ['Hoyo de Monterrey Epicure Especial Tubos', 179, catKuba],
    ['H. Upmann Regalias', 119, catKuba],
  ]
  let o = 0
  for (const [name, price, category] of cigars) {
    // Cigar names are brand names — identical in both locales, but `name` is
    // localized so it must be written for EN too (otherwise it falls back empty).
    await menuItem(
      { name, price, currency: 'zł', menuType: 'cigars', category, order: o++, available: true },
      { name },
    )
  }

  // Cocktails (named after jazz legends)
  const catCocktails = await menuCat('KOKTAJLE AUTORSKIE', 'cocktails', 1, 'SIGNATURE COCKTAILS')
  const cocktails: [string, string, string][] = [
    ['Miles Davis', 'espresso, syrop cynamonowy, bourbon, likier kawowy', 'espresso, cinnamon syrup, bourbon, coffee liqueur'],
    ['Ella Fitzgerald', 'gin, prosecco, syrop bzowy, cytryna', 'gin, prosecco, elderflower syrup, lemon'],
    ['Duke Ellington', 'Havana Club, wódka, purée z marakui, limonka', 'Havana Club, vodka, passion fruit purée, lime'],
    ['Louis Armstrong', 'rum, ananas, sok z limonki, angostura', 'rum, pineapple, lime juice, angostura'],
    ['Diana Krall', 'wódka, likier różany, grejpfrut, tonik', 'vodka, rose liqueur, grapefruit, tonic'],
    ['Frank Sinatra', 'whiskey, wermut, bitters, skórka pomarańczy', 'whiskey, vermouth, bitters, orange peel'],
    ['Herbie Hancock', 'tequila, mezcal, agawa, chili, limonka', 'tequila, mezcal, agave, chili, lime'],
  ]
  o = 0
  for (const [name, ingredients, ingredientsEn] of cocktails) {
    await menuItem({
      name, ingredients, price: 39, currency: 'zł', menuType: 'cocktails',
      category: catCocktails, tag: 'KOKTAJLE AUTORSKIE', image: await img.bar(), order: o++, available: true,
    }, {
      name, ingredients: ingredientsEn, tag: 'SIGNATURE COCKTAILS',
    })
  }

  // Food
  const catPrzystawki = await menuCat('Przystawki', 'food', 1, 'Starters')
  const catZupy = await menuCat('Zupy', 'food', 2, 'Soups')
  const catDania = await menuCat('Dania główne', 'food', 3, 'Main courses')
  const catBurgery = await menuCat('Burgery', 'food', 4, 'Burgers')
  const catSalatki = await menuCat('Sałatki', 'food', 5, 'Salads')
  const catDesery = await menuCat('Desery', 'food', 6, 'Desserts')
  // [plName, plDescription, price, category, enName, enDescription]
  const food: [string, string, number, number, string, string][] = [
    ['Tatar wołowy', 'klasyczny tatar z polędwicy, żółtko, kapary, szczypiorek', 49, catPrzystawki, 'Beef Tartare', 'classic tenderloin tartare, egg yolk, capers, chives'],
    ['Jambalaya', 'ryż, krewetki, chorizo, papryka, kreolskie przyprawy', 59, catPrzystawki, 'Jambalaya', 'rice, prawns, chorizo, peppers, Creole spices'],
    ['Boston Chowder', 'kremowa zupa rybna z małżami, ziemniaki, bekon', 39, catZupy, 'Boston Chowder', 'creamy fish soup with clams, potatoes, bacon'],
    ['Krem z piwa', 'zupa piwna z serem cheddar, grzanki', 32, catZupy, 'Beer Cream Soup', 'beer soup with cheddar, croutons'],
    ['Texas Rib Eye Steak', 'stek z antrykotu 300g, masło ziołowe, frytki', 119, catDania, 'Texas Rib Eye Steak', '300g rib eye steak, herb butter, fries'],
    ['Żeberka BBQ', 'żeberka wieprzowe duszone w sosie BBQ, coleslaw, frytki', 79, catDania, 'BBQ Ribs', 'pork ribs braised in BBQ sauce, coleslaw, fries'],
    ['Fajitas', 'kurczak / wołowina, papryka, cebula, tortilla, guacamole', 65, catDania, 'Fajitas', 'chicken / beef, peppers, onion, tortilla, guacamole'],
    ['Pappardelle', 'makaron, ragù wołowe, parmezan', 52, catDania, 'Pappardelle', 'pasta, beef ragù, parmesan'],
    ['Smash Burger', 'podwójna wołowina, cheddar, ogórek, sos klubowy', 55, catBurgery, 'Smash Burger', 'double beef, cheddar, pickle, house sauce'],
    ['BBQ Burger', 'wołowina, bekon, cebula karmelizowana, sos BBQ', 59, catBurgery, 'BBQ Burger', 'beef, bacon, caramelised onion, BBQ sauce'],
    ['American Dream Club Burger', 'podwójna wołowina, bekon, cheddar, jajko sadzone, BBQ', 65, catBurgery, 'American Dream Club Burger', 'double beef, bacon, cheddar, fried egg, BBQ'],
    ['Sałatka Cezar', 'sałata rzymska, kurczak grillowany, parmezan, croutons, sos cezar', 45, catSalatki, 'Caesar Salad', 'romaine, grilled chicken, parmesan, croutons, Caesar dressing'],
    ['Szarlotka', 'ciepła szarlotka, lody waniliowe', 28, catDesery, 'Apple Pie', 'warm apple pie, vanilla ice cream'],
    ['Tiramisu', 'klasyczne tiramisu z mascarpone', 29, catDesery, 'Tiramisu', 'classic tiramisu with mascarpone'],
  ]
  o = 0
  for (const [name, description, price, category, nameEn, descriptionEn] of food) {
    await menuItem(
      { name, description, price, currency: 'zł', menuType: 'food', category, image: await img.restauracja(), order: o++, available: true },
      { name: nameEn, description: descriptionEn },
    )
  }

  // ════════════════════════════════════════════════════════════════════════
  // MUSICIANS
  // ════════════════════════════════════════════════════════════════════════
  log('Seeding musicians…')
  // [name, plInstrument, enInstrument] — `instrument` is localized; `name` is not.
  const musicians: [string, string, string][] = [
    ['Zuzanna Babiak', 'WOKAL', 'VOCALS'],
    ['Jacek Szwaj', 'FORTEPIAN', 'PIANO'],
    ['Flavio Gullotta', 'KONTRABAS', 'DOUBLE BASS'],
    ['Jakub Królikowski', 'FORTEPIAN', 'PIANO'],
    ['Adam Czech', 'GITARA | WOKAL', 'GUITAR | VOCALS'],
    ['Wojciech Braszak', 'SAKSOFON', 'SAXOPHONE'],
    ['Mikołaj Wienke', 'SAKSOFON', 'SAXOPHONE'],
    ['Maciej Sokołowski', 'SAKSOFON', 'SAXOPHONE'],
    ['Jakub Kraszewski', 'FORTEPIAN', 'PIANO'],
  ]
  const musicianIds: Record<string, number> = {}
  o = 0
  for (const [name, instrument, instrumentEn] of musicians) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const instLow = instrument.toLowerCase()
    const instLowEn = instrumentEn.toLowerCase()
    musicianIds[name] = await upsert(
      'musicians',
      { slug: { equals: slug } },
      {
        name, slug, instrument, order: o++, photo: await musicianPhoto(o),
        bio: `${name} — ${instLow}. Wykształcony muzyk związany z poznańską sceną koncertową i środowiskiem akademickim.`,
        body: rich([
          `${name} to ceniony instrumentalista (${instLow}), dla którego każdy koncert jest spotkaniem z publicznością. Gra z autentycznym zaangażowaniem i osobistą interpretacją — bez estradowego patosu, za to z prawdziwą muzyczną energią.`,
          `Na scenie American Dream Club usłyszysz go w repertuarze obejmującym największe amerykańskie i światowe standardy: jazz, swing, blues i soul. To brzmienia, które przez dekady kształtowały kulturę klubową i emocje słuchaczy.`,
        ]),
      },
      {
        instrument: instrumentEn,
        bio: `${name} — ${instLowEn}. A trained musician rooted in Poznań's live-music and academic community.`,
        body: rich([
          `${name} is a respected ${instLowEn} player for whom every concert is a meeting with the audience — playing with genuine commitment and personal interpretation, without stage pathos but with real musical energy.`,
          `At American Dream Club you'll hear them in a repertoire spanning the greatest American and world standards: jazz, swing, blues and soul — the sounds that shaped club culture for decades.`,
        ]),
      },
    )
  }

  // ════════════════════════════════════════════════════════════════════════
  // ROOMS
  // ════════════════════════════════════════════════════════════════════════
  log('Seeding rooms…')
  // [plName, capacity, plDescription, plEquipment, enName, enDescription, enEquipment]
  const rooms: [string, number, string, string[], string, string, string[]][] = [
    ['Sala Klubowa', 120, 'Główna sala klubu ze sceną i barem.',
      ['Scena koncertowa', 'Nagłośnienie', 'Oświetlenie sceniczne', 'WiFi'],
      'Club Hall', "The club's main room with a stage and bar.",
      ['Concert stage', 'Sound system', 'Stage lighting', 'WiFi']],
    ['Sala Kameralna', 40, 'Kameralna przestrzeń na mniejsze spotkania.',
      ['Rzutnik', 'Ekran', 'WiFi'],
      'Chamber Room', 'An intimate space for smaller gatherings.',
      ['Projector', 'Screen', 'WiFi']],
    ['VIP Room', 12, 'Kameralny pokój z dużym stołem dla 12 gości. Idealne miejsce na spotkania biznesowe i kameralne uroczystości.',
      ['Rzutnik: EPSON EB-L265F, 1920 x 1080 FullHD', 'Łączność: HDMI / AppleTV / ChromeCast', 'Ekran do prezentacji: 1340 mm x 2450 mm', 'Flipchart', 'WiFi'],
      'VIP Room', 'An intimate room with a large table seating 12 guests. Ideal for business meetings and intimate celebrations.',
      ['Projector: EPSON EB-L265F, 1920 x 1080 FullHD', 'Connectivity: HDMI / AppleTV / ChromeCast', 'Presentation screen: 1340 mm x 2450 mm', 'Flipchart', 'WiFi']],
    ['Cigar Room', 16, 'Profesjonalna palarnia cygar.',
      ['Wentylacja', 'Humidor', 'Wybór alkoholi'],
      'Cigar Room', 'A professional cigar lounge.',
      ['Ventilation', 'Humidor', 'Selection of spirits']],
  ]
  // Distinct cover photo per zone so the selector tiles read as different rooms
  // (only placeholder imagery is available — swap for real room photos later).
  const roomCovers: Record<string, () => Promise<number | null>> = {
    'sala-klubowa': img.program,
    'sala-kameralna': img.twoje,
    'vip-room': img.gallery,
    'cigar-room': img.cigar,
  }
  const roomIds: number[] = []
  o = 0
  for (const [name, capacity, description, equipment, nameEn, descriptionEn, equipmentEn] of rooms) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const cover = await (roomCovers[slug] ?? img.twoje)()
    const id = await upsert('rooms', { slug: { equals: slug } }, {
      name, slug, capacity, description, order: o++,
      equipment: equipment.map((item) => ({ item })),
      gallery: [{ image: cover }],
    }, {
      name: nameEn, description: descriptionEn,
      // NB: equipment is a localized array. Setting it here without row ids would
      // replace the rows and wipe the PL values, so we apply EN below by id.
    })

    // Re-read the PL rows to map the EN translations onto the SAME array rows,
    // preserving the Polish values per locale.
    const plDoc = await payload.findByID({ collection: 'rooms', id, locale: LOCALE, depth: 0 })
    const eqRows = (plDoc.equipment ?? []) as { id?: string | null }[]
    await payload.update({
      collection: 'rooms',
      id,
      locale: EN,
      data: {
        equipment: eqRows.map((row, i) => ({ id: row.id, item: equipmentEn[i] ?? '' })),
      },
    })

    roomIds.push(id)
  }

  // ════════════════════════════════════════════════════════════════════════
  // TEAM
  // ════════════════════════════════════════════════════════════════════════
  log('Seeding team…')
  const managerId = await upsert('team-members', { name: { equals: 'Jacek Wieczorek' } }, {
    name: 'Jacek Wieczorek', role: 'MANAGER', phone: '+48 508 090 575',
    email: 'jacek.wieczorek@americandreamclub.pl', order: 0, photo: await img.twoje(),
  }, {
    role: 'MANAGER', // localized field
  })

  // Reservation contact — powers the amber "REZERWACJA" band on /rezerwacje
  // (uses the club's reservation line + mailbox, not a personal contact).
  const reservationContactId = await upsert(
    'team-members',
    { name: { equals: 'Rezerwacja stolika' } },
    {
      name: 'Rezerwacja stolika', role: 'REZERWACJA', phone: '+48 500 210 333',
      email: 'rezerwacja@americandreamclub.pl', order: 1,
    },
    // Only `role` is localized; `name` is a shared field, so don't override it in
    // EN (that would overwrite the PL name).
    { role: 'RESERVATION' },
  )

  // ════════════════════════════════════════════════════════════════════════
  // TESTIMONIALS
  // ════════════════════════════════════════════════════════════════════════
  log('Seeding testimonials…')
  // [author, plText, enText] — only `text` is localized.
  const testis: [string, string, string][] = [
    ['Dominik A.', 'Gdybym mógł dać dziesięć gwiazdek za klimat, to bym bez wahania dał. Wyjątkowe miejsce. Nie trafiają tutaj ludzie z przypadku.',
      "If I could give ten stars for the atmosphere, I would without hesitation. An exceptional place. People don't end up here by chance."],
    ['Sami Investment', 'To miejsce mogłoby istnieć w Nowym Orleanie. Dobry, elegancki klub jazzowy był bardzo potrzebny w Poznaniu.',
      'This place could exist in New Orleans. A good, elegant jazz club was much needed in Poznań.'],
    ['Jacek W.', 'Świetny koncert. Bardzo dobrzy muzycy — zgrani, czujący to, co grają. Świetna atmosfera. Przed koncertem zjedliśmy bardzo dobrą kolację.',
      'A great concert. Very good musicians — tight, feeling what they play. A great atmosphere. Before the concert we had a very good dinner.'],
    ['Aniela K.', 'Miejsce absolutnie wyjątkowe, oryginalne i zachwycające całokształtem. Nie wiem, czy można znaleźć równie ciekawy lokal w Poznaniu.',
      "An absolutely exceptional place, original and delightful in every respect. I'm not sure you can find an equally interesting spot in Poznań."],
    ['Sławomir M.', 'Rewelacyjne miejsce. Klimat jest, wygląd jest, dobra muza jest, autorska kuchnia jest, obsługa na najwyższym poziomie. Jest wszystko do zaspokojenia duszy i ciała.',
      'A sensational place. The atmosphere is there, the look is there, good music is there, signature cuisine is there, service at the highest level. Everything to satisfy body and soul.'],
    ['Diego C.', 'Fantastyczna przestrzeń na elegancki wieczór w otoczeniu jakości i luksusu. Zdecydowanie wrócę!',
      "A fantastic space for an elegant evening surrounded by quality and luxury. I'll definitely be back!"],
    ['Jolanta S.', 'Już przy wejściu wie się, że będzie dużo lepiej niż można się było spodziewać. Wszystko dopięte do ostatniego szczegółu. Godne polecenia.',
      'Right at the entrance you know it will be far better than you could have expected. Everything buttoned up to the last detail. Highly recommended.'],
    ['Maria', 'Bardzo lubię tu wracać. Atmosfera jest cudowna, jedzenie przepyszne, obsługa miła i profesjonalna! To jedno z moich ulubionych miejsc.',
      "I really love coming back here. The atmosphere is wonderful, the food delicious, the service kind and professional! It's one of my favourite places."],
  ]
  // Reset testimonials so the collection holds EXACTLY these 8 (drops any earlier
  // placeholder/stray entries on local or remote).
  await deleteStray('testimonials', { author: { exists: true } })
  o = 0
  for (const [author, text, textEn] of testis) {
    await upsert(
      'testimonials',
      { author: { equals: author } },
      { author, text, rating: 5, source: 'google', featured: true, order: o++ },
      { text: textEn },
    )
  }

  // ════════════════════════════════════════════════════════════════════════
  // EVENTS
  // ════════════════════════════════════════════════════════════════════════
  log('Seeding events…')
  // Pin an event to a specific day-of-month in the current (or next) month, so the
  // calendar looks realistic regardless of when the seed runs. The Events collection
  // enforces two rules we must respect here: only one event per day, and no events on
  // Mondays (the club is closed). So `resolveDay` advances forward from the requested
  // day to the first day that is neither a Monday (Europe/Warsaw) nor already taken.
  const usedDays: Record<number, Set<number>> = { 0: new Set(), 1: new Set() }
  function resolveDay(day: number, hour: number, monthOffset: 0 | 1): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + monthOffset
    const lastDay = new Date(year, month + 1, 0).getDate()
    const used = usedDays[monthOffset]
    const start = Math.min(day, lastDay)
    for (let i = 0; i < lastDay; i++) {
      const cand = ((start - 1 + i) % lastDay) + 1
      const iso = new Date(year, month, cand, hour, 0, 0, 0).toISOString()
      if (!used.has(cand) && warsawParts(new Date(iso)).weekday !== 1) {
        used.add(cand)
        return iso
      }
    }
    used.add(start)
    return new Date(year, month, start, hour, 0, 0, 0).toISOString()
  }
  function monthDay(day: number, hour = 19): string {
    return resolveDay(day, hour, 0)
  }
  function nextMonthDay(day: number, hour = 19): string {
    return resolveDay(day, hour, 1)
  }
  // `en` carries the English values for localized fields only: title,
  // description, leadTitle, descriptionHeading, body, performers[].instrument.
  // The where-clause still matches on the canonical (PL) title.
  async function event(d: Record<string, unknown>, en?: Record<string, unknown>) {
    // Inject editable detail-page section defaults (overridable per call).
    const withDefaults: Record<string, unknown> = {
      showUpcoming: true,
      performersHeading: 'Wykonawcy',
      upcomingHeading: 'Nadchodzące wydarzenia',
      shareLabel: 'Udostępnij to wydarzenie',
      ...d,
    }
    const enWithDefaults = en
      ? {
          performersHeading: 'Performers',
          upcomingHeading: 'Upcoming events',
          shareLabel: 'Share this event',
          ...en,
        }
      : en
    return upsert('events', { title: { equals: d.title } }, withDefaults, enWithDefaults)
  }
  await event({
    title: "Chicago — Szalone Lata '20", leadTitle: 'Muzyka na żywo', eventType: 'standard',
    date: monthDay(4), endTime: '23:00', price: 40, featured: true,
    image: await img.single(), heroImage: await img.single(),
    descriptionHeading: 'Jazz prosto z serca Illinois!',
    body: rich(['Czwartek w rytmie Chicago — swing, jazz i energia klubów lat 20. Muzyka, która buduje nastrój spotkań, rozmów i naturalnego ruchu.']),
    description: 'Swing, jazz i energia klubów lat 20.',
    performers: [
      { musician: musicianIds['Jacek Szwaj'], instrument: 'fortepian' },
      { musician: musicianIds['Wojciech Braszak'], instrument: 'klarnet' },
      { musician: musicianIds['Mikołaj Wienke'], instrument: 'saksofon' },
    ],
    reservationUrl: 'tel:+48500210333', shareEnabled: true,
  }, {
    title: "Chicago — The Roaring '20s", leadTitle: 'Live music',
    descriptionHeading: 'Jazz straight from the heart of Illinois!',
    body: rich(['Thursday to the rhythm of Chicago — swing, jazz and the energy of the 1920s clubs. Music that sets the mood for meeting, talking and moving naturally.']),
    description: 'Swing, jazz and the energy of the 1920s clubs.',
    // performers omitted in EN on purpose: the array isn't array-level localized,
    // so re-sending it here would replace the rows and wipe the PL instruments.
    // EN falls back to the PL instrument labels (acceptable — PDF scope is PL).
  })
  await event({
    title: 'Just The Two Of Us — duet, który rozpala', leadTitle: 'Muzyka na żywo', eventType: 'standard',
    date: monthDay(6), endTime: '23:00', price: 40, featured: true,
    image: await img.program(), heroImage: await img.program(),
    descriptionHeading: 'Wieczór z duetem', description: 'Soul, jazz i wielkie standardy.',
    body: rich(['Wyjątkowy wieczór w duecie — fortepian i wokal w klasycznym repertuarze.']),
    reservationUrl: 'tel:+48500210333', shareEnabled: true,
  }, {
    title: 'Just The Two Of Us — a duet that sets the night alight', leadTitle: 'Live music',
    descriptionHeading: 'An evening with a duet', description: 'Soul, jazz and the great standards.',
    body: rich(['A special evening as a duet — piano and vocals in a classic repertoire.']),
  })
  await event({
    title: 'Chopin na dwa fortepiany', leadTitle: 'Recital', eventType: 'special',
    date: monthDay(18, 20), endTime: '22:00', price: 140, featured: true,
    image: await img.special(), heroImage: await img.special(), posterImage: await img.special(),
    descriptionHeading: 'Wydarzenie specjalne', description: 'Muzyka klasyczna na dwa fortepiany.',
    body: rich(['Wyjątkowy recital — muzyka Chopina w aranżacji na dwa fortepiany.']),
    performers: [
      { musician: musicianIds['Jacek Szwaj'], instrument: 'fortepian' },
      { musician: musicianIds['Jakub Królikowski'], instrument: 'fortepian' },
    ],
    reservationUrl: 'tel:+48500210333', shareEnabled: true,
  }, {
    title: 'Chopin for Two Pianos', leadTitle: 'Recital',
    descriptionHeading: 'Special event', description: 'Classical music for two pianos.',
    body: rich(["A special recital — Chopin's music arranged for two pianos."]),
    // performers omitted in EN (see note above) — keeps PL instruments intact.
  })
  // Two more special poster events (from PDF: Miles Davis tribute, Andrzej Zaucha tribute)
  await event({
    title: 'Książę Jazzu — Tribute to Miles Davis', leadTitle: 'Wieczór specjalny', eventType: 'special',
    date: monthDay(26), endTime: '23:00', price: 120, featured: true,
    descriptionHeading: 'Hołd dla Księcia Jazzu',
    description: 'Tribute to Miles Davis — muzyka, która zmieniła historię jazzu.',
    body: rich(['Wieczór dedykowany jednemu z największych innowatorów w historii muzyki jazzowej. Program obejmuje przeboje ze złotych lat Milesa Davisa — Kind of Blue, Bitches Brew i wiele innych.']),
    performers: [
      { musician: musicianIds['Jacek Szwaj'], instrument: 'fortepian' },
      { musician: musicianIds['Wojciech Braszak'], instrument: 'trąbka' },
      { musician: musicianIds['Mikołaj Wienke'], instrument: 'saksofon' },
    ],
    reservationUrl: 'tel:+48500210333', shareEnabled: true,
  }, {
    title: 'Prince of Jazz — Tribute to Miles Davis', leadTitle: 'Special evening',
    descriptionHeading: 'A tribute to the Prince of Jazz',
    description: 'Tribute to Miles Davis — music that changed the history of jazz.',
    body: rich(["An evening dedicated to one of the greatest innovators in the history of jazz. The programme features highlights from Miles Davis's golden years — Kind of Blue, Bitches Brew and many more."]),
    // performers omitted in EN (see note above) — keeps PL instruments intact.
  })
  await event({
    title: 'Tribute to Andrzej Zaucha — Byłaś Serca Biciem', leadTitle: 'Wieczór specjalny', eventType: 'special',
    date: nextMonthDay(9), endTime: '23:00', price: 110, featured: true,
    descriptionHeading: 'Hołd dla polskiego króla swingu',
    description: 'Tribute to Andrzej Zaucha — wieczór z muzyką polskiego króla swingu i jazzu.',
    body: rich(['Wieczór poświęcony pamięci Andrzeja Zauchy — śpiewaka, który połączył jazz z popem. Usłyszysz najpiękniejsze standardy jazzowe i piosenki w polskim wykonaniu.']),
    performers: [
      { musician: musicianIds['Zuzanna Babiak'], instrument: 'wokal' },
      { musician: musicianIds['Jacek Szwaj'], instrument: 'fortepian' },
      { musician: musicianIds['Flavio Gullotta'], instrument: 'kontrabas' },
    ],
    reservationUrl: 'tel:+48500210333', shareEnabled: true,
  }, {
    title: 'Tribute to Andrzej Zaucha — Byłaś Serca Biciem', leadTitle: 'Special evening',
    descriptionHeading: 'A tribute to the Polish King of Swing',
    description: 'Tribute to Andrzej Zaucha — an evening with the music of the Polish king of swing and jazz.',
    body: rich(["An evening in memory of Andrzej Zaucha — a singer who blended jazz with pop. You'll hear the most beautiful jazz standards and songs performed in the Polish style."]),
    // performers omitted in EN (see note above) — keeps PL instruments intact.
  })
  // Individual dated events spread across the CURRENT month — no recurrence.
  // Each is a unique document pinned to a specific day-of-month so the calendar
  // grid looks realistic regardless of when the seed runs. `seriesSlug` links an
  // event to a themed series (so the series page can list "Nadchodzące
  // wydarzenia w cyklu"). These are the events that demonstrate the
  // "duplicate + tweak" workflow editors will use in production.
  type MonthEvent = {
    title: string; titleEn: string
    leadTitle: string; leadTitleEn: string
    day: number; price: number
    eventType?: 'standard' | 'special'
    description: string; descriptionEn: string
    performers: string[]
    seriesSlug?: string
  }
  const monthEvents: MonthEvent[] = [
    { title: 'Jazzowe Wtorki: Standardy Bebopu', titleEn: 'Jazz Tuesdays: Bebop Standards',
      leadTitle: 'Muzyka na żywo', leadTitleEn: 'Live music', day: 3, price: 35,
      description: 'Wtorkowy wieczór z klasyką bebopu w wykonaniu poznańskich muzyków.',
      descriptionEn: 'A Tuesday evening of bebop classics performed by Poznań musicians.',
      performers: ['Adam Czech', 'Flavio Gullotta'], seriesSlug: 'jazzowe-wtorki' },
    { title: 'Blues & Soul Night', titleEn: 'Blues & Soul Night',
      leadTitle: 'Muzyka na żywo', leadTitleEn: 'Live music', day: 5, price: 40,
      description: 'Bluesowy wieczór z duszą i energią.',
      descriptionEn: 'A blues evening with soul and energy.',
      performers: ['Zuzanna Babiak', 'Wojciech Braszak'] },
    { title: 'Towarzyska Niedziela: Brunch & Swing', titleEn: 'Social Sunday: Brunch & Swing',
      leadTitle: 'Muzyka na żywo', leadTitleEn: 'Live music', day: 7, price: 25,
      description: 'Relaksująca niedziela z jazzem, brunchem i koktajlami od 16:00.',
      descriptionEn: 'A relaxed Sunday with jazz, brunch and cocktails from 4 PM.',
      performers: ['Zuzanna Babiak', 'Jakub Kraszewski'], seriesSlug: 'towarzyska-niedziela' },
    { title: 'Jazzowe Wtorki: Hołd dla Billa Evansa', titleEn: 'Jazz Tuesdays: A Tribute to Bill Evans',
      leadTitle: 'Muzyka na żywo', leadTitleEn: 'Live music', day: 10, price: 35,
      description: 'Liryczny jazz fortepianowy w hołdzie Billowi Evansowi.',
      descriptionEn: 'Lyrical piano jazz in tribute to Bill Evans.',
      performers: ['Jakub Królikowski', 'Flavio Gullotta'], seriesSlug: 'jazzowe-wtorki' },
    { title: 'Klub x Muzy: Chaplin na żywo', titleEn: 'Club x Muses: Chaplin Live',
      leadTitle: 'Kino nieme', leadTitleEn: 'Silent cinema', day: 11, price: 30,
      description: 'Wieczór kina niemego z akompaniamentem fortepianu na żywo.',
      descriptionEn: 'A silent-film evening with live piano accompaniment.',
      performers: ['Jakub Królikowski'], seriesSlug: 'klub-x-muzy' },
    { title: 'Swing Night', titleEn: 'Swing Night',
      leadTitle: 'Muzyka na żywo', leadTitleEn: 'Live music', day: 12, price: 35,
      description: 'Gorąca noc swingowa — tanecznie i rozrywkowo.',
      descriptionEn: 'A hot swing night — danceable and entertaining.',
      performers: ['Jacek Szwaj', 'Mikołaj Wienke'] },
    { title: 'Road Songs: Nashville Night', titleEn: 'Road Songs: Nashville Night',
      leadTitle: 'Muzyka na żywo', leadTitleEn: 'Live music', day: 14, price: 35,
      description: 'Muzyczne opowieści z drogi — country prosto z Nashville.',
      descriptionEn: 'Musical stories from the road — country straight from Nashville.',
      performers: ['Adam Czech'], seriesSlug: 'road-songs-country' },
    { title: 'Vocal Jazz Evening', titleEn: 'Vocal Jazz Evening',
      leadTitle: 'Muzyka na żywo', leadTitleEn: 'Live music', day: 17, price: 40,
      description: 'Wokalny wieczór z największymi standardami jazzu.',
      descriptionEn: 'A vocal evening with the greatest jazz standards.',
      performers: ['Zuzanna Babiak', 'Jacek Szwaj'] },
    { title: 'Towarzyska Niedziela: Dancing', titleEn: 'Social Sunday: Dancing',
      leadTitle: 'Muzyka na żywo', leadTitleEn: 'Live music', day: 21, price: 25,
      description: 'Niedzielna impreza taneczna w doborowym towarzystwie.',
      descriptionEn: 'A Sunday dance party in fine company.',
      performers: ['Jakub Kraszewski', 'Mikołaj Wienke'], seriesSlug: 'towarzyska-niedziela' },
    { title: 'Latin Jazz Quartet', titleEn: 'Latin Jazz Quartet',
      leadTitle: 'Muzyka na żywo', leadTitleEn: 'Live music', day: 24, price: 40,
      description: 'Gorące rytmy latynoskiego jazzu na cztery instrumenty.',
      descriptionEn: 'Hot Latin-jazz rhythms for four instruments.',
      performers: ['Flavio Gullotta', 'Maciej Sokołowski'] },
    { title: 'Klub x Muzy: Buster Keaton', titleEn: 'Club x Muses: Buster Keaton',
      leadTitle: 'Kino nieme', leadTitleEn: 'Silent cinema', day: 25, price: 30,
      description: 'Komedie Bustera Keatona z akompaniamentem fortepianu na żywo.',
      descriptionEn: 'Buster Keaton comedies with live piano accompaniment.',
      performers: ['Jakub Królikowski'], seriesSlug: 'klub-x-muzy' },
    { title: 'Road Songs: Americana', titleEn: 'Road Songs: Americana',
      leadTitle: 'Muzyka na żywo', leadTitleEn: 'Live music', day: 28, price: 35,
      description: 'Gitary, banjo i opowieści prosto z amerykańskiej drogi.',
      descriptionEn: 'Guitars, banjo and stories straight from the American road.',
      performers: ['Adam Czech'], seriesSlug: 'road-songs-country' },
  ]
  const monthEventSeriesLinks: Array<[string, string]> = []
  for (const me of monthEvents) {
    await event({
      title: me.title, leadTitle: me.leadTitle, eventType: me.eventType ?? 'standard',
      date: monthDay(me.day, 19), endTime: '23:00', price: me.price, featured: false,
      description: me.description, body: rich([me.description]),
      reservationUrl: 'tel:+48500210333', shareEnabled: true,
      performers: me.performers
        .filter(n => musicianIds[n])
        .map(n => ({ musician: musicianIds[n], instrument: '' })),
    }, {
      title: me.titleEn, leadTitle: me.leadTitleEn,
      description: me.descriptionEn, body: rich([me.descriptionEn]),
    })
    if (me.seriesSlug) monthEventSeriesLinks.push([me.title, me.seriesSlug])
  }

  // ════════════════════════════════════════════════════════════════════════
  // NEWS (Posts)
  // ════════════════════════════════════════════════════════════════════════
  log('Seeding news…')
  // `en` carries English values for the localized fields (title, excerpt, content).
  async function post(d: Record<string, unknown>, en?: Record<string, unknown>) {
    const id = await upsert('posts', { slug: { equals: d.slug } }, d, en)
    try {
      await payload.update({ collection: 'posts', id, data: { _status: 'published' } as never, locale: LOCALE })
    } catch {}
    return id
  }
  await post({
    slug: 'swing-rytm-ktory-zmienil-swiat', title: 'Swing: rytm, który zmienił świat',
    excerpt: 'Swing narodził się w latach 20. i 30. XX wieku w Stanach Zjednoczonych, w dużych miastach takich jak Nowy Jork, Chicago czy Nowy Orlean.',
    heroImage: await img.program(), publishedAt: new Date().toISOString(),
    content: rich([
      'W latach 30. i 40. swing osiągnął szczyt popularności dzięki orkiestrom Benny\'ego Goodmana, Duke\'a Ellingtona i Counta Basiego.',
      'Big bandy wprowadziły muzykę na sceny całych Stanów Zjednoczonych, a transmisje radiowe sprawiły, że rytmy swingu rozbrzmiewały w milionach domów.',
    ]),
  }, {
    title: 'Swing: the rhythm that changed the world',
    excerpt: 'Swing was born in the 1920s and 1930s in the United States, in big cities such as New York, Chicago and New Orleans.',
    content: rich([
      'In the 1930s and 1940s swing reached the peak of its popularity thanks to the orchestras of Benny Goodman, Duke Ellington and Count Basie.',
      'Big bands brought the music to stages across the United States, and radio broadcasts made the rhythms of swing ring out in millions of homes.',
    ]),
  })
  await post({
    slug: 'cole-porter-mistrz-slowa-i-melodii', title: 'Cole Porter: mistrz słowa i melodii',
    excerpt: 'Cole Porter to jedna z najjaśniejszych gwiazd amerykańskiego świata muzyki rozrywkowej XX wieku.',
    heroImage: await img.single(), publishedAt: new Date(Date.now() - 86400000).toISOString(),
    content: rich(['Kompozytor, tekściarz i dramaturg muzyczny, którego utwory stały się klasyką jazzu, swingu i broadwayowskich musicali.']),
  }, {
    title: 'Cole Porter: master of word and melody',
    excerpt: 'Cole Porter is one of the brightest stars of 20th-century American popular music.',
    content: rich(['A composer, lyricist and musical dramatist whose works became classics of jazz, swing and Broadway musicals.']),
  })
  await post({
    slug: 'poznanska-scena-muzyczna-zuzanna-babiak', title: 'Poznańska scena muzyczna: Zuzanna Babiak',
    excerpt: 'Wokalistka jazzowa, nauczycielka wokalu, absolwentka poznańskiej Akademii Muzycznej im. I. J. Paderewskiego.',
    heroImage: await img.bar(), publishedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    content: rich(['Zuzanna Babiak to jedna z najjaśniejszych postaci poznańskiej sceny jazzowej.']),
  }, {
    title: "Poznań's music scene: Zuzanna Babiak",
    excerpt: 'A jazz vocalist and voice teacher, a graduate of the I. J. Paderewski Academy of Music in Poznań.',
    content: rich(["Zuzanna Babiak is one of the brightest figures on Poznań's jazz scene."]),
  })

  // ════════════════════════════════════════════════════════════════════════
  // RECURRING SERIES
  // ════════════════════════════════════════════════════════════════════════
  log('Seeding recurring series…')
  // [slug, themeColor, plName, plEyebrow, plDescription, heroImage,
  //  plCaptions, enName, enEyebrow, enDescription, enCaptions]
  type SeriesDef = {
    slug: string
    themeColor: string
    name: string
    eyebrow: string
    description: string
    heroImage: number | null
    gallery: { image: number | null; caption: string }[]
    en: {
      name: string
      eyebrow: string
      description: string
      gallery: { caption: string }[]
    }
  }
  const seriesDefs: SeriesDef[] = [
    {
      slug: 'towarzyska-niedziela',
      themeColor: 'amber',
      name: 'Towarzyska Niedziela',
      eyebrow: 'Wydarzenie cykliczne',
      description:
        'Niedziele w doborowym towarzystwie! Specjalna karta dań, impreza taneczna, a to wszystko już od godziny 16:00.',
      heroImage: await img.program(),
      gallery: [
        { image: await img.bar(), caption: 'Niedzielna impreza taneczna' },
        { image: await img.restauracja(), caption: 'Specjalna karta dań' },
      ],
      en: {
        name: 'Social Sunday',
        eyebrow: 'Recurring event',
        description:
          'Sundays in fine company! A special à la carte menu, a dance party — and it all starts at 4:00 PM.',
        gallery: [{ caption: 'Sunday dance party' }, { caption: 'Special à la carte menu' }],
      },
    },
    {
      slug: 'klub-x-muzy',
      themeColor: 'blackwhite',
      name: 'Klub x Muzy',
      eyebrow: 'Wydarzenie cykliczne',
      description:
        'Wieczory kina niemego z akompaniamentem fortepianu na żywo. Poczuj klimat dawnych lat!',
      heroImage: await img.special(),
      gallery: [
        { image: await img.special(), caption: 'Kino nieme na żywo' },
        { image: await img.program(), caption: 'Akompaniament fortepianu' },
      ],
      en: {
        name: 'Club x Muses',
        eyebrow: 'Recurring event',
        description:
          'Silent film evenings accompanied by live piano. Feel the atmosphere of bygone years!',
        gallery: [{ caption: 'Live silent cinema' }, { caption: 'Live piano accompaniment' }],
      },
    },
    {
      slug: 'road-songs-country',
      themeColor: 'sepia',
      name: 'Road Songs Country',
      eyebrow: 'Wydarzenie cykliczne',
      description:
        'Wieczory z muzyką country — gitary, banjo i opowieści prosto z amerykańskiej drogi.',
      heroImage: await img.bar(),
      gallery: [{ image: await img.bar(), caption: 'Klimat amerykańskiej drogi' }],
      en: {
        name: 'Road Songs Country',
        eyebrow: 'Recurring event',
        description:
          'Evenings of country music — guitars, banjo and stories straight from the American road.',
        gallery: [{ caption: 'The spirit of the American road' }],
      },
    },
    {
      slug: 'jazzowe-wtorki',
      themeColor: 'purple',
      name: 'Jazzowe Wtorki',
      eyebrow: 'Wydarzenie cykliczne',
      description: 'Wtorkowe wieczory z jazzem. Standardy, improwizacje i muzyka na żywo.',
      heroImage: await img.cigar(),
      gallery: [{ image: await img.program(), caption: 'Jazz na żywo we wtorki' }],
      en: {
        name: 'Jazz Tuesdays',
        eyebrow: 'Recurring event',
        description: 'Tuesday evenings with jazz. Standards, improvisations and live music.',
        gallery: [{ caption: 'Live jazz on Tuesdays' }],
      },
    },
  ]
  const seriesIds: number[] = []
  const seriesIdBySlug: Record<string, number> = {}
  for (const s of seriesDefs) {
    const sid = await upsert(
      'recurring-series',
      { slug: { equals: s.slug } },
      {
        name: s.name,
        slug: s.slug,
        themeColor: s.themeColor,
        eyebrow: s.eyebrow,
        description: s.description,
        heroImage: s.heroImage,
        gallery: s.gallery.map((g) => ({ image: g.image, caption: g.caption })),
        // Editable page-section controls
        upcomingHeading: 'Nadchodzące wydarzenia w cyklu',
        upcomingCount: 6,
        seeProgrammeLabel: 'Zobacz program',
        showOtherSeries: true,
        otherSeriesHeading: 'Pozostałe wydarzenia cykliczne',
        showNews: true,
        newsHeading: 'Aktualności',
      },
      {
        name: s.en.name,
        eyebrow: s.en.eyebrow,
        description: s.en.description,
        gallery: s.en.gallery.map((g) => ({ caption: g.caption })),
        upcomingHeading: 'Upcoming events in this series',
        seeProgrammeLabel: 'See programme',
        otherSeriesHeading: 'Other recurring series',
        newsHeading: 'News',
      },
    )
    seriesIds.push(sid)
    seriesIdBySlug[s.slug] = sid
  }

  // Link the individual month events to their series so each series page can
  // list its "Nadchodzące wydarzenia w cyklu" (derived purely from Events).
  const seriesEventLinks: Array<[string, string]> = monthEventSeriesLinks
  for (const [eventTitle, seriesSlug] of seriesEventLinks) {
    const sid = seriesIdBySlug[seriesSlug]
    if (!sid) continue
    const found = await payload.find({
      collection: 'events',
      where: { title: { equals: eventTitle } },
      limit: 1,
      locale: LOCALE,
    })
    if (found.docs[0]) {
      await payload.update({
        collection: 'events',
        id: found.docs[0].id,
        data: { recurringSeries: sid } as never,
        locale: LOCALE,
      })
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // PAGES (assembled from blocks)
  // ════════════════════════════════════════════════════════════════════════
  log('Seeding pages…')
  // `title` and the whole `layout` blocks field are localized — so the EN pass
  // re-writes both with their English equivalents (same block structure/order).
  async function page(
    slug: string,
    title: string,
    layout: unknown[],
    titleEn?: string,
    layoutEn?: unknown[],
  ) {
    const id = await upsert(
      'pages',
      { slug: { equals: slug } },
      { title, slug, layout },
      titleEn || layoutEn ? { title: titleEn ?? title, layout: layoutEn ?? layout } : undefined,
    )
    try {
      await payload.update({ collection: 'pages', id, data: { _status: 'published' } as never, locale: LOCALE })
    } catch {}
    return id
  }

  // Home venue cards. Each card owns its OWN media doc (via slotImg) so the client
  // can replace one tile's photo in the CMS without it bleeding into other pages
  // that also use the program/restauracja/bar/cigar placeholders.
  const venueCards = async () => [
    // CTAs match the PDF: section name (not "SPRAWDŹ MENU") + › arrow
    { image: await slotImg('home-bento-program', PLACEHOLDER('program'), 'Koncert na żywo'), colSpan: 'full', label: 'Codziennie muzyka na żywo w weekendy.', title: 'KONCERTY I WYDARZENIA', ctaLabel: 'PROGRAM ›', ctaUrl: '/events' },
    { image: await slotImg('home-bento-restauracja', PLACEHOLDER('restauracja'), 'Restauracja — danie'), colSpan: 'full', label: 'Kuchnia inspirowana kulturą różnych stanów USA. Autorskie dania w nowoczesnej formie.', title: 'RESTAURACJA', ctaLabel: 'RESTAURACJA ›', ctaUrl: '/restaurant' },
    { image: await slotImg('home-bento-bar', PLACEHOLDER('bar'), 'Cocktail bar — koktajl'), colSpan: 'full', label: 'Autorskie koktajle, selekcja alkoholi mocnych i win z całego świata.', title: 'COCKTAIL BAR', ctaLabel: 'COCKTAIL BAR ›', ctaUrl: '/bar-and-cocktails' },
    { image: await slotImg('home-bento-cigar', PLACEHOLDER('cigar'), 'Cigar room — wnętrze'), colSpan: 'full', label: 'Profesjonalna przestrzeń dla miłośników cygar. Starannie dobrana oferta cygar i alkoholi.', title: 'CIGAR ROOM', ctaLabel: 'CIGAR ROOM ›', ctaUrl: '/cigar-lounge' },
  ]
  const venueCardsEn = async () => [
    { image: await slotImg('home-bento-program', PLACEHOLDER('program'), 'Koncert na żywo'), colSpan: 'full', label: 'Live music every weekend.', title: 'CONCERTS & EVENTS', ctaLabel: 'PROGRAM ›', ctaUrl: '/events' },
    { image: await slotImg('home-bento-restauracja', PLACEHOLDER('restauracja'), 'Restauracja — danie'), colSpan: 'full', label: 'A kitchen inspired by the culture of different US states. Signature dishes in a modern style.', title: 'RESTAURANT', ctaLabel: 'RESTAURANT ›', ctaUrl: '/restaurant' },
    { image: await slotImg('home-bento-bar', PLACEHOLDER('bar'), 'Cocktail bar — koktajl'), colSpan: 'full', label: 'Signature cocktails and a selection of wines and spirits.', title: 'COCKTAIL BAR', ctaLabel: 'COCKTAIL BAR ›', ctaUrl: '/bar-and-cocktails' },
    { image: await slotImg('home-bento-cigar', PLACEHOLDER('cigar'), 'Cigar room — wnętrze'), colSpan: 'full', label: 'A professional space for cigar lovers. A carefully curated selection of cigars and spirits.', title: 'CIGAR ROOM', ctaLabel: 'CIGAR ROOM ›', ctaUrl: '/cigar-lounge' },
  ]
  // EN text for the testimonial items embedded in page blocks
  // (the [, , en] element of each `testis` tuple).
  const testiItemsEn = testis.map(([name, , textEn]) => ({ name, stars: 5, text: textEn }))

  // HOME
  await page('home', 'Strona główna', [
    { blockType: 'heroBanner', heading: 'Restauracja & Jazz Club', subtext: 'Kolacja i drinki w trakcie koncertu na żywo', backgroundImage: await heroImg('home', PLACEHOLDER('home'), 'Strona główna — Hero'), backgroundVideo: await heroVideo(),
      ctaLink: { type: 'custom', label: 'ZAREZERWUJ STOLIK', url: '/rezerwacje' }, ctaIcon: 'ticket',
      secondaryLinks: [
        { link: { type: 'custom', label: 'MENU', url: '/restaurant' }, icon: 'fork' },
        { link: { type: 'custom', label: 'PROGRAM', url: '/events' }, icon: 'music' },
      ] },
    { blockType: 'aboutIntro', eyebrow: 'American Dream Club®', heading: 'Nowy Jork w centrum Poznania',
      body: 'Przyjdź, poczuj atmosferę miejsca stworzonego dla muzyki, kolacji i rozmów. Tutaj w dobrym towarzystwie spędzisz cały wieczór: zjesz kolację, zapalisz cygaro i posłuchasz muzyki na żywo.',
      pullQuote: 'To jest świetne miejsce, będę tu wracać!' },
    { blockType: 'eventsTeaser', eyebrow: 'Nadchodzące wydarzenia', heading: 'PROGRAM', viewAllLabel: 'SPRAWDŹ PEŁEN PROGRAM', viewAllUrl: '/events', limit: 6 },
    { blockType: 'bentoSection', subheading: 'Zorganizuj z nami', heading: 'AMERICAN DREAM CLUB', items: await venueCards() },
    { blockType: 'offerCards', eyebrow: 'Zorganizuj z nami', heading: 'TWOJE WYDARZENIE', cards: [
      { tag: 'IMPREZY PRYWATNE', title: 'URODZINY I ROCZNICE W CENTRUM POZNANIA',
        body: 'Ty przychodzisz z Gośćmi, my zajmiemy się organizacją, oprawą i przebiegiem imprezy.',
        ctaLabel: 'DOWIEDZ SIĘ WIĘCEJ', ctaUrl: '/business' },
      { tag: 'IMPREZY FIRMOWE', title: 'SPOTKANIA FIRMOWE W KLUBOWEJ ATMOSFERZE',
        body: 'Eleganckie przestrzenie z dobrym wyposażeniem technicznym i full gastro na życzenie.',
        ctaLabel: 'DOWIEDZ SIĘ WIĘCEJ', ctaUrl: '/business' },
    ] },
    { blockType: 'testimonials', heading: 'CO MÓWIĄ NASI GOŚCIE', reviewSummary: '478 opinii · 4,8/5 w Google',
      items: testis.map(([name, text]) => ({ name, stars: 5, text })) },
  ], 'Home', [
    { blockType: 'heroBanner', heading: 'Restaurant & Jazz Club', subtext: 'Dinner and drinks during a live concert', backgroundImage: await heroImg('home', PLACEHOLDER('home'), 'Strona główna — Hero'), backgroundVideo: await heroVideo(),
      ctaLink: { type: 'custom', label: 'ZAREZERWUJ STOLIK', url: '/rezerwacje' }, ctaIcon: 'ticket',
      secondaryLinks: [
        { link: { type: 'custom', label: 'MENU', url: '/restaurant' }, icon: 'fork' },
        { link: { type: 'custom', label: 'PROGRAM', url: '/events' }, icon: 'music' },
      ] },
    { blockType: 'aboutIntro', eyebrow: 'American Dream Club®', heading: 'New York in the heart of Poznań',
      body: 'Come in and soak up the atmosphere of a place made for music, dinner and conversation. Here, in good company, you can spend a whole evening: have dinner, light a cigar and enjoy live music.',
      pullQuote: "This is a great place — I'll keep coming back!" },
    { blockType: 'eventsTeaser', eyebrow: 'Upcoming events', heading: 'PROGRAM', viewAllLabel: 'SEE THE FULL PROGRAM', viewAllUrl: '/events', limit: 6 },
    { blockType: 'bentoSection', subheading: 'Plan it with us', heading: 'AMERICAN DREAM CLUB', items: await venueCardsEn() },
    { blockType: 'offerCards', eyebrow: 'Plan it with us', heading: 'YOUR EVENT', cards: [
      { tag: 'PRIVATE EVENTS', title: 'BIRTHDAYS & ANNIVERSARIES IN THE HEART OF POZNAŃ',
        body: 'Bring your guests — we take care of the organisation, entertainment and running of the evening.',
        ctaLabel: 'FIND OUT MORE', ctaUrl: '/business' },
      { tag: 'CORPORATE EVENTS', title: 'CORPORATE GATHERINGS IN A CLUB ATMOSPHERE',
        body: 'Elegant spaces with excellent technical equipment and full catering on request.',
        ctaLabel: 'FIND OUT MORE', ctaUrl: '/business' },
    ] },
    { blockType: 'testimonials', heading: 'WHAT OUR GUESTS SAY', reviewSummary: '478 reviews · 4.8/5 on Google',
      items: testiItemsEn },
  ])

  // RESTAURACJA — hero + intro + banners stay as components; the menu itself is
  // simple image tiles. The client uploads ready-made menu graphics (two tiles per
  // row, "Cover" fit, one fixed shape) and can add as many rows as needed via the CMS.
  const rest = await heroImg('restaurant', PLACEHOLDER('restauracja'), 'Restauracja — Hero')
  const prog = await img.program()
  const bar = await img.bar()
  const twoje = await img.twoje() // social-event crowd — Towarzyska Niedziela banner
  // Placeholder tiles (same image for now) — the client replaces each with a real
  // menu graphic in /admin. Structure mirrors the PDF: the cards area is two-column
  // (split) rows; the Dinner Time / Menu A / Menu B / recap banners are full-width.
  // Keep every row's key set identical (left/right/full on all) — D1 caps bound
  // params at 100/statement and Payload sizes insert batches from the first row's
  // keys, so heterogeneous rows overflow ("too many SQL variables").
  type GalleryRow = { layout: string; left: number | null; right: number | null; full: number | null }
  const sp = (l: number | null, r: number | null): GalleryRow => ({ layout: 'split', left: l, right: r, full: null })
  // À-la-carte tiles (client uploads graphics). Every tile slot gets its OWN
  // media doc (`restaurant-menu-rN-{left,right}.jpg`) so replacing one menu
  // graphic in /admin never bleeds into the other tiles or the hero.
  const tile = (key: string) =>
    slotImg(`restaurant-menu-${key}`, PLACEHOLDER('restauracja'), 'Restauracja — kafelek menu')
  const menuRow = async (n: number) => sp(await tile(`r${n}-left`), await tile(`r${n}-right`))
  const menuTiles = [
    await menuRow(1), // intro card | Tatar wołowy
    await menuRow(2), // Jambalaya | Pierogi z dynią
    await menuRow(3), // Boston Chowder | Krem z dyni
    await menuRow(4), // Texas Rib Eye | Żeberka BBQ
    await menuRow(5), // Smash Burger | Club Sandwich
    await menuRow(6), // Mule po marynarsku | Pappardelle
    await menuRow(7), // Sałatka Cezar | BIG BEAT!
    await menuRow(8), // Club Snacks: na ciepło | na zimno
    await menuRow(9), // Desery: Szarlotka | Tiramisù
  ]
  // MENU A / MENU B — photo on the left, structured courses on the right (design
  // ADC_Restauracja). Both menus share the same courses; the client edits each in
  // the CMS and uploads a distinct photo per menu.
  const setMenuCoursesPl = [
    { courseLabel: 'PRZYSTAWKA', dish: 'TATAR WOŁOWY', description: 'wołowina 60g / ogórek konserwowy / szalotka / borowik / musztarda francuska / kapary / oliwa z oliwek / sos worcestershire / papryka / żółtko / brioszka' },
    { courseLabel: 'DANIE GŁÓWNE', dish: 'POLIK WOŁOWY', description: 'polik wołowy 100g / puree z pasternaku / burak / sos z wypieku' },
    { courseLabel: 'DESER', dish: 'BROWNIE', description: 'brownie / wiśnie / lody śmietankowe' },
  ]
  const setMenuCoursesEn = [
    { courseLabel: 'STARTER', dish: 'BEEF TARTARE', description: 'beef 60g / pickled cucumber / shallot / porcini / French mustard / capers / olive oil / Worcestershire sauce / pepper / egg yolk / brioche' },
    { courseLabel: 'MAIN COURSE', dish: 'BEEF CHEEK', description: 'beef cheek 100g / parsnip purée / beetroot / pan sauce' },
    { courseLabel: 'DESSERT', dish: 'BROWNIE', description: 'brownie / cherries / cream ice cream' },
  ]
  const setMenuPl = {
    blockType: 'setMenu',
    heading: 'Dinner Time',
    headingScript: 'specials',
    subtitle: '3-daniowa kolacja degustacyjna w stałej cenie',
    image: prog,
    dateLabel: '69 zł / os.',
    body: 'Dinner Time Specials to wyjątkowa oferta dla miłośników dobrej kuchni i odkrywania nowych smaków: trzydaniowa kolacja degustacyjna w stałej cenie. Stolik dla dwojga w atmosferze klubu. Wy się relaksujecie, a my zajmujemy się resztą. Zapraszamy od wtorku do niedzieli.',
    ctaLabel: 'ZAREZERWUJ STOLIK',
    ctaUrl: '/rezerwacje',
    menus: [
      { name: 'MENU A', image: await slotImg('restaurant-setmenu-a', PLACEHOLDER('restauracja'), 'Menu A — zdjęcie'), courses: setMenuCoursesPl },
      { name: 'MENU B', image: await slotImg('restaurant-setmenu-b', PLACEHOLDER('restauracja'), 'Menu B — zdjęcie'), courses: setMenuCoursesPl },
    ],
  }
  const setMenuEn = {
    blockType: 'setMenu',
    heading: 'Dinner Time',
    headingScript: 'specials',
    subtitle: 'A 3-course tasting dinner at a fixed price',
    image: prog,
    dateLabel: '69 zł / os.',
    body: 'Dinner Time Specials is a special offer for lovers of good food and discovering new flavours: a three-course tasting dinner at a fixed price. A table for two in a club atmosphere. You relax while we take care of the rest. Open Tuesday to Sunday.',
    ctaLabel: 'BOOK A TABLE',
    ctaUrl: '/rezerwacje',
    menus: [
      { name: 'MENU A', image: await slotImg('restaurant-setmenu-a', PLACEHOLDER('restauracja'), 'Menu A — zdjęcie'), courses: setMenuCoursesEn },
      { name: 'MENU B', image: await slotImg('restaurant-setmenu-b', PLACEHOLDER('restauracja'), 'Menu B — zdjęcie'), courses: setMenuCoursesEn },
    ],
  }

  // TOWARZYSKA NIEDZIELA — gold panel: banner + two-column priced menu (design).
  const specialMenuPl = {
    blockType: 'specialMenu',
    image: twoje,
    heading: 'Towarzyska Niedziela',
    subtitle: 'Specjalne menu i relaksująca atmosfera',
    body: 'Zakończ tydzień razem z nami! Towarzyska Niedziela to wyjątkowy wieczór w klubowej atmosferze — od 16:00 do 21:00. W godzinach 17:00 – 20:00 tańce przy największych przebojach muzycznych XX wieku.',
    ctaLabel: 'ZAREZERWUJ STOLIK',
    ctaUrl: '/rezerwacje',
    categories: [
      { title: 'PRZYSTAWKI', column: 'left', items: [
        { name: 'TATAR WOŁOWY', price: 55, dietary: 'none', ingredients: 'wołowina 60g / ogórek konserwowy / szalotka / borowik / musztarda francuska / kapary / oliwa z oliwek / sos worcestershire / papryka / żółtko / brioszka' },
        { name: 'PIEROGI Z DYNIĄ', price: 49, dietary: 'vg', ingredients: 'dynia / pigwa / marchew / ziemniak / cebula / imbir / sos śliwkowy / chili / czosnek / pestki dyni' },
      ] },
      { title: 'ZUPY', column: 'left', items: [
        { name: 'KREM Z DYNI', price: 55, dietary: 'v', ingredients: 'pieczona dynia / cebula / pomidory pelati / żółte curry / ziemniak / pestki dyni / oliwa' },
      ] },
      { title: 'PRZEKĄSKI', column: 'left', items: [
        { name: 'SELEKCJA SERÓW', price: 67, dietary: 'v', ingredients: 'selekcja serów / krakersy / orzechy włoskie' },
        { name: 'SELEKCJA WĘDLIN', price: 67, dietary: 'none', ingredients: 'selekcja wędlin / krakersy / żurawina suszona' },
        { name: 'SELEKCJA SERÓW I WĘDLIN', price: 97, dietary: 'pair', ingredients: 'selekcja wędlin / krakersy / żurawina suszona' },
      ] },
      { title: 'DANIA GŁÓWNE', column: 'right', items: [
        { name: 'BURGER BBQ', price: 49, dietary: 'none', ingredients: 'wołowina 180g / bułka maślana / ser cheddar / boczek / pomidor / marmolada z czerwonej cebuli / ogórek konserwowy / sos bbq / frytki' },
        { name: 'SAŁATKA CEZAR Z KURCZAKIEM', price: 49, dietary: 'none', ingredients: 'sałata rzymska / kurczak / parmezan / pancetta / pomidorki cherry / grzanki / sos cezar' },
        { name: 'SAŁATKA CEZAR Z KREWETKAMI', price: 65, dietary: 'none', ingredients: 'sałata rzymska / krewetki / parmezan / pancetta / pomidorki cherry / grzanki / sos cezar' },
        { name: 'PAPPARDELLE Z KREWETKAMI W SOSIE SZAFRANOWO-POMARAŃCZOWYM', price: 77, dietary: 'none', ingredients: 'makaron pappardelle / krewetki / pomidorki koktajlowe / sos szafranowo-pomarańczowy / pietruszka' },
      ] },
      { title: 'DESERY', column: 'right', items: [
        { name: 'SZARLOTKA NA CIEPŁO', price: 35, dietary: 'none', ingredients: 'szarlotka / lody waniliowe / bita śmietana' },
        { name: 'TIRAMISÙ', price: 35, dietary: 'none', ingredients: 'biszkopty / kawa / likier amaretto / likier kawowy / mascarpone / jajka / cukier / kakao' },
      ] },
    ],
    notice:
      'Wszystkie podane ceny są w polskich złotych (PLN) i zawierają podatek VAT. W przypadku rezerwacji powyżej 9 osób pobierana jest opłata serwisowa w wysokości 10% wartości rachunku, przy mniejszej liczbie osób serwis nie jest wliczony w cenę.\n\nJeśli masz wymagania dietetyczne lub dotyczące alergenów poinformuj o tym nasz zespół.',
  }
  const specialMenuEn = {
    blockType: 'specialMenu',
    image: twoje,
    heading: 'Social Sunday',
    subtitle: 'A special menu and a relaxed atmosphere',
    body: 'End the week together with us! Social Sunday is a special evening in a club atmosphere — from 4 pm to 9 pm. Between 5 pm and 8 pm, dancing to the greatest musical hits of the 20th century.',
    ctaLabel: 'BOOK A TABLE',
    ctaUrl: '/rezerwacje',
    categories: [
      { title: 'STARTERS', column: 'left', items: [
        { name: 'BEEF TARTARE', price: 55, dietary: 'none', ingredients: 'beef 60g / pickled cucumber / shallot / porcini / French mustard / capers / olive oil / Worcestershire sauce / pepper / egg yolk / brioche' },
        { name: 'PUMPKIN DUMPLINGS', price: 49, dietary: 'vg', ingredients: 'pumpkin / quince / carrot / potato / onion / ginger / plum sauce / chilli / garlic / pumpkin seeds' },
      ] },
      { title: 'SOUPS', column: 'left', items: [
        { name: 'PUMPKIN CREAM SOUP', price: 55, dietary: 'v', ingredients: 'roasted pumpkin / onion / pelati tomatoes / yellow curry / potato / pumpkin seeds / olive oil' },
      ] },
      { title: 'SNACKS', column: 'left', items: [
        { name: 'CHEESE SELECTION', price: 67, dietary: 'v', ingredients: 'cheese selection / crackers / walnuts' },
        { name: 'CHARCUTERIE SELECTION', price: 67, dietary: 'none', ingredients: 'charcuterie / crackers / dried cranberries' },
        { name: 'CHEESE & CHARCUTERIE SELECTION', price: 97, dietary: 'pair', ingredients: 'charcuterie / crackers / dried cranberries' },
      ] },
      { title: 'MAIN COURSES', column: 'right', items: [
        { name: 'BBQ BURGER', price: 49, dietary: 'none', ingredients: 'beef 180g / butter bun / cheddar / bacon / tomato / red onion marmalade / pickled cucumber / bbq sauce / fries' },
        { name: 'CAESAR SALAD WITH CHICKEN', price: 49, dietary: 'none', ingredients: 'romaine / chicken / parmesan / pancetta / cherry tomatoes / croutons / Caesar dressing' },
        { name: 'CAESAR SALAD WITH PRAWNS', price: 65, dietary: 'none', ingredients: 'romaine / prawns / parmesan / pancetta / cherry tomatoes / croutons / Caesar dressing' },
        { name: 'PAPPARDELLE WITH PRAWNS IN SAFFRON-ORANGE SAUCE', price: 77, dietary: 'none', ingredients: 'pappardelle / prawns / cocktail tomatoes / saffron-orange sauce / parsley' },
      ] },
      { title: 'DESSERTS', column: 'right', items: [
        { name: 'WARM APPLE PIE', price: 35, dietary: 'none', ingredients: 'apple pie / vanilla ice cream / whipped cream' },
        { name: 'TIRAMISÙ', price: 35, dietary: 'none', ingredients: 'ladyfingers / coffee / amaretto liqueur / coffee liqueur / mascarpone / eggs / sugar / cocoa' },
      ] },
    ],
    notice:
      'All prices are in Polish złoty (PLN) and include VAT. For reservations of more than 9 guests a 10% service charge applies; for smaller groups the service is not included in the price.\n\nIf you have any dietary requirements or allergens, please inform our team.',
  }
  await page('restaurant', 'Restauracja', [
    { blockType: 'pageHero', eyebrow: 'Kolacja, która dopełnia wieczór', title: 'Restauracja', titleStyle: 'serif', backgroundImage: rest, inlineLinkLabel: 'NASZE MENU', inlineLinkUrl: '#menu' },
    { blockType: 'aboutIntro', eyebrow: 'Nasza kuchnia', heading: 'Dania inspirowane kulturą różnych stanów USA', body: 'Karta dań nawiązuje do kuchni amerykańskiej z akcentami europejskimi. Menu stanowi dopełnienie wieczoru — tworząc wraz z muzyką i rozmową jedną spójną, klubową całość. Dania i napoje możesz zamówić przed koncertem lub w jego trakcie — obsługa pozostaje do pełnej dyspozycji. W karcie oferta wegetariańska oraz starannie dobrane wina i koktajle.' },
    { blockType: 'menuGallery', eyebrow: 'Karta dań', heading: 'NASZE MENU', pdfLabel: 'ZOBACZ CAŁE MENU (PDF)', aspectRatio: '707/1000', rows: menuTiles },
    setMenuPl,
    specialMenuPl,
    { blockType: 'bentoSection', items: [
      { image: bar, colSpan: 'full', label: 'Autorskie koktajle, selekcja alkoholi mocnych i win z całego świata.', title: 'COCKTAIL BAR', ctaLabel: 'SPRAWDŹ MENU', ctaUrl: '/bar-and-cocktails' },
    ] },
  ], 'Restaurant', [
    { blockType: 'pageHero', eyebrow: 'Dinner that completes the evening', title: 'Restaurant', titleStyle: 'serif', backgroundImage: rest, inlineLinkLabel: 'OUR MENU', inlineLinkUrl: '#menu' },
    { blockType: 'aboutIntro', eyebrow: 'Our kitchen', heading: 'Dishes inspired by the culture of different US states', body: 'The menu draws on American cuisine with European accents. It is a complement to the evening — forming, together with the music and conversation, one coherent, club-like whole. You can order dishes and drinks before the concert or during it — the staff remain fully at your disposal. The menu includes a vegetarian offer and carefully selected wines and cocktails.' },
    { blockType: 'menuGallery', eyebrow: 'The menu', heading: 'OUR MENU', pdfLabel: 'SEE THE FULL MENU (PDF)', aspectRatio: '707/1000', rows: menuTiles },
    setMenuEn,
    specialMenuEn,
    { blockType: 'bentoSection', items: [
      { image: bar, colSpan: 'full', label: 'Signature cocktails, a selection of premium spirits and wines from around the world.', title: 'COCKTAIL BAR', ctaLabel: 'SEE THE MENU', ctaUrl: '/bar-and-cocktails' },
    ] },
  ])

  // BAR
  await page('bar-and-cocktails', 'Cocktail Bar', [
    { blockType: 'pageHero', eyebrow: 'Starannie dobrana selekcja win oraz autorskie koktajle', title: 'Cocktail Bar', titleStyle: 'serif', backgroundImage: await heroImg('bar-and-cocktails', PLACEHOLDER('bar'), 'Cocktail Bar — Hero') },
    { blockType: 'aboutIntro', heading: 'Przestrzeń spotkań z wyjątkowym smakiem', subheading: 'Dopełnienie klubowego charakteru wieczoru', body: 'Oferujemy starannie dobraną selekcję win oraz autorskie koktajle przygotowywane przez doświadczonych barmanów. Wina, drinki i koktajle serwowane są zarówno przy barze, jak i bezpośrednio do stolików, tak aby goście mogli swobodnie rozmawiać, słuchać muzyki i pozostać przy stole przez cały wieczór. W karcie znajdują się wina, alkohole premium oraz klasyczne i autorskie koktajle — skomponowane z myślą o klubowym charakterze wieczoru.' },
    { blockType: 'menuSection', sectionTag: 'KOKTAJLE AUTORSKIE', heading: 'Koktajle', menuType: 'cocktails', layout: 'cardGrid', groupByCategory: false },
    { blockType: 'bentoSection', heading: 'WIĘCEJ', items: [
      { image: await img.restauracja(), colSpan: 'half', label: 'Kuchnia inspirowana kulturą różnych stanów USA. Autorskie dania w nowoczesnej formie.', title: 'RESTAURACJA', ctaLabel: 'SPRAWDŹ MENU', ctaUrl: '/restaurant' },
      { image: await img.cigar(), colSpan: 'half', label: 'Profesjonalna przestrzeń dla miłośników cygar. Starannie dobrana oferta cygar i alkoholi.', title: 'CIGAR ROOM', ctaLabel: 'SPRAWDŹ MENU', ctaUrl: '/cigar-lounge' },
    ] },
  ], 'Cocktail Bar', [
    { blockType: 'pageHero', eyebrow: 'A carefully curated wine selection and signature cocktails', title: 'Cocktail Bar', titleStyle: 'serif', backgroundImage: await heroImg('bar-and-cocktails', PLACEHOLDER('bar'), 'Cocktail Bar — Hero') },
    { blockType: 'aboutIntro', heading: 'A meeting space with exceptional flavour', subheading: 'The finishing touch to the club character of the evening', body: 'We offer a carefully curated selection of wines and signature cocktails prepared by experienced bartenders. Wines, drinks and cocktails are served both at the bar and directly to the tables, so guests can chat freely, listen to the music and stay at their table all evening long. The menu features wines, premium spirits and classic and signature cocktails — composed with the club character of the evening in mind.' },
    { blockType: 'menuSection', sectionTag: 'SIGNATURE COCKTAILS', heading: 'Cocktails', menuType: 'cocktails', layout: 'cardGrid', groupByCategory: false },
    { blockType: 'bentoSection', heading: 'MORE', items: [
      { image: await img.restauracja(), colSpan: 'half', label: 'A kitchen inspired by the culture of different US states. Signature dishes with a modern touch.', title: 'RESTAURANT', ctaLabel: 'SEE THE MENU', ctaUrl: '/restaurant' },
      { image: await img.cigar(), colSpan: 'half', label: 'A professional space for cigar lovers. A carefully curated selection of cigars and spirits.', title: 'CIGAR ROOM', ctaLabel: 'SEE THE MENU', ctaUrl: '/cigar-lounge' },
    ] },
  ])

  // CIGAR ROOM
  await page('cigar-lounge', 'Cigar Room', [
    { blockType: 'pageHero', eyebrow: 'Uzupełnienie wieczoru w otoczeniu klubowej elegancji', title: 'Cigar Room', titleStyle: 'serif', backgroundImage: await heroImg('cigar-lounge', PLACEHOLDER('cigar'), 'Cigar Room — Hero') },
    { blockType: 'aboutIntro', heading: 'Profesjonalna przestrzeń dla miłośników cygar', subheading: 'Starannie dobrana oferta cygar i alkoholi', body: 'Palarnia cygar w American Dream Club to przestrzeń stworzona z myślą o gościach, którzy cenią spokojną rozmowę i kulturę celebrowania cygara czy fajki. Zapewnia komfortowe warunki oraz atmosferę sprzyjającą dłuższemu pobytowi. Oferujemy starannie dobraną selekcję cygar, przechowywanych w odpowiednich warunkach i podawanych z należytą dbałością. Do wyboru starannie dobrane trunki, szlachetne whisky i koniaki naturalnie wpisujące się w charakter tego miejsca. Palarnia stanowi uzupełnienie wieczoru — przed koncertem, w przerwie lub po jego zakończeniu. Dedykowana dla osób, które oczekują dyskrecji, spokoju i poczucia bezpieczeństwa, w otoczeniu klubowej elegancji.' },
    { blockType: 'menuImage', eyebrow: 'CYGARA', heading: 'Cygara', enableLightbox: true, images: [
      { image: await img.cigarMenu(), caption: 'Starannie dobrana oferta cygar' },
    ] },
    { blockType: 'imageGallery', columns: '3', enableLightbox: true, images: [
      { image: await img.cigar(), size: 'tall' }, { image: await img.bar(), size: 'wide' }, { image: await img.restauracja(), size: 'normal' },
      { image: await img.program(), size: 'normal' }, { image: await img.special(), size: 'normal' }, { image: await img.gallery(), size: 'normal' }, { image: await img.home(), size: 'normal' },
    ] },
    { blockType: 'bentoSection', items: [
      { image: await img.restauracja(), colSpan: 'half', label: 'Kuchnia inspirowana kulturą różnych stanów USA. Autorskie dania w nowoczesnej formie.', title: 'RESTAURACJA', ctaLabel: 'RESTAURACJA ›', ctaUrl: '/restaurant' },
      { image: await img.bar(), colSpan: 'half', label: 'Autorskie koktajle, selekcja alkoholi mocnych i win z całego świata.', title: 'COCKTAIL BAR', ctaLabel: 'COCKTAIL BAR ›', ctaUrl: '/bar-and-cocktails' },
    ] },
  ], 'Cigar Room', [
    { blockType: 'pageHero', eyebrow: 'A perfect close to the evening amid club elegance', title: 'Cigar Room', titleStyle: 'serif', backgroundImage: await heroImg('cigar-lounge', PLACEHOLDER('cigar'), 'Cigar Room — Hero') },
    { blockType: 'aboutIntro', heading: 'A professional space for cigar lovers', subheading: 'A carefully curated selection of cigars and spirits', body: 'The cigar lounge at American Dream Club is a space created for guests who value calm conversation and the culture of savouring a fine cigar or pipe. It offers comfortable conditions and an atmosphere that invites a longer stay. We offer a carefully curated selection of cigars, stored in the right conditions and served with due care. To go with them, a selection of fine spirits, noble whiskies and cognacs that naturally fit the character of this place. The lounge is a complement to the evening — before the concert, during the interval or after it ends. Dedicated to those who expect discretion, calm and a sense of security, amid club elegance.' },
    { blockType: 'menuImage', eyebrow: 'CIGARS', heading: 'Cigars', enableLightbox: true, images: [
      { image: await img.cigarMenu(), caption: 'A carefully curated selection of cigars' },
    ] },
    { blockType: 'imageGallery', columns: '3', enableLightbox: true, images: [
      { image: await img.cigar(), size: 'tall' }, { image: await img.bar(), size: 'wide' }, { image: await img.restauracja(), size: 'normal' },
      { image: await img.program(), size: 'normal' }, { image: await img.special(), size: 'normal' }, { image: await img.gallery(), size: 'normal' }, { image: await img.home(), size: 'normal' },
    ] },
    { blockType: 'bentoSection', items: [
      { image: await img.restauracja(), colSpan: 'half', label: 'A kitchen inspired by the culture of different US states. Signature dishes with a modern touch.', title: 'RESTAURANT', ctaLabel: 'RESTAURANT ›', ctaUrl: '/restaurant' },
      { image: await img.bar(), colSpan: 'half', label: 'Signature cocktails, a selection of premium spirits and wines from around the world.', title: 'COCKTAIL BAR', ctaLabel: 'COCKTAIL BAR ›', ctaUrl: '/bar-and-cocktails' },
    ] },
  ])

  // PROGRAM
  await page('program', 'Program', [
    { blockType: 'pageHero', eyebrow: 'Sprawdź nadchodzące wydarzenia i zaplanuj swój wieczór', title: 'Program', titleStyle: 'serif', backgroundImage: await heroImg('program', PLACEHOLDER('program'), 'Program — Hero') },
    { blockType: 'aboutIntro', heading: 'Muzyka, którą gramy', subheading: 'Największe standardy świata — inny klimat w każdy wieczór.', body: 'W klubie gramy największe amerykańskie i światowe standardy. Usłyszysz: jazz, swing, blues, soul i country — oraz najlepsze europejskie melodie. To brzmienie, które przez dekady kształtowały kulturę klubową oraz emocje słuchaczy, przywołując klimat najlepszych lat XX wieku. Każdy wieczór ma charakter przewodni — sprawdź w kalendarzu poniżej.' },
    { blockType: 'eventsCalendar', variant: 'full', heading: 'KALENDARZ', eventsSource: 'auto', autoCount: 6 },
    { blockType: 'specialEvents', eyebrow: 'Nie przegap', heading: 'WYDARZENIA SPECJALNE', limit: 4 },
    { blockType: 'musiciansGrid', eyebrow: 'Poznaj', heading: 'NASI MUZYCY', intro: 'Na scenie występują wykształceni i zdolni poznańscy muzycy — artyści związani ze środowiskami akademickimi oraz sceną koncertową. Grają dla Twojej radości z autentycznym zaangażowaniem i osobistą interpretacją, bez estradowego patosu, ale z prawdziwą muzyczną energią. Tutaj znajdziesz się blisko muzyków, poczujesz ich emocje i staniesz się częścią wydarzenia.' },
    // Design: "WYDARZENIA CYKLICZNE" heading sits directly above the two cards (no separate teaser).
    { blockType: 'bentoSection', subheading: 'Powtarzające się', heading: 'WYDARZENIA CYKLICZNE', items: [
      { colSpan: 'half', label: 'Niedziela w doborowym towarzystwie! Spotkaj się przy dobrym koktajlu, a to wszystko od godziny 18:00.', title: 'TOWARZYSKA NIEDZIELA', ctaLabel: 'TOWARZYSKA NIEDZIELA ›', ctaUrl: '/wydarzenia-cykliczne/towarzyska-niedziela' },
      { colSpan: 'half', label: 'Wieczory kina niemego z akompaniamentem fortepianu na żywo. Poczuj klimat dawnych lat!', title: 'KLUB X MUZY', ctaLabel: 'KLUB X MUZY ›', ctaUrl: '/wydarzenia-cykliczne/klub-x-muzy' },
    ] },
  ], 'Program', [
    { blockType: 'pageHero', eyebrow: 'Check the upcoming events and plan your evening', title: 'Program', titleStyle: 'serif', backgroundImage: await heroImg('program', PLACEHOLDER('program'), 'Program — Hero') },
    { blockType: 'aboutIntro', heading: 'The music we play', subheading: "The world's greatest standards — a different vibe every evening.", body: "At the club we play the greatest American and international standards. You'll hear jazz, swing, blues, soul and country — and the finest European melodies. This is the sound that for decades shaped club culture and the emotions of listeners, evoking the spirit of the best years of the 20th century. Every evening has a leading theme — check the calendar below." },
    { blockType: 'eventsCalendar', variant: 'full', heading: 'CALENDAR', eventsSource: 'auto', autoCount: 6 },
    { blockType: 'specialEvents', eyebrow: "Don't miss", heading: 'SPECIAL EVENTS', limit: 4 },
    { blockType: 'musiciansGrid', eyebrow: 'Meet', heading: 'OUR MUSICIANS', intro: 'On stage you will find skilled, well-trained Poznań musicians — artists connected with academic circles and the concert scene. They play for your joy with genuine commitment and personal interpretation, without stage pomp but with real musical energy. Here you are close to the musicians, you feel their emotions and become part of the event.' },
    { blockType: 'bentoSection', subheading: 'Recurring', heading: 'RECURRING EVENTS', items: [
      { colSpan: 'half', label: 'Sunday in fine company! Meet over a good cocktail, all from 6 pm.', title: 'SOCIAL SUNDAY', ctaLabel: 'SOCIAL SUNDAY ›', ctaUrl: '/wydarzenia-cykliczne/towarzyska-niedziela' },
      { colSpan: 'half', label: 'Silent-film evenings with live piano accompaniment. Feel the spirit of bygone years!', title: 'KLUB X MUZY', ctaLabel: 'KLUB X MUZY ›', ctaUrl: '/wydarzenia-cykliczne/klub-x-muzy' },
    ] },
  ])

  // TWOJE WYDARZENIE
  await page('business', 'Twoje wydarzenie', [
    { blockType: 'pageHero', eyebrow: 'Codziennie ktoś u nas świętuje', title: 'Twoje wydarzenie', titleStyle: 'serif', backgroundImage: await heroImg('business', PLACEHOLDER('twoje'), 'Twoje wydarzenie — Hero') },
    { blockType: 'aboutIntro', heading: 'Urodziny. Rocznice. Imprezy firmowe.', subheading: 'Zaproś Gości — my zajmiemy się resztą!', body: 'Twoje wyjątkowe wydarzenie wymaga specjalnej oprawy. Zaproś Gości do American Dream Club, a my wszystko zorganizujemy. Przygotujemy ofertę dopasowaną do Twoich potrzeb i charakteru wydarzenia. Zadbamy o menu, serwis, oprawę muzyczną, atrakcje wieczoru i dekoracje. Wszystkie szczegóły ustalimy z Tobą indywidualnie.' },
    { blockType: 'offerCards', style: 'framed', cards: [
      { image: await img.twoje(), tag: 'IMPREZY PRYWATNE', title: 'URODZINY I ROCZNICE W CENTRUM POZNANIA', body: 'Nasz klub to idealne miejsce, jeśli chcesz świętować spokojnie, z bliską rodziną i muzyką w tle. Ty przychodzisz z Gośćmi — my zajmiemy się organizacją, oprawą i przebiegiem wieczoru. Wszystkie szczegóły organizacyjne — menu, układ sali oraz oprawę wieczoru — ustalimy indywidualnie.', ctaLabel: 'ZADZWOŃ I POZNAJ OFERTĘ', ctaUrl: 'tel:+48508090575' },
      { image: await img.gallery(), tag: 'IMPREZY FIRMOWE', title: 'SPOTKANIA FIRMOWE W KLUBOWEJ ATMOSFERZE', body: 'Eleganckie sale, muzyka na żywo, pełna obsługa — Ty jesteś gościem, my zajmiemy się resztą. Oferujemy przestrzeń dla grup od kilku do 120 osób. Korzystamy z menu à la carte albo uzgodnionego menu grupowego w stałej, z góry określonej cenie.', ctaLabel: 'ZADZWOŃ I DOPASUJ OFERTĘ', ctaUrl: 'tel:+48508090575' },
    ] },
    { blockType: 'roomSelector', heading: 'DOSTĘPNE STREFY:', rooms: roomIds, equipmentHeading: 'WYPOSAŻENIE:', offerHeading: 'CO PRZYGOTUJEMY DLA CIEBIE:', offerItems: [
      { item: 'Możliwość rezerwacji całego lokalu na wyłączność lub jego części' },
      { item: 'Usługa gastronomiczna w formie serwowanej lub bufetowej, na wstępie spotkania możemy przygotować małe przekąski Finger Food' },
      { item: 'Szeroka oferta win, drinków i koktajli w ramach zamówienia — w tym Open Bar' },
      { item: 'Na życzenie przygotujemy torty, ciasta i lody' },
      { item: 'Cała oferta gastronomiczna przygotowana pod życzenie organizatora i przewidziany budżet' },
      { item: 'Ustawienie stołów i zaplanowanie stref w klubie według życzenia — różne aranżacje' },
      { item: 'Atrakcje dodatkowe: koncert lub inna oprawa muzyczna według życzenia organizatora' },
      { item: 'Czas spotkania dostosujemy do propozycji organizatora' },
      { item: 'Maksymalna liczba uczestników: 120 osób' },
      { item: 'Rezerwację dla grup przyjmujemy z wyprzedzeniem do 1 miesiąca' },
    ] },
    { blockType: 'imageGallery', images: [
      { image: await img.program() }, { image: await img.bar() }, { image: await img.twoje() }, { image: await img.gallery() },
    ] },
    { blockType: 'salesContact', heading: 'POROZMAWIAJMY O TWOIM WYDARZENIU!', teamMember: managerId, callLabel: 'ZADZWOŃ', emailLabel: 'NAPISZ WIADOMOŚĆ', style: 'gold' },
    { blockType: 'testimonials', heading: 'CO MÓWIĄ NASI GOŚCIE', reviewSummary: '500+ opinii · 4,8/5 w Google', items: testis.map(([name, text]) => ({ name, stars: 5, text })) },
  ], 'Your event', [
    { blockType: 'pageHero', eyebrow: 'Every day someone is celebrating with us', title: 'Your event', titleStyle: 'serif', backgroundImage: await heroImg('business', PLACEHOLDER('twoje'), 'Twoje wydarzenie — Hero') },
    { blockType: 'aboutIntro', heading: 'Birthdays. Anniversaries. Corporate events.', subheading: "Invite your guests — we'll take care of the rest!", body: "Your special occasion deserves a special setting. Invite your guests to American Dream Club and we'll organise everything. We'll prepare an offer tailored to your needs and the character of the event. We'll take care of the menu, service, music, evening attractions and decorations. We'll agree on every detail with you individually." },
    { blockType: 'offerCards', style: 'framed', cards: [
      { image: await img.twoje(), tag: 'PRIVATE PARTIES', title: 'BIRTHDAYS AND ANNIVERSARIES IN THE HEART OF POZNAŃ', body: "Our club is the perfect place if you want to celebrate calmly, with close family and music in the background. You arrive with your guests — we'll handle the organisation, the setting and the running of the evening. We'll agree on every organisational detail — the menu, the room layout and the evening's setting — individually.", ctaLabel: 'CALL AND ASK ABOUT THE OFFER', ctaUrl: 'tel:+48508090575' },
      { image: await img.gallery(), tag: 'CORPORATE EVENTS', title: 'COMPANY GATHERINGS IN A CLUB ATMOSPHERE', body: "Elegant rooms, live music, full service — you are the guest, we'll take care of the rest. We offer space for groups from a few to 120 people. We work from an à la carte menu or an agreed group menu at a fixed, predetermined price.", ctaLabel: 'CALL AND TAILOR THE OFFER', ctaUrl: 'tel:+48508090575' },
    ] },
    { blockType: 'roomSelector', heading: 'AVAILABLE SPACES:', rooms: roomIds, equipmentHeading: 'EQUIPMENT:', offerHeading: "WHAT WE'LL PREPARE FOR YOU:", offerItems: [
      { item: 'Option to book the entire venue exclusively or just part of it' },
      { item: 'Catering service, plated or buffet style; to start we can prepare small Finger Food snacks' },
      { item: 'A wide selection of wines, drinks and cocktails as part of the order — including an Open Bar' },
      { item: "On request we'll prepare cakes, pastries and ice cream" },
      { item: "The whole catering offer prepared to the organiser's wishes and planned budget" },
      { item: 'Table arrangement and zoning of the club to your wishes — various layouts' },
      { item: "Extra attractions: a concert or other live music to the organiser's wishes" },
      { item: "We'll adjust the meeting time to the organiser's proposal" },
      { item: 'Maximum number of participants: 120 people' },
      { item: 'We accept group reservations up to 1 month in advance' },
    ] },
    { blockType: 'imageGallery', images: [
      { image: await img.program() }, { image: await img.bar() }, { image: await img.twoje() }, { image: await img.gallery() },
    ] },
    { blockType: 'salesContact', heading: "LET'S TALK ABOUT YOUR EVENT!", teamMember: managerId, callLabel: 'CALL US', emailLabel: 'WRITE A MESSAGE', style: 'gold' },
    { blockType: 'testimonials', heading: 'WHAT OUR GUESTS SAY', reviewSummary: '500+ reviews · 4.8/5 on Google', items: testiItemsEn },
  ])

  // REZERWACJE
  await page('rezerwacje', 'Rezerwacja', [
    { blockType: 'pageHero', eyebrow: 'Zaplanuj swój wieczór', title: 'Rezerwacja', titleStyle: 'serif', backgroundImage: await heroImg('rezerwacje', PLACEHOLDER('restauracja'), 'Rezerwacja — Hero') },
    { blockType: 'aboutIntro', heading: 'Zaplanuj swój wieczór', body: 'Twoje wyjątkowe wydarzenie wymaga specjalnej oprawy. Zaproś Gości do American Dream Club, a my zajmiemy się pełną organizacją.' },
    { blockType: 'eveningPhases', heading: 'ZAPLANUJ SWÓJ WIECZÓR', phases: [
      { image: await img.restauracja(), title: 'OTWARCIE WIECZORU', timeLabel: 'od 17:00', body: 'Zapraszamy do rozpoczęcia wieczoru w spokojnej, klubowej atmosferze. Rezerwacja stolika jest bezpłatna. Planujesz zostać na koncert? Prosimy o wcześniejszy zakup biletu.', primaryCtaLabel: 'ZAREZERWUJ STOLIK', primaryCtaUrl: 'tel:+48500210333' },
      { image: await img.program(), title: 'KONCERTY I WYDARZENIA MUZYCZNE', linkToCalendar: true, timeLabel: 'od 19:00', body: 'Wyjątkowy wieczór z muzyką na żywo. Subtelne brzmienia fortepianu i saksofonu, elegancka improwizacja oraz klimat klasycznego jazzu tworzą niezapomniane doświadczenie muzyczne.', primaryCtaLabel: 'ZAREZERWUJ STOLIK', primaryCtaUrl: 'tel:+48500210333', secondaryCtaLabel: 'KUP BILET', secondaryCtaUrl: '/events' },
      { image: await img.bar(), title: 'WIECZÓR KLUBOWY', timeLabel: '21:00–23:00', body: 'Po części koncertowej zapraszamy do dalszego spędzenia czasu w naszej przestrzeni. Na gości czeka projekcja koncertu na dużym ekranie oraz starannie przygotowana oferta kuchni i baru. Rezerwacja stolika pozostaje bezpłatna.', primaryCtaLabel: 'ZAREZERWUJ STOLIK', primaryCtaUrl: 'tel:+48500210333' },
    ] },
    { blockType: 'salesContact', heading: 'REZERWACJA', teamMember: reservationContactId, callLabel: 'ZADZWOŃ', emailLabel: 'NAPISZ WIADOMOŚĆ', style: 'gold' },
    { blockType: 'notice21Plus', heading: 'Szanowni Goście', body: 'Uprzejmie informujemy, że American Dream Club jest miejscem przeznaczonym wyłącznie dla osób dorosłych powyżej 21. roku życia. Dziękujemy za zrozumienie i zapraszamy serdecznie wszystkich pełnoletnich miłośników dobrej zabawy!', ctaLabel: 'REGULAMIN KLUBU 21+', ctaUrl: '/contact' },
  ], 'Reservation', [
    { blockType: 'pageHero', eyebrow: 'Plan your evening', title: 'Reservation', titleStyle: 'serif', backgroundImage: await heroImg('rezerwacje', PLACEHOLDER('restauracja'), 'Rezerwacja — Hero') },
    { blockType: 'aboutIntro', heading: 'Plan your evening', body: "Your special occasion deserves a special setting. Invite your guests to American Dream Club and we'll take care of the full organisation." },
    { blockType: 'eveningPhases', heading: 'PLAN YOUR EVENING', phases: [
      { image: await img.restauracja(), title: 'START OF THE EVENING', timeLabel: 'od 17:00', body: 'Start your evening in a calm, club atmosphere. Booking a table is free of charge. Planning to stay for the concert? Please buy a ticket in advance.', primaryCtaLabel: 'BOOK A TABLE', primaryCtaUrl: 'tel:+48500210333' },
      { image: await img.program(), title: 'CONCERTS & MUSIC EVENTS', linkToCalendar: true, timeLabel: 'od 19:00', body: 'A special evening of live music. The subtle sounds of piano and saxophone, elegant improvisation and the atmosphere of classic jazz create an unforgettable musical experience.', primaryCtaLabel: 'BOOK A TABLE', primaryCtaUrl: 'tel:+48500210333', secondaryCtaLabel: 'BUY TICKET', secondaryCtaUrl: '/events' },
      { image: await img.bar(), title: 'CLUB NIGHT', timeLabel: '21:00–23:00', body: 'After the concert, stay on and enjoy more time in our space. Guests can watch the concert on a large screen and enjoy a carefully prepared food and bar offering. Booking a table remains free of charge.', primaryCtaLabel: 'BOOK A TABLE', primaryCtaUrl: 'tel:+48500210333' },
    ] },
    { blockType: 'salesContact', heading: 'RESERVATION', teamMember: reservationContactId, callLabel: 'CALL US', emailLabel: 'WRITE TO US', style: 'gold' },
    { blockType: 'notice21Plus', heading: 'Dear Guests', body: 'Please note that American Dream Club is a venue reserved exclusively for adults aged 21 and over.', ctaLabel: 'CLUB RULES 21+', ctaUrl: '/contact' },
  ])

  // KONTAKT
  await page('contact', 'Kontakt', [
    { blockType: 'pageHero', title: 'Kontakt', titleStyle: 'serif', backgroundImage: await heroImg('contact', PLACEHOLDER('bar'), 'Kontakt — Hero') },
    { blockType: 'contactInfo', showForm: true, formHeading: 'SKONTAKTUJ SIĘ Z NAMI', showMap: true },
    { blockType: 'newsletterCTA', heading: 'NEWSLETTER', body: 'Zapisz się i bądź na bieżąco.', placeholder: 'Adres email', buttonLabel: 'ZAPISZ SIĘ', consentText: 'Akceptuję politykę prywatności' },
    { blockType: 'artistCTA', eyebrow: 'Jesteś muzykiem? Zapraszamy do współpracy!', heading: 'KONTAKT DLA ARTYSTÓW', backgroundImage: await img.special(), ctaLabel: 'DOWIEDZ SIĘ WIĘCEJ', ctaUrl: '/kontakt-dla-artystow' },
  ], 'Contact', [
    { blockType: 'pageHero', title: 'Contact', titleStyle: 'serif', backgroundImage: await heroImg('contact', PLACEHOLDER('bar'), 'Kontakt — Hero') },
    { blockType: 'contactInfo', showForm: true, formHeading: 'GET IN TOUCH', showMap: true },
    { blockType: 'newsletterCTA', heading: 'NEWSLETTER', body: 'Sign up and stay up to date.', placeholder: 'Email address', buttonLabel: 'SIGN UP', consentText: 'I accept the privacy policy' },
    { blockType: 'artistCTA', eyebrow: "Are you a musician? We'd love to work with you!", heading: 'CONTACT FOR ARTISTS', backgroundImage: await img.special(), ctaLabel: 'LEARN MORE', ctaUrl: '/kontakt-dla-artystow' },
  ])

  // KONTAKT DLA ARTYSTÓW
  await page('kontakt-dla-artystow', 'Kontakt dla artystów', [
    { blockType: 'pageHero', eyebrow: 'Jesteś muzykiem? Zapraszamy do współpracy!', title: 'Kontakt dla artystów', titleStyle: 'serif', backgroundImage: await heroImg('kontakt-dla-artystow', PLACEHOLDER('special'), 'Kontakt dla artystów — Hero') },
    { blockType: 'aboutIntro', heading: 'Zagraj w American Dream Club', body: 'W American Dream Club grają muzycy z pasją i warsztatem. Współpracujemy z absolwentami i studentami Akademii Muzycznej oraz doświadczonymi muzykami z poznańskiej sceny jazzowej. Jeśli grasz jazz, soul, blues, swing lub pokrewne gatunki i chcesz wystąpić przed wymagającą publicznością — wypełnij formularz. Odezwiemy się do Ciebie.' },
    { blockType: 'artistForm', eyebrow: 'Jesteś muzykiem? Zapraszamy do współpracy!', heading: 'FORMULARZ KONTAKTOWY', intro: 'Wypełnij formularz, a nasz zespół skontaktuje się z Tobą w sprawie współpracy.' },
  ], 'Contact for artists', [
    { blockType: 'pageHero', eyebrow: "Are you a musician? We'd love to work with you!", title: 'Contact for artists', titleStyle: 'serif', backgroundImage: await heroImg('kontakt-dla-artystow', PLACEHOLDER('special'), 'Kontakt dla artystów — Hero') },
    { blockType: 'aboutIntro', heading: 'Play at American Dream Club', body: "At American Dream Club we host musicians with passion and craft. We work with graduates and students of the Academy of Music and experienced musicians from the Poznań jazz scene. If you play jazz, soul, blues, swing or related genres and want to perform for a discerning audience — fill in the form. We'll get back to you." },
    { blockType: 'artistForm', eyebrow: "Are you a musician? We'd love to work with you!", heading: 'CONTACT FORM', intro: 'Fill in the form and our team will get in touch with you about working together.' },
  ])

  log('✅ Seed complete.')
  process.exit(0)
}

// Top-level await so `payload run` (used for remote seeding) waits for completion.
await run().catch((e) => {
  console.error(e)
  process.exit(1)
})
