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
import path from 'path'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

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

  // The ADC_*.jpg files are full PAGE-DESIGN screenshots, not content photos —
  // using them as hero/card backgrounds looks wrong (text baked into the image).
  // Per decision: render clean brand cards now; real photos get uploaded via CMS
  // into each item's `image` field later. Only the real logo is kept.
  const none = () => Promise.resolve<number | null>(null)
  const img = {
    home: none,
    restauracja: none,
    bar: none,
    cigar: none,
    program: none,
    twoje: none,
    single: none,
    special: none,
    gallery: none,
    logo: () => media('public/images/logo-on-navy.jpg', 'American Dream Club logo'),
  }

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
    address: 'ul. Dominikańska 9, 61-456 Poznań',
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
      'https://www.google.com/maps?q=ul.+Dominika%C5%84ska+9,+61-456+Pozna%C5%84&output=embed',
    reservationUrl: 'tel:+48500210333',
    reviewAggregate: '500+ opinii · 4,8/5 w Google',
  }, {
    // localized: address, reviewAggregate
    address: '9 Dominikańska St., 61-456 Poznań',
    reviewAggregate: '500+ reviews · 4.8/5 on Google',
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

  await setGlobal('legal', {
    regulamin: 'Regulamin klubu American Dream Club. Klub przeznaczony dla osób 21+.',
    privacy: 'Polityka prywatności i zasady dotyczące plików cookie.',
    companyData: 'American Dream Club®, ul. Dominikańska 9, 61-456 Poznań.',
    age21Notice:
      'Uprzejmie informujemy, że American Dream Club jest miejscem przeznaczonym wyłącznie dla osób dorosłych powyżej 21. roku życia. Dziękujemy za zrozumienie i zapraszamy serdecznie wszystkich pełnoletnich miłośników dobrej zabawy!',
  }, {
    regulamin: 'American Dream Club house rules. The club is reserved for guests aged 21 and over.',
    privacy: 'Privacy policy and cookie information.',
    companyData: 'American Dream Club®, 9 Dominikańska St., 61-456 Poznań.',
    age21Notice:
      'Please note that American Dream Club is a venue reserved exclusively for adults aged 21 and over. Thank you for understanding — we warmly welcome all guests of legal age who love a great night out!',
  })

  const logoId = await img.logo()
  await setGlobal('header', {
    logo: logoId,
    topBarText: 'Restauracja & Jazz Club — kolacja i drinki w trakcie koncertu na żywo',
    phone: '+48 500 210 333',
    address: 'ul. Dominikańska 9, 61-456 Poznań',
    socialLinks: [
      { platform: 'facebook', url: 'https://www.facebook.com/americandreamclubpoznan' },
      { platform: 'instagram', url: 'https://www.instagram.com/americandreamclubpoznan/' },
      { platform: 'youtube', url: 'https://www.youtube.com/@americandreamclubpoznan' },
    ],
    navItemsLeft: [
      { link: { type: 'custom', label: 'RESTAURACJA', url: '/restauracja' } },
      { link: { type: 'custom', label: 'PROGRAM', url: '/program' } },
    ],
    navItemsRight: [
      { link: { type: 'custom', label: 'TWOJE WYDARZENIE', url: '/twoje-wydarzenie' } },
      { link: { type: 'custom', label: 'BAR & CIGAR', url: '/bar' } },
      { link: { type: 'custom', label: 'KONTAKT', url: '/kontakt' } },
    ],
    ctaEnabled: true,
    ctaButton: { type: 'custom', label: 'ZAREZERWUJ', url: '/rezerwacje' },
  }, {
    // localized: only topBarText (nav labels live in non-localized link groups)
    topBarText: 'Restaurant & Jazz Club — dinner and drinks during a live concert',
  })

  await setGlobal('footer', {
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
          { label: 'Wydarzenia muzyczne', url: '/program' },
          { label: 'Restauracja', url: '/restauracja' },
          { label: 'Cocktail Bar & Wino', url: '/bar' },
          { label: 'Cygara', url: '/cigar-room' },
        ],
      },
      {
        heading: 'REZERWACJE',
        links: [
          { label: 'Rezerwacje indywidualne', url: '/rezerwacje' },
          { label: 'Imprezy prywatne', url: '/twoje-wydarzenie' },
          { label: 'Imprezy firmowe', url: '/twoje-wydarzenie' },
          { label: 'Kontakt', url: '/kontakt' },
        ],
      },
    ],
    bottomBarLinks: [
      { label: 'AMERICAN DREAM CLUB® 2026 Wszelkie prawa zastrzeżone', url: '/' },
      { label: 'Regulamin klubu', url: '/kontakt' },
      { label: 'Polityka prywatności', url: '/kontakt' },
      { label: 'Dane firmy', url: '/kontakt' },
    ],
    socialLinks: [
      { platform: 'facebook', url: 'https://www.facebook.com/americandreamclubpoznan' },
      { platform: 'instagram', url: 'https://www.instagram.com/americandreamclubpoznan/' },
      { platform: 'youtube', url: 'https://www.youtube.com/@americandreamclubpoznan' },
    ],
  }, {
    // localized: newsletter copy, navColumns headings/labels, bottomBarLinks labels
    newsletter: {
      heading: 'NEWSLETTER',
      placeholder: 'Email address',
      buttonLabel: 'JOIN',
      consentText: 'I accept the privacy policy',
    },
    navColumns: [
      {
        heading: 'WHAT WE OFFER',
        links: [
          { label: 'Live music events', url: '/program' },
          { label: 'Restaurant', url: '/restauracja' },
          { label: 'Cocktail Bar & Wine', url: '/bar' },
          { label: 'Cigars', url: '/cigar-room' },
        ],
      },
      {
        heading: 'RESERVATIONS',
        links: [
          { label: 'Individual reservations', url: '/rezerwacje' },
          { label: 'Private parties', url: '/twoje-wydarzenie' },
          { label: 'Corporate events', url: '/twoje-wydarzenie' },
          { label: 'Contact', url: '/kontakt' },
        ],
      },
    ],
    bottomBarLinks: [
      { label: 'AMERICAN DREAM CLUB® 2026 All rights reserved', url: '/' },
      { label: 'Club rules', url: '/kontakt' },
      { label: 'Privacy policy', url: '/kontakt' },
      { label: 'Company details', url: '/kontakt' },
    ],
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
    musicianIds[name] = await upsert(
      'musicians',
      { slug: { equals: slug } },
      { name, slug, instrument, order: o++, photo: await img.program() },
      { instrument: instrumentEn },
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
      ['Rzutnik: EPSON EB-L265F, 1920×1080 FullHD', 'Łączność: HDMI / Apple TV / ChromeCast', 'Ekran do prezentacji: 1340mm × 2460mm', 'Flipchart z papierem', 'WiFi'],
      'VIP Room', 'An intimate room with a large table seating 12 guests. Ideal for business meetings and intimate celebrations.',
      ['Projector: EPSON EB-L265F, 1920×1080 FullHD', 'Connectivity: HDMI / Apple TV / ChromeCast', 'Presentation screen: 1340mm × 2460mm', 'Flipchart with paper', 'WiFi']],
    ['Cigar Room', 16, 'Profesjonalna palarnia cygar.',
      ['Wentylacja', 'Humidor', 'Wybór alkoholi'],
      'Cigar Room', 'A professional cigar lounge.',
      ['Ventilation', 'Humidor', 'Selection of spirits']],
  ]
  const roomIds: number[] = []
  o = 0
  for (const [name, capacity, description, equipment, nameEn, descriptionEn, equipmentEn] of rooms) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    roomIds.push(
      await upsert('rooms', { slug: { equals: slug } }, {
        name, slug, capacity, description, order: o++,
        equipment: equipment.map((item) => ({ item })),
        gallery: [{ image: await img.twoje() }],
      }, {
        name: nameEn, description: descriptionEn,
        equipment: equipmentEn.map((item) => ({ item })),
      }),
    )
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

  // ════════════════════════════════════════════════════════════════════════
  // TESTIMONIALS
  // ════════════════════════════════════════════════════════════════════════
  log('Seeding testimonials…')
  // [author, plText, enText] — only `text` is localized.
  const testis: [string, string, string][] = [
    ['Jan Kowalski', 'Świetne miejsce, muzyka na żywo i doskonała kuchnia. Wrócę na pewno!',
      "A wonderful place — live music and excellent food. I'll definitely be back!"],
    ['Anna Nowak', 'Klimat nowojorskiego klubu jazzowego w sercu Poznania. Polecam!',
      'The vibe of a New York jazz club right in the heart of Poznań. Highly recommended!'],
    ['Piotr Wiśniewski', 'Najlepsze koktajle w mieście i niezapomniany wieczór.',
      'The best cocktails in town and an unforgettable evening.'],
    ['Maria Lewandowska', 'Idealne miejsce na kolację z muzyką. Obsługa na najwyższym poziomie.',
      'The perfect spot for dinner with music. Service of the highest standard.'],
  ]
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
  function futureDate(daysAhead: number, hour = 19): string {
    const d = new Date()
    d.setDate(d.getDate() + daysAhead)
    d.setHours(hour, 0, 0, 0)
    return d.toISOString()
  }
  // `en` carries the English values for localized fields only: title,
  // description, leadTitle, descriptionHeading, body, performers[].instrument.
  // The where-clause still matches on the canonical (PL) title.
  async function event(d: Record<string, unknown>, en?: Record<string, unknown>) {
    return upsert('events', { title: { equals: d.title } }, d, en)
  }
  await event({
    title: "Chicago — Szalone Lata '20", leadTitle: 'Muzyka na żywo', eventType: 'standard',
    date: futureDate(3), endTime: '23:00', price: 40, featured: true,
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
    performers: [
      { musician: musicianIds['Jacek Szwaj'], instrument: 'piano' },
      { musician: musicianIds['Wojciech Braszak'], instrument: 'clarinet' },
      { musician: musicianIds['Mikołaj Wienke'], instrument: 'saxophone' },
    ],
  })
  await event({
    title: 'Just The Two Of Us — duet, który rozpala', leadTitle: 'Muzyka na żywo', eventType: 'standard',
    date: futureDate(7), endTime: '23:00', price: 40, featured: true,
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
    date: futureDate(14), endTime: '22:00', price: 140, featured: true,
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
    performers: [
      { musician: musicianIds['Jacek Szwaj'], instrument: 'piano' },
      { musician: musicianIds['Jakub Królikowski'], instrument: 'piano' },
    ],
  })
  // Two more special poster events (from PDF: Miles Davis tribute, Andrzej Zaucha tribute)
  await event({
    title: 'Książę Jazzu — Tribute to Miles Davis', leadTitle: 'Wieczór specjalny', eventType: 'special',
    date: futureDate(21), endTime: '23:00', price: 120, featured: true,
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
    performers: [
      { musician: musicianIds['Jacek Szwaj'], instrument: 'piano' },
      { musician: musicianIds['Wojciech Braszak'], instrument: 'trumpet' },
      { musician: musicianIds['Mikołaj Wienke'], instrument: 'saxophone' },
    ],
  })
  await event({
    title: 'Tribute to Andrzej Zaucha — Byłaś Serca Biciem', leadTitle: 'Wieczór specjalny', eventType: 'special',
    date: futureDate(35), endTime: '23:00', price: 110, featured: true,
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
    performers: [
      { musician: musicianIds['Zuzanna Babiak'], instrument: 'vocals' },
      { musician: musicianIds['Jacek Szwaj'], instrument: 'piano' },
      { musician: musicianIds['Flavio Gullotta'], instrument: 'double bass' },
    ],
  })
  // Recurring standard events — populate the calendar grid across all weekdays
  const recurringEvents: Array<[string, string, number, number, string, string[], string]> = [
    ['Towarzyska Niedziela', 'Muzyka na żywo', 0, 25, 'Relaksująca niedziela z jazzem, brunchem i koktajlami.', ['Zuzanna Babiak', 'Jakub Kraszewski'], 'sun'],
    ['Jazzowe Wtorki', 'Muzyka na żywo', 7, 35, 'Wieczór z jazzem w wykonaniu poznańskich muzyków.', ['Adam Czech', 'Flavio Gullotta'], 'tue'],
    ['Blues & Soul Night', 'Muzyka na żywo', 9, 40, 'Bluesowy wieczór z duszą i energią.', ['Zuzanna Babiak', 'Wojciech Braszak'], 'thu'],
    ['Swing Night', 'Muzyka na żywo', 11, 35, 'Gorąca noc swingowa — tanecznie i rozrywkowo.', ['Jacek Szwaj', 'Mikołaj Wienke'], 'fri'],
    ['Klub x Muzy', 'Muzyka na żywo', 13, 30, 'Klimatyczny wieczór z muzyką kameralną i koktajlami.', ['Jakub Królikowski'], 'wed'],
    ['Road Songs Country', 'Muzyka na żywo', 15, 35, 'Muzyczne opowieści z drogi — country & americana.', ['Adam Czech'], 'sat'],
  ]
  for (const [title, leadTitle, daysAhead, price, description, perfNames, repeatDay] of recurringEvents) {
    await event({
      title, leadTitle, eventType: 'standard',
      date: futureDate(daysAhead, 19), endTime: '23:00', price, featured: false,
      description, body: rich([description]),
      isRecurring: true, repeatType: 'weekly',
      repeatDays: [repeatDay],
      reservationUrl: 'tel:+48500210333', shareEnabled: true,
      performers: perfNames
        .filter(n => musicianIds[n])
        .map(n => ({ musician: musicianIds[n], instrument: '' })),
    })
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
  for (const s of seriesDefs) {
    seriesIds.push(
      await upsert(
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
        },
        {
          name: s.en.name,
          eyebrow: s.en.eyebrow,
          description: s.en.description,
          gallery: s.en.gallery.map((g) => ({ caption: g.caption })),
        },
      ),
    )
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

  const venueCards = async () => [
    // CTAs match the PDF: section name (not "SPRAWDŹ MENU") + › arrow
    { image: await img.program(), colSpan: 'full', label: 'Codziennie muzyka na żywo w weekendy.', title: 'KONCERTY I WYDARZENIA', ctaLabel: 'PROGRAM ›', ctaUrl: '/program' },
    { image: await img.restauracja(), colSpan: 'half', label: 'Kuchnia inspirowana kulturą różnych stanów USA. Autorskie dania w nowoczesnej formie.', title: 'RESTAURACJA', ctaLabel: 'RESTAURACJA ›', ctaUrl: '/restauracja' },
    { image: await img.bar(), colSpan: 'half', label: 'Autorskie koktajle, selekcja alkoholi mocnych i win z całego świata.', title: 'COCKTAIL BAR', ctaLabel: 'COCKTAIL BAR ›', ctaUrl: '/bar' },
    { image: await img.cigar(), colSpan: 'full', label: 'Profesjonalna przestrzeń dla miłośników cygar. Starannie dobrana oferta cygar i alkoholi.', title: 'CIGAR ROOM', ctaLabel: 'CIGAR ROOM ›', ctaUrl: '/cigar-room' },
  ]
  const venueCardsEn = async () => [
    { image: await img.program(), colSpan: 'full', label: 'Live music every weekend.', title: 'CONCERTS & EVENTS', ctaLabel: 'PROGRAM ›', ctaUrl: '/program' },
    { image: await img.restauracja(), colSpan: 'half', label: 'A kitchen inspired by the culture of different US states. Signature dishes in a modern style.', title: 'RESTAURANT', ctaLabel: 'RESTAURANT ›', ctaUrl: '/restauracja' },
    { image: await img.bar(), colSpan: 'half', label: 'Signature cocktails and a selection of wines and spirits.', title: 'COCKTAIL BAR', ctaLabel: 'COCKTAIL BAR ›', ctaUrl: '/bar' },
    { image: await img.cigar(), colSpan: 'full', label: 'A professional space for cigar lovers. A carefully curated selection of cigars and spirits.', title: 'CIGAR ROOM', ctaLabel: 'CIGAR ROOM ›', ctaUrl: '/cigar-room' },
  ]
  // EN text for the testimonial items embedded in page blocks
  // (the [, , en] element of each `testis` tuple).
  const testiItemsEn = testis.map(([name, , textEn]) => ({ name, stars: 5, text: textEn }))

  // HOME
  await page('home', 'Strona główna', [
    { blockType: 'heroBanner', heading: 'Restauracja & Jazz Club', subtext: 'Kolacja i drinki w trakcie koncertu na żywo', backgroundImage: await img.home(),
      ctaLink: { type: 'custom', label: 'ZAREZERWUJ STOLIK', url: '/rezerwacje' }, ctaIcon: 'ticket',
      secondaryLinks: [
        { link: { type: 'custom', label: 'MENU', url: '/restauracja' }, icon: 'fork' },
        { link: { type: 'custom', label: 'PROGRAM', url: '/program' }, icon: 'music' },
      ] },
    { blockType: 'aboutIntro', eyebrow: 'American Dream Club®', heading: 'Nowy Jork w centrum Poznania',
      body: 'Przyjdź, poczuj atmosferę miejsca stworzonego dla muzyki, kolacji i rozmów. Tutaj w dobrym towarzystwie spędzisz cały wieczór: zjesz kolację, zapalisz cygaro i posłuchasz muzyki na żywo.',
      pullQuote: 'To jest świetne miejsce, będę tu wracać!' },
    { blockType: 'eventsTeaser', eyebrow: 'Nadchodzące wydarzenia', heading: 'PROGRAM', viewAllLabel: 'SPRAWDŹ PEŁEN PROGRAM', viewAllUrl: '/program', limit: 6 },
    { blockType: 'bentoSection', subheading: 'Zorganizuj z nami', heading: 'AMERICAN DREAM CLUB', items: await venueCards() },
    { blockType: 'offerCards', eyebrow: 'Zorganizuj z nami', heading: 'TWOJE WYDARZENIE', cards: [
      { tag: 'IMPREZY PRYWATNE', title: 'URODZINY I ROCZNICE W CENTRUM POZNANIA',
        body: 'Ty przychodzisz z Gośćmi, my zajmiemy się organizacją, oprawą i przebiegiem imprezy.',
        ctaLabel: 'DOWIEDZ SIĘ WIĘCEJ', ctaUrl: '/twoje-wydarzenie' },
      { tag: 'IMPREZY FIRMOWE', title: 'SPOTKANIA FIRMOWE W KLUBOWEJ ATMOSFERZE',
        body: 'Eleganckie przestrzenie z dobrym wyposażeniem technicznym i full gastro na życzenie.',
        ctaLabel: 'DOWIEDZ SIĘ WIĘCEJ', ctaUrl: '/twoje-wydarzenie' },
    ] },
    { blockType: 'testimonials', heading: 'CO MÓWIĄ NASI GOŚCIE', reviewSummary: '500+ opinii · 4,8/5 w Google',
      items: testis.map(([name, text]) => ({ name, stars: 5, text })) },
    { blockType: 'newsletterCTA', heading: 'NEWSLETTER', body: 'Zapisz się i bądź na bieżąco z programem.', placeholder: 'Adres email', buttonLabel: 'ZAPISZ SIĘ', consentText: 'Akceptuję politykę prywatności' },
  ], 'Home', [
    { blockType: 'heroBanner', heading: 'Restaurant & Jazz Club', subtext: 'Dinner and drinks during a live concert', backgroundImage: await img.home(),
      ctaLink: { type: 'custom', label: 'ZAREZERWUJ STOLIK', url: '/rezerwacje' }, ctaIcon: 'ticket',
      secondaryLinks: [
        { link: { type: 'custom', label: 'MENU', url: '/restauracja' }, icon: 'fork' },
        { link: { type: 'custom', label: 'PROGRAM', url: '/program' }, icon: 'music' },
      ] },
    { blockType: 'aboutIntro', eyebrow: 'American Dream Club®', heading: 'New York in the heart of Poznań',
      body: 'Come in and soak up the atmosphere of a place made for music, dinner and conversation. Here, in good company, you can spend a whole evening: have dinner, light a cigar and enjoy live music.',
      pullQuote: "This is a great place — I'll keep coming back!" },
    { blockType: 'eventsTeaser', eyebrow: 'Upcoming events', heading: 'PROGRAM', viewAllLabel: 'SEE THE FULL PROGRAM', viewAllUrl: '/program', limit: 6 },
    { blockType: 'bentoSection', subheading: 'Plan it with us', heading: 'AMERICAN DREAM CLUB', items: await venueCardsEn() },
    { blockType: 'offerCards', eyebrow: 'Plan it with us', heading: 'YOUR EVENT', cards: [
      { tag: 'PRIVATE EVENTS', title: 'BIRTHDAYS & ANNIVERSARIES IN THE HEART OF POZNAŃ',
        body: 'Bring your guests — we take care of the organisation, entertainment and running of the evening.',
        ctaLabel: 'FIND OUT MORE', ctaUrl: '/twoje-wydarzenie' },
      { tag: 'CORPORATE EVENTS', title: 'CORPORATE GATHERINGS IN A CLUB ATMOSPHERE',
        body: 'Elegant spaces with excellent technical equipment and full catering on request.',
        ctaLabel: 'FIND OUT MORE', ctaUrl: '/twoje-wydarzenie' },
    ] },
    { blockType: 'testimonials', heading: 'WHAT OUR GUESTS SAY', reviewSummary: '500+ reviews · 4.8/5 on Google',
      items: testiItemsEn },
    { blockType: 'newsletterCTA', heading: 'NEWSLETTER', body: 'Sign up and stay up to date with the program.', placeholder: 'Email address', buttonLabel: 'SIGN UP', consentText: 'I accept the privacy policy' },
  ])

  // RESTAURACJA
  await page('restauracja', 'Restauracja', [
    { blockType: 'pageHero', eyebrow: 'Nasza kuchnia', title: 'Restauracja', titleStyle: 'serif', backgroundImage: await img.restauracja(), inlineLinkLabel: 'NASZE MENU', inlineLinkUrl: '#menu' },
    { blockType: 'aboutIntro', heading: 'Dania inspirowane kulturą różnych stanów USA', body: 'Autorskie dania przygotowywane z dbałością o jakość w nowoczesnej formie. Menu zawiera zawsze ofertę wegetariańską.' },
    { blockType: 'menuSection', sectionTag: 'MENU', heading: 'Nasze dania', menuType: 'food', layout: 'cardGrid', groupByCategory: true },
    // BIG BEAT! — curated set-menu options matched to the evening programme (from PDF)
    { blockType: 'promoBand', heading: 'BIG BEAT!', body: 'Zestaw dla miłośników muzyki i jedzenia. Wybierz opcję dopasowaną do wieczoru.', items: [
      { label: '1. B.B. KING', sub: 'Tatar wołowy, żeberka BBQ, deser dnia + drink w zestawie', price: 149 },
      { label: '2. JAZZ CLUB SPECIAL', sub: 'Przystawka, danie główne + kieliszek wina do wyboru', price: 129 },
      { label: '3. AMERICAN DREAM', sub: 'Burger, frytki, coleslaw + koktajl autorski', price: 99 },
    ], ctaLabel: 'ZAREZERWUJ STOLIK', ctaUrl: '/rezerwacje', style: 'gold' },
    { blockType: 'setMenu', heading: 'Dinner Time', dateLabel: '02.07', menus: [
      { name: 'MENU A', price: 159, courses: [
        { courseLabel: 'PRZYSTAWKA', dish: 'Tatar wołowy', description: 'polędwica, żółtko, kapary, ogórek konserwowy' },
        { courseLabel: 'ZUPA', dish: 'Krem z pieczonej dyni', description: 'olej dyniowy, prażone pestki' },
        { courseLabel: 'DANIE GŁÓWNE', dish: 'Texas Rib Eye Steak', description: 'stek z antrykotu, masło ziołowe, pieczone ziemniaki' },
        { courseLabel: 'DESER', dish: 'Szarlotka na ciepło', description: 'lody waniliowe, sos karmelowy' },
      ] },
      { name: 'MENU B', price: 139, courses: [
        { courseLabel: 'PRZYSTAWKA', dish: 'Carpaccio z buraka', description: 'kozi ser, orzechy włoskie, rukola' },
        { courseLabel: 'ZUPA', dish: 'Bisque z krewetek', description: 'śmietana, koperek, grzanka' },
        { courseLabel: 'DANIE GŁÓWNE', dish: 'Pappardelle z ragù', description: 'wolno duszona wołowina, parmezan' },
        { courseLabel: 'DESER', dish: 'Tiramisu', description: 'klasyczne, z mascarpone i espresso' },
      ] },
    ] },
    { blockType: 'promoBand', heading: 'Specjalne Piątki', body: 'W każdy piątek wyjątkowa oferta degustacyjna w klubowej atmosferze. Zarezerwuj stolik i poczuj weekend.', items: [
      { label: 'Set ostryg', sub: '6 sztuk z cytryną', price: 79 },
      { label: 'Butelka prosecco', sub: 'do podzielenia we dwoje', price: 119 },
      { label: 'Deska serów', sub: 'selekcja z dodatkami', price: 69 },
    ], ctaLabel: 'ZAREZERWUJ', ctaUrl: '/rezerwacje', style: 'gold' },
    { blockType: 'bentoSection', heading: 'BAR & CIGAR', items: [
      { image: await img.bar(), colSpan: 'half', label: 'Autorskie koktajle i wina.', title: 'COCKTAIL BAR', ctaLabel: 'SPRAWDŹ MENU', ctaUrl: '/bar' },
      { image: await img.cigar(), colSpan: 'half', label: 'Selekcja cygar i alkoholi.', title: 'CIGAR ROOM', ctaLabel: 'SPRAWDŹ MENU', ctaUrl: '/cigar-room' },
    ] },
  ], 'Restaurant', [
    { blockType: 'pageHero', eyebrow: 'Our kitchen', title: 'Restaurant', titleStyle: 'serif', backgroundImage: await img.restauracja(), inlineLinkLabel: 'OUR MENU', inlineLinkUrl: '#menu' },
    { blockType: 'aboutIntro', heading: 'Dishes inspired by the culture of different US states', body: 'Signature dishes prepared with care for quality and a modern touch. The menu always includes a vegetarian option.' },
    { blockType: 'menuSection', sectionTag: 'MENU', heading: 'Our dishes', menuType: 'food', layout: 'cardGrid', groupByCategory: true },
    { blockType: 'promoBand', heading: 'BIG BEAT!', body: 'A set for music and food lovers. Choose the option matched to your evening.', items: [
      { label: '1. B.B. KING', sub: 'Beef tartare, BBQ ribs, dessert of the day + drink included', price: 149 },
      { label: '2. JAZZ CLUB SPECIAL', sub: 'Starter, main course + a glass of wine of your choice', price: 129 },
      { label: '3. AMERICAN DREAM', sub: 'Burger, fries, coleslaw + signature cocktail', price: 99 },
    ], ctaLabel: 'BOOK A TABLE', ctaUrl: '/rezerwacje', style: 'gold' },
    { blockType: 'setMenu', heading: 'Dinner Time', dateLabel: '02.07', menus: [
      { name: 'MENU A', price: 159, courses: [
        { courseLabel: 'STARTER', dish: 'Beef Tartare', description: 'tenderloin, egg yolk, capers, pickled cucumber' },
        { courseLabel: 'SOUP', dish: 'Roast Pumpkin Cream', description: 'pumpkin seed oil, toasted seeds' },
        { courseLabel: 'MAIN COURSE', dish: 'Texas Rib Eye Steak', description: 'rib eye steak, herb butter, roasted potatoes' },
        { courseLabel: 'DESSERT', dish: 'Warm Apple Pie', description: 'vanilla ice cream, caramel sauce' },
      ] },
      { name: 'MENU B', price: 139, courses: [
        { courseLabel: 'STARTER', dish: 'Beetroot Carpaccio', description: 'goat cheese, walnuts, rocket' },
        { courseLabel: 'SOUP', dish: 'Prawn Bisque', description: 'cream, dill, crouton' },
        { courseLabel: 'MAIN COURSE', dish: 'Pappardelle with Ragù', description: 'slow-braised beef, parmesan' },
        { courseLabel: 'DESSERT', dish: 'Tiramisu', description: 'classic, with mascarpone and espresso' },
      ] },
    ] },
    { blockType: 'promoBand', heading: 'Special Fridays', body: 'Every Friday a special tasting offer in a club atmosphere. Book a table and feel the weekend.', items: [
      { label: 'Oyster set', sub: '6 pieces with lemon', price: 79 },
      { label: 'Bottle of prosecco', sub: 'to share between two', price: 119 },
      { label: 'Cheese board', sub: 'a selection with sides', price: 69 },
    ], ctaLabel: 'BOOK NOW', ctaUrl: '/rezerwacje', style: 'gold' },
    { blockType: 'bentoSection', heading: 'BAR & CIGAR', items: [
      { image: await img.bar(), colSpan: 'half', label: 'Signature cocktails and wines.', title: 'COCKTAIL BAR', ctaLabel: 'SEE THE MENU', ctaUrl: '/bar' },
      { image: await img.cigar(), colSpan: 'half', label: 'A selection of cigars and spirits.', title: 'CIGAR ROOM', ctaLabel: 'SEE THE MENU', ctaUrl: '/cigar-room' },
    ] },
  ])

  // BAR
  await page('bar', 'Cocktail Bar', [
    { blockType: 'pageHero', eyebrow: 'Starannie dobrana selekcja win oraz autorskie koktajle', title: 'Cocktail Bar', titleStyle: 'serif', backgroundImage: await img.bar() },
    { blockType: 'aboutIntro', heading: 'Przestrzeń spotkań z wyjątkowym smakiem', subheading: 'Dopełnienie klubowego charakteru wieczoru', body: 'Oferujemy starannie dobraną selekcję win oraz autorskie koktajle przygotowywane przez doświadczonych barmanów.' },
    { blockType: 'menuSection', sectionTag: 'KOKTAJLE AUTORSKIE', heading: 'Koktajle', menuType: 'cocktails', layout: 'cardGrid', groupByCategory: false },
    { blockType: 'bentoSection', heading: 'WIĘCEJ', items: [
      { image: await img.restauracja(), colSpan: 'half', label: 'Kuchnia inspirowana kulturą USA.', title: 'RESTAURACJA', ctaLabel: 'SPRAWDŹ MENU', ctaUrl: '/restauracja' },
      { image: await img.cigar(), colSpan: 'half', label: 'Profesjonalna palarnia cygar.', title: 'CIGAR ROOM', ctaLabel: 'SPRAWDŹ MENU', ctaUrl: '/cigar-room' },
    ] },
  ], 'Cocktail Bar', [
    { blockType: 'pageHero', eyebrow: 'A carefully curated wine selection and signature cocktails', title: 'Cocktail Bar', titleStyle: 'serif', backgroundImage: await img.bar() },
    { blockType: 'aboutIntro', heading: 'A meeting space with exceptional flavour', subheading: 'The finishing touch to the club character of the evening', body: 'We offer a carefully curated selection of wines and signature cocktails prepared by experienced bartenders.' },
    { blockType: 'menuSection', sectionTag: 'SIGNATURE COCKTAILS', heading: 'Cocktails', menuType: 'cocktails', layout: 'cardGrid', groupByCategory: false },
    { blockType: 'bentoSection', heading: 'MORE', items: [
      { image: await img.restauracja(), colSpan: 'half', label: 'A kitchen inspired by US culture.', title: 'RESTAURANT', ctaLabel: 'SEE THE MENU', ctaUrl: '/restauracja' },
      { image: await img.cigar(), colSpan: 'half', label: 'A professional cigar lounge.', title: 'CIGAR ROOM', ctaLabel: 'SEE THE MENU', ctaUrl: '/cigar-room' },
    ] },
  ])

  // CIGAR ROOM
  await page('cigar-room', 'Cigar Room', [
    { blockType: 'pageHero', eyebrow: 'Uzupełnienie wieczoru w otoczeniu klubowej elegancji', title: 'Cigar Room', titleStyle: 'serif', backgroundImage: await img.cigar() },
    { blockType: 'aboutIntro', heading: 'Profesjonalna przestrzeń dla miłośników cygar', subheading: 'Starannie dobrana oferta cygar i alkoholi', body: 'Palarnia cygar w American Dream Club to przestrzeń stworzona z myślą o gościach, którzy cenią spokojną rozmowę i kulturę celebrowania cygara.' },
    { blockType: 'menuSection', sectionTag: 'CYGARA', heading: 'Cygara', menuType: 'cigars', layout: 'pricedList', groupByCategory: true },
    // imageGallery omitted — add after uploading real lounge photos via CMS
    { blockType: 'bentoSection', heading: 'WIĘCEJ', items: [
      { image: await img.restauracja(), colSpan: 'half', label: 'Kuchnia inspirowana kulturą USA.', title: 'RESTAURACJA', ctaLabel: 'SPRAWDŹ MENU', ctaUrl: '/restauracja' },
      { image: await img.bar(), colSpan: 'half', label: 'Autorskie koktajle i wina.', title: 'COCKTAIL BAR', ctaLabel: 'SPRAWDŹ MENU', ctaUrl: '/bar' },
    ] },
  ], 'Cigar Room', [
    { blockType: 'pageHero', eyebrow: 'A perfect close to the evening amid club elegance', title: 'Cigar Room', titleStyle: 'serif', backgroundImage: await img.cigar() },
    { blockType: 'aboutIntro', heading: 'A professional space for cigar lovers', subheading: 'A carefully curated selection of cigars and spirits', body: 'The cigar lounge at American Dream Club is a space created for guests who value calm conversation and the culture of savouring a fine cigar.' },
    { blockType: 'menuSection', sectionTag: 'CIGARS', heading: 'Cigars', menuType: 'cigars', layout: 'pricedList', groupByCategory: true },
    // imageGallery omitted — add after uploading real lounge photos via CMS
    { blockType: 'bentoSection', heading: 'MORE', items: [
      { image: await img.restauracja(), colSpan: 'half', label: 'A kitchen inspired by US culture.', title: 'RESTAURANT', ctaLabel: 'SEE THE MENU', ctaUrl: '/restauracja' },
      { image: await img.bar(), colSpan: 'half', label: 'Signature cocktails and wines.', title: 'COCKTAIL BAR', ctaLabel: 'SEE THE MENU', ctaUrl: '/bar' },
    ] },
  ])

  // PROGRAM
  await page('program', 'Program', [
    { blockType: 'pageHero', eyebrow: 'Sprawdź nadchodzące wydarzenia i zaplanuj swój wieczór', title: 'Program', titleStyle: 'serif', backgroundImage: await img.program() },
    { blockType: 'aboutIntro', heading: 'Muzyka, którą gramy', subheading: 'Największe standardy świata — inny klimat w każdy wieczór.', body: 'W klubie gramy największe amerykańskie i światowe standardy. Usłyszysz: jazz, swing, blues, soul i country.' },
    { blockType: 'eventsTeaser', eyebrow: 'Nadchodzące', heading: 'NAJBLIŻSZE WYDARZENIA', viewAllLabel: '', viewAllUrl: '', limit: 6 },
    { blockType: 'eventsCalendar', variant: 'full', heading: 'KALENDARZ', eventsSource: 'auto', autoCount: 6 },
    { blockType: 'specialEvents', eyebrow: 'Nie przegap', heading: 'WYDARZENIA SPECJALNE', limit: 4 },
    { blockType: 'musiciansGrid', eyebrow: 'Poznaj', heading: 'NASI MUZYCY' },
    { blockType: 'recurringSeriesTeaser', eyebrow: 'Powtarzające się', heading: 'WYDARZENIA CYKLICZNE', description: 'Stałe punkty w naszym kalendarzu — wieczory, które wracają regularnie.', series: seriesIds },
    // PDF: cross-sell bento with Towarzyska Niedziela + Klub x Muzy at bottom
    { blockType: 'bentoSection', heading: 'ZAPLANUJ SWÓJ WIECZÓR', items: [
      { colSpan: 'half', label: 'Niedzielna muzyka i relaks w klimacie swingu.', title: 'TOWARZYSKA NIEDZIELA', ctaLabel: 'TOWARZYSKA NIEDZIELA ›', ctaUrl: '/wydarzenia-cykliczne/towarzyska-niedziela' },
      { colSpan: 'half', label: 'Muzyka artystyczna i miejsce dla kreatywnych.', title: 'KLUB X MUZY', ctaLabel: 'KLUB X MUZY ›', ctaUrl: '/wydarzenia-cykliczne/klub-x-muzy' },
    ] },
  ], 'Program', [
    { blockType: 'pageHero', eyebrow: 'Check the upcoming events and plan your evening', title: 'Program', titleStyle: 'serif', backgroundImage: await img.program() },
    { blockType: 'aboutIntro', heading: 'The music we play', subheading: "The world's greatest standards — a different vibe every evening.", body: "At the club we play the greatest American and international standards. You'll hear jazz, swing, blues, soul and country." },
    { blockType: 'eventsTeaser', eyebrow: 'Upcoming', heading: 'NEXT EVENTS', viewAllLabel: '', viewAllUrl: '', limit: 6 },
    { blockType: 'eventsCalendar', variant: 'full', heading: 'CALENDAR', eventsSource: 'auto', autoCount: 6 },
    { blockType: 'specialEvents', eyebrow: "Don't miss", heading: 'SPECIAL EVENTS', limit: 4 },
    { blockType: 'musiciansGrid', eyebrow: 'Meet', heading: 'OUR MUSICIANS' },
    { blockType: 'recurringSeriesTeaser', eyebrow: 'Recurring', heading: 'RECURRING EVENTS', description: 'The regular fixtures in our calendar — evenings that come back again and again.', series: seriesIds },
    { blockType: 'bentoSection', heading: 'PLAN YOUR EVENING', items: [
      { colSpan: 'half', label: 'Sunday music and relaxation in the spirit of swing.', title: 'SOCIAL SUNDAY', ctaLabel: 'SOCIAL SUNDAY ›', ctaUrl: '/wydarzenia-cykliczne/towarzyska-niedziela' },
      { colSpan: 'half', label: 'Artistic music and a place for the creative.', title: 'KLUB X MUZY', ctaLabel: 'KLUB X MUZY ›', ctaUrl: '/wydarzenia-cykliczne/klub-x-muzy' },
    ] },
  ])

  // TWOJE WYDARZENIE
  await page('twoje-wydarzenie', 'Twoje wydarzenie', [
    { blockType: 'pageHero', eyebrow: 'Codziennie ktoś u nas świętuje', title: 'Twoje wydarzenie', titleStyle: 'serif', backgroundImage: await img.twoje() },
    { blockType: 'aboutIntro', heading: 'Urodziny. Rocznice. Imprezy firmowe.', subheading: 'Zaproś Gości — my zajmiemy się resztą!', body: 'Twoje wyjątkowe wydarzenie wymaga specjalnej oprawy. Zadbamy o menu, serwis, oprawę muzyczną, atrakcje wieczoru i dekoracje.' },
    { blockType: 'offerCards', eyebrow: 'Zorganizuj z nami', heading: 'OFERTA', cards: [
      { image: await img.twoje(), tag: 'IMPREZY PRYWATNE', title: 'URODZINY I ROCZNICE W CENTRUM POZNANIA', body: 'Ty przychodzisz z Gośćmi, my zajmiemy się organizacją.', ctaLabel: 'ZOBACZ PEŁNĄ OFERTĘ', ctaUrl: '/kontakt' },
      { image: await img.gallery(), tag: 'IMPREZY FIRMOWE', title: 'SPOTKANIA FIRMOWE W KLUBOWEJ ATMOSFERZE', body: 'Eleganckie przestrzenie z dobrym wyposażeniem technicznym.', ctaLabel: 'ZOBACZ PEŁNĄ OFERTĘ', ctaUrl: '/kontakt' },
    ] },
    { blockType: 'roomSelector', heading: 'DOSTĘPNE STREFY', rooms: roomIds, equipmentHeading: 'WYPOSAŻENIE', offerHeading: 'CO PRZYGOTUJEMY DLA CIEBIE', offerItems: [
      { item: 'Możliwość rezerwacji całego lokalu na wyłączność lub jego części' },
      { item: 'Usługa gastronomiczna w formie serwowanej lub bufetowej' },
      { item: 'Szeroka oferta win, drinków i koktajli — w tym Open Bar' },
      { item: 'Torty, ciasta, lody i inne niespodzianki na życzenie' },
      { item: 'Pełna gastronomia według autorskiego menu lub dań na życzenie' },
      { item: 'Ustawienie stołów i sali dopasowane do charakteru imprezy — ustalane z szefem kuchni' },
      { item: 'Atrakcje dodatkowe: koncert, DJ, inna oprawa muzyczna lub show' },
      { item: 'Czas trwania imprezy ustalany indywidualnie' },
      { item: 'Rezerwacja dla grup od 10 osób z wyprzedzeniem min. 1 miesiąc' },
    ] },
    { blockType: 'salesContact', heading: 'POROZMAWIAJMY O TWOIM WYDARZENIU', teamMember: managerId, callLabel: 'ZADZWOŃ', emailLabel: 'ZAPYTAJ MAILOWO', style: 'gold' },
    { blockType: 'testimonials', heading: 'CO MÓWIĄ NASI GOŚCIE', reviewSummary: '500+ opinii · 4,8/5 w Google', items: testis.map(([name, text]) => ({ name, stars: 5, text })) },
  ], 'Your event', [
    { blockType: 'pageHero', eyebrow: 'Every day someone is celebrating with us', title: 'Your event', titleStyle: 'serif', backgroundImage: await img.twoje() },
    { blockType: 'aboutIntro', heading: 'Birthdays. Anniversaries. Corporate events.', subheading: "Invite your guests — we'll take care of the rest!", body: "Your special occasion deserves a special setting. We'll handle the menu, service, music, evening attractions and decorations." },
    { blockType: 'offerCards', eyebrow: 'Plan it with us', heading: 'WHAT WE OFFER', cards: [
      { image: await img.twoje(), tag: 'PRIVATE PARTIES', title: 'BIRTHDAYS AND ANNIVERSARIES IN THE HEART OF POZNAŃ', body: "You arrive with your guests — we'll handle the organisation.", ctaLabel: 'SEE THE FULL OFFER', ctaUrl: '/kontakt' },
      { image: await img.gallery(), tag: 'CORPORATE EVENTS', title: 'COMPANY GATHERINGS IN A CLUB ATMOSPHERE', body: "Elegant spaces with great technical equipment.", ctaLabel: 'SEE THE FULL OFFER', ctaUrl: '/kontakt' },
    ] },
    { blockType: 'roomSelector', heading: 'AVAILABLE SPACES', rooms: roomIds, equipmentHeading: 'EQUIPMENT', offerHeading: "WHAT WE'LL PREPARE FOR YOU", offerItems: [
      { item: 'Option to book the entire venue exclusively or just part of it' },
      { item: 'Catering service, either plated or buffet style' },
      { item: 'A wide selection of wines, drinks and cocktails — including an Open Bar' },
      { item: 'Extra attractions: a concert or other live music' },
    ] },
    { blockType: 'salesContact', heading: "LET'S TALK ABOUT YOUR EVENT", teamMember: managerId, callLabel: 'CALL US', emailLabel: 'ASK BY EMAIL', style: 'gold' },
    { blockType: 'testimonials', heading: 'WHAT OUR GUESTS SAY', reviewSummary: '500+ reviews · 4.8/5 on Google', items: testiItemsEn },
  ])

  // REZERWACJE
  await page('rezerwacje', 'Rezerwacja', [
    { blockType: 'pageHero', eyebrow: 'Zaplanuj swój wieczór', title: 'Rezerwacja', titleStyle: 'serif', backgroundImage: await img.restauracja() },
    { blockType: 'aboutIntro', heading: 'Zaplanuj swój wieczór', body: 'Twoje wyjątkowe wydarzenie wymaga specjalnej oprawy. Zaproś Gości do American Dream Club, a my zajmiemy się pełną organizacją.' },
    { blockType: 'eveningPhases', heading: 'ZAPLANUJ SWÓJ WIECZÓR', phases: [
      { image: await img.restauracja(), title: 'OTWARCIE WIECZORU', timeLabel: 'od 17:00', body: 'Zapraszamy do rozpoczęcia wieczoru w spokojnej, klubowej atmosferze. Rezerwacja stolika jest bezpłatna.', primaryCtaLabel: 'ZAREZERWUJ STOLIK', primaryCtaUrl: 'tel:+48500210333' },
      { image: await img.program(), title: 'KONCERTY I WYDARZENIA MUZYCZNE', timeLabel: 'od 19:00', body: 'Wyjątkowy wieczór z muzyką na żywo — subtelne brzmienia fortepianu i saksofonu.', primaryCtaLabel: 'ZAREZERWUJ STOLIK', primaryCtaUrl: 'tel:+48500210333', secondaryCtaLabel: 'PROGRAM', secondaryCtaUrl: '/program' },
      { image: await img.bar(), title: 'WIECZÓR KLUBOWY', timeLabel: '21:00–23:00', body: 'Po części koncertowej zapraszamy do dalszego spędzenia czasu w naszej przestrzeni.', primaryCtaLabel: 'ZAREZERWUJ STOLIK', primaryCtaUrl: 'tel:+48500210333' },
    ] },
    { blockType: 'notice21Plus', heading: 'Szanowni Goście', body: 'Uprzejmie informujemy, że American Dream Club jest miejscem przeznaczonym wyłącznie dla osób dorosłych powyżej 21. roku życia.', ctaLabel: 'REGULAMIN KLUBU 21+', ctaUrl: '/kontakt' },
  ], 'Reservation', [
    { blockType: 'pageHero', eyebrow: 'Plan your evening', title: 'Reservation', titleStyle: 'serif', backgroundImage: await img.restauracja() },
    { blockType: 'aboutIntro', heading: 'Plan your evening', body: "Your special occasion deserves a special setting. Invite your guests to American Dream Club and we'll take care of the full organisation." },
    { blockType: 'eveningPhases', heading: 'PLAN YOUR EVENING', phases: [
      { image: await img.restauracja(), title: 'START OF THE EVENING', timeLabel: 'od 17:00', body: 'Start your evening in a calm, club atmosphere. Booking a table is free of charge.', primaryCtaLabel: 'BOOK A TABLE', primaryCtaUrl: 'tel:+48500210333' },
      { image: await img.program(), title: 'CONCERTS & MUSIC EVENTS', timeLabel: 'od 19:00', body: 'A special evening of live music — the subtle sounds of piano and saxophone.', primaryCtaLabel: 'BOOK A TABLE', primaryCtaUrl: 'tel:+48500210333', secondaryCtaLabel: 'PROGRAM', secondaryCtaUrl: '/program' },
      { image: await img.bar(), title: 'CLUB NIGHT', timeLabel: '21:00–23:00', body: 'After the concert, stay on and enjoy more time in our space.', primaryCtaLabel: 'BOOK A TABLE', primaryCtaUrl: 'tel:+48500210333' },
    ] },
    { blockType: 'notice21Plus', heading: 'Dear Guests', body: 'Please note that American Dream Club is a venue reserved exclusively for adults aged 21 and over.', ctaLabel: 'CLUB RULES 21+', ctaUrl: '/kontakt' },
  ])

  // KONTAKT
  await page('kontakt', 'Kontakt', [
    { blockType: 'pageHero', title: 'Kontakt', titleStyle: 'serif', backgroundImage: await img.bar() },
    { blockType: 'contactInfo', showForm: true, formHeading: 'SKONTAKTUJ SIĘ Z NAMI', showMap: true },
    { blockType: 'newsletterCTA', heading: 'NEWSLETTER', body: 'Zapisz się i bądź na bieżąco.', placeholder: 'Adres email', buttonLabel: 'ZAPISZ SIĘ', consentText: 'Akceptuję politykę prywatności' },
    { blockType: 'artistCTA', eyebrow: 'Jesteś muzykiem? Zapraszamy do współpracy!', heading: 'KONTAKT DLA ARTYSTÓW', backgroundImage: await img.special(), ctaLabel: 'DOWIEDZ SIĘ WIĘCEJ', ctaUrl: '/kontakt-dla-artystow' },
  ], 'Contact', [
    { blockType: 'pageHero', title: 'Contact', titleStyle: 'serif', backgroundImage: await img.bar() },
    { blockType: 'contactInfo', showForm: true, formHeading: 'GET IN TOUCH', showMap: true },
    { blockType: 'newsletterCTA', heading: 'NEWSLETTER', body: 'Sign up and stay up to date.', placeholder: 'Email address', buttonLabel: 'SIGN UP', consentText: 'I accept the privacy policy' },
    { blockType: 'artistCTA', eyebrow: "Are you a musician? We'd love to work with you!", heading: 'CONTACT FOR ARTISTS', backgroundImage: await img.special(), ctaLabel: 'LEARN MORE', ctaUrl: '/kontakt-dla-artystow' },
  ])

  // KONTAKT DLA ARTYSTÓW
  await page('kontakt-dla-artystow', 'Kontakt dla artystów', [
    { blockType: 'pageHero', eyebrow: 'Jesteś muzykiem? Zapraszamy do współpracy!', title: 'Kontakt dla artystów', titleStyle: 'serif', backgroundImage: await img.special() },
    { blockType: 'aboutIntro', heading: 'Zagraj w American Dream Club', body: 'W American Dream Club grają muzycy z pasją i warsztatem. Jeśli grasz jazz, soul, blues, swing lub pokrewne gatunki i chcesz wystąpić przed wymagającą publicznością — napisz do nas.' },
    { blockType: 'artistForm', eyebrow: 'Jesteś muzykiem? Zapraszamy do współpracy!', heading: 'FORMULARZ KONTAKTOWY', intro: 'Wypełnij formularz, a nasz zespół skontaktuje się z Tobą w sprawie współpracy.' },
  ], 'Contact for artists', [
    { blockType: 'pageHero', eyebrow: "Are you a musician? We'd love to work with you!", title: 'Contact for artists', titleStyle: 'serif', backgroundImage: await img.special() },
    { blockType: 'aboutIntro', heading: 'Play at American Dream Club', body: 'At American Dream Club we host musicians with passion and craft. If you play jazz, soul, blues, swing or related genres and want to perform for a discerning audience — get in touch with us.' },
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
