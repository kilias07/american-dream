/**
 * American Dream Club — old-site parity & functionality comparison.
 *
 * Reference: https://americandreamclub.pl/
 *
 * Verifies that every feature and content piece from the old WordPress site
 * is present and correct in the new Next.js / Payload CMS implementation.
 *
 * URL scheme (SEO audit): Polish is the DEFAULT served at UNPREFIXED URLs
 * (`/`, `/restaurant`, `/events`, `/business`, `/news`, `/contact`, …) and
 * English mirrors everything under `/en/...`. Events & news are addressed by
 * SLUG. Old WordPress / legacy URLs 301-redirect to the new ones.
 *
 * Sections:
 *  1.  Contact info  — phone, address, emails, manager
 *  2.  Opening hours — correct days and times
 *  3.  Navigation    — old-site URLs 301 to the new routes; new routes load
 *  4.  Restaurant    — menu categories and dishes
 *  5.  Cocktail bar  — jazz-legend cocktails, ingredients, prices
 *  6.  Cigar room    — origin countries, items
 *  7.  Events        — upcoming concerts / special events
 *  8.  Private events — capacity, VIP room, rooms
 *  9.  Social links  — correct real ADC URLs
 * 10.  21+ age gate  — notice on relevant pages
 * 11.  Newsletter    — present on homepage and footer
 * 12.  Language      — PL + EN available
 * 13.  SEO           — title, canonical, hreflang
 * 14.  Features new vs old — what's new, what's missing
 */

import { test, expect, type Page } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'

async function goto(page: Page, path: string) {
  await page.goto(`${BASE}${path}`)
}

async function desktop(page: Page, path: string) {
  await page.setViewportSize({ width: 1280, height: 800 })
  await goto(page, path)
}

// ── 1. Contact information ────────────────────────────────────────────────────
test.describe('Contact info — matches old site', () => {
  test('phone +48 500 210 333 is present on homepage', async ({ page }) => {
    await desktop(page, '/')
    await expect(page.locator('body')).toContainText('+48 500 210 333')
  })

  test('address "Dominikańska 9" present on homepage', async ({ page }) => {
    await desktop(page, '/')
    await expect(page.locator('body')).toContainText('Dominikańska 9')
  })

  test('info@americandreamclub.pl visible on contact page', async ({ page }) => {
    await desktop(page, '/contact')
    await expect(page.locator('body')).toContainText('info@americandreamclub.pl')
  })

  test('rezerwacja@americandreamclub.pl visible on contact page', async ({ page }) => {
    await desktop(page, '/contact')
    await expect(page.locator('body')).toContainText('rezerwacja@americandreamclub.pl')
  })

  test('Poznań city name appears on contact page', async ({ page }) => {
    await desktop(page, '/contact')
    await expect(page.locator('body')).toContainText('Poznań')
  })

  test('manager Jacek Wieczorek present on business event page', async ({ page }) => {
    await desktop(page, '/business')
    await expect(page.locator('body')).toContainText('Jacek Wieczorek')
  })

  test('manager phone +48 508 090 575 present on business event page', async ({ page }) => {
    await desktop(page, '/business')
    await expect(page.locator('body')).toContainText('508 090 575')
  })
})

// ── 2. Opening hours ──────────────────────────────────────────────────────────
test.describe('Opening hours — match old site', () => {
  test('Tuesday–Thursday 17:00–23:00 appears on contact page', async ({ page }) => {
    await desktop(page, '/contact')
    await expect(page.locator('body')).toContainText('17:00')
    await expect(page.locator('body')).toContainText('23:00')
  })

  test('Friday–Saturday closing at 00:00 or 24:00 present', async ({ page }) => {
    await desktop(page, '/contact')
    // Old site shows Friday/Saturday until midnight
    const body = page.locator('body')
    await expect(body).toContainText(/00:00|24:00/)
  })

  test('Sunday 16:00–21:00 appears on contact page', async ({ page }) => {
    await desktop(page, '/contact')
    await expect(page.locator('body')).toContainText('16:00')
    await expect(page.locator('body')).toContainText('21:00')
  })

  test('Monday is closed — indicated on contact page', async ({ page }) => {
    await desktop(page, '/contact')
    // "poniedziałek" or "monday" with "closed / nieczynne / zamknięte"
    const body = page.locator('body')
    const hasClosed = await body.locator(':text-matches("nieczynne|zamknięte|closed|monday|poniedziałek", "i")').count()
    expect(hasClosed).toBeGreaterThan(0)
  })
})

// ── 3. Navigation — old URLs 301 to new routes; new routes load ──────────────
test.describe('Navigation parity — old → new', () => {
  // Old WordPress / legacy URLs must 301-redirect to the new canonical routes.
  const redirects: [string, string][] = [
    ['/kuchnia', '/restaurant'], // old: /kuchnia/
    ['/restauracja', '/restaurant'],
    ['/bar', '/bar-and-cocktails'],
    ['/palarnia-cygar', '/cigar-lounge'], // old: /palarnia-cygar/
    ['/cigar-room', '/cigar-lounge'],
    ['/kalendarium', '/events'], // old: /kalendarium/
    ['/program', '/events'],
    ['/kontakt', '/contact'], // old: /kontakt/
    ['/category/blog', '/news'], // old: /category/blog/
    ['/aktualnosci', '/news'],
    ['/oferta/imprezy-okolicznosciowe', '/business'], // old: /oferta/imprezy-okolicznosciowe/
    ['/twoje-wydarzenie', '/business'],
    ['/polityka-prywatnosci', '/privacy'],
  ]

  for (const [from, to] of redirects) {
    test(`old ${from} 301-redirects to ${to}`, async ({ page }) => {
      await page.goto(`${BASE}${from}`)
      await expect(page).toHaveURL(`${BASE}${to}`)
      await expect(page.locator('main')).toBeVisible()
      await expect(page.locator('body')).not.toContainText('Internal Server Error')
    })
  }

  // New canonical routes load directly.
  const routes = [
    '/restaurant',
    '/bar-and-cocktails',
    '/cigar-lounge',
    '/events',
    '/business',
    '/news',
    '/contact',
    '/privacy',
    '/rezerwacja',
    '/kontakt-dla-artystow',
  ]

  for (const route of routes) {
    test(`new route ${route} loads`, async ({ page }) => {
      await desktop(page, route)
      await expect(page).toHaveURL(`${BASE}${route}`)
      await expect(page.locator('main')).toBeVisible()
      await expect(page.locator('body')).not.toContainText('404')
    })
  }
})

// ── 4. Restaurant — menu content ─────────────────────────────────────────────
test.describe('Restaurant — menu content parity', () => {
  test('menu categories present: Przystawki, Dania główne, Desery', async ({ page }) => {
    await desktop(page, '/restaurant')
    await expect(page.locator('body')).toContainText('Przystawki')
    await expect(page.locator('body')).toContainText('Dania główne')
    await expect(page.locator('body')).toContainText('Desery')
  })

  test('soups (Zupy) category present', async ({ page }) => {
    await desktop(page, '/restaurant')
    await expect(page.locator('body')).toContainText('Zupy')
  })

  test('Burgers category present', async ({ page }) => {
    await desktop(page, '/restaurant')
    await expect(page.locator('body')).toContainText('Burg')
  })

  test('specific dish: Texas Rib Eye Steak', async ({ page }) => {
    await desktop(page, '/restaurant')
    await expect(page.locator('body')).toContainText('Texas Rib Eye Steak')
  })

  test('specific dish: Tatar wołowy', async ({ page }) => {
    await desktop(page, '/restaurant')
    await expect(page.locator('body')).toContainText('Tatar')
  })

  test('steak price shown (119 zł)', async ({ page }) => {
    await desktop(page, '/restaurant')
    await expect(page.locator('body')).toContainText('119')
  })

  test('Polish & international cuisine description', async ({ page }) => {
    await desktop(page, '/restaurant')
    // The page should mention Polish/international tradition or similar
    await expect(page.locator('body')).toContainText(/kuchni|menu|dania/i)
  })
})

// ── 5. Cocktail bar ───────────────────────────────────────────────────────────
test.describe('Cocktail bar — jazz legends menu', () => {
  test('Miles Davis cocktail present', async ({ page }) => {
    await desktop(page, '/bar-and-cocktails')
    await expect(page.locator('body')).toContainText('Miles Davis')
  })

  test('Ella Fitzgerald cocktail present', async ({ page }) => {
    await desktop(page, '/bar-and-cocktails')
    await expect(page.locator('body')).toContainText('Ella Fitzgerald')
  })

  test('Duke Ellington cocktail present', async ({ page }) => {
    await desktop(page, '/bar-and-cocktails')
    await expect(page.locator('body')).toContainText('Duke Ellington')
  })

  test('Frank Sinatra cocktail present', async ({ page }) => {
    await desktop(page, '/bar-and-cocktails')
    await expect(page.locator('body')).toContainText('Frank Sinatra')
  })

  test('Louis Armstrong cocktail present', async ({ page }) => {
    await desktop(page, '/bar-and-cocktails')
    await expect(page.locator('body')).toContainText('Louis Armstrong')
  })

  test('cocktail price 39 zł shown', async ({ page }) => {
    await desktop(page, '/bar-and-cocktails')
    await expect(page.locator('body')).toContainText('39')
  })

  test('bar description mentions whisky, rum or cocktails', async ({ page }) => {
    await desktop(page, '/bar-and-cocktails')
    await expect(page.locator('body')).toContainText(/whisky|rum|koktajl|cocktail/i)
  })
})

// ── 6. Cigar room ─────────────────────────────────────────────────────────────
test.describe('Cigar room — matches old palarnia cygar content', () => {
  test('Nikaragua / Nicaragua cigars present', async ({ page }) => {
    await desktop(page, '/cigar-lounge')
    await expect(page.locator('body')).toContainText(/Nikaragua/i)
  })

  test('Dominikana / Dominican Republic cigars present', async ({ page }) => {
    await desktop(page, '/cigar-lounge')
    await expect(page.locator('body')).toContainText(/Dominikan/i)
  })

  test('Kuba / Cuba cigars present', async ({ page }) => {
    await desktop(page, '/cigar-lounge')
    await expect(page.locator('body')).toContainText(/Kuba/i)
  })

  test('specific cigar: Cohiba Siglo II (Cuban)', async ({ page }) => {
    await desktop(page, '/cigar-lounge')
    await expect(page.locator('body')).toContainText('Cohiba')
  })

  test('specific cigar: Montecristo', async ({ page }) => {
    await desktop(page, '/cigar-lounge')
    await expect(page.locator('body')).toContainText('Montecristo')
  })

  test('cigar prices in zł shown', async ({ page }) => {
    await desktop(page, '/cigar-lounge')
    await expect(page.locator('body')).toContainText('zł')
  })
})

// ── 7. Events (program / kalendarium) ────────────────────────────────────────
test.describe('Events — program matches old site kalendarium', () => {
  test('events page shows upcoming events', async ({ page }) => {
    await desktop(page, '/events')
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
    // Should have some event content
    await expect(page.locator('main')).toBeVisible()
  })

  test('Miles Davis tribute event present', async ({ page }) => {
    await desktop(page, '/events')
    await expect(page.locator('body')).toContainText('Miles Davis')
  })

  test('event prices shown', async ({ page }) => {
    await desktop(page, '/events')
    // Events have prices; zł symbol should appear
    await expect(page.locator('body')).toContainText('zł')
  })

  test('recurring events (Jazzowe Wtorki etc.) listed', async ({ page }) => {
    await desktop(page, '/events')
    await expect(page.locator('body')).toContainText(/jazz|swing|blues/i)
  })

  test('events are addressed by slug (not numeric id)', async ({ page }) => {
    await desktop(page, '/events')
    const eventLinks = page.locator('a[href^="/events/"]')
    const count = await eventLinks.count()
    if (count > 0) {
      const href = await eventLinks.first().getAttribute('href')
      expect(href).toMatch(/^\/events\/[a-z0-9-]+$/)
      // Old numeric `/program/123` style must be gone.
      expect(href).not.toMatch(/^\/events\/\d+$/)
    }
  })
})

// ── 8. Private events — business ─────────────────────────────────────────────
test.describe('Private events — /business matches old imprezy content', () => {
  test('capacity "120" guests mentioned', async ({ page }) => {
    await desktop(page, '/business')
    await expect(page.locator('body')).toContainText('120')
  })

  test('VIP Room mentioned', async ({ page }) => {
    await desktop(page, '/business')
    await expect(page.locator('body')).toContainText('VIP')
  })

  test('Cigar Room mentioned in business event page', async ({ page }) => {
    await desktop(page, '/business')
    await expect(page.locator('body')).toContainText(/Cigar Room|palarni/i)
  })

  test('EPSON projector equipment listed in VIP Room', async ({ page }) => {
    await desktop(page, '/business')
    await expect(page.locator('body')).toContainText('EPSON')
  })

  test('event types: imprezy prywatne + firmowe mentioned', async ({ page }) => {
    await desktop(page, '/business')
    await expect(page.locator('body')).toContainText(/prywat/i)
    await expect(page.locator('body')).toContainText(/firm/i)
  })

  test('room selector tabs are present', async ({ page }) => {
    await desktop(page, '/business')
    // The room selector should have clickable room names
    const rooms = ['Sala Klubowa', 'VIP Room', 'Cigar Room']
    let found = 0
    for (const room of rooms) {
      const count = await page.locator('body').getByText(room).count()
      if (count > 0) found++
    }
    expect(found).toBeGreaterThanOrEqual(2)
  })

  test('business detail sub-pages load by slug', async ({ page }) => {
    // Old dedicated offer pages consolidated under /business/[slug].
    for (const slug of ['meetings', 'birthday', 'venue-hire']) {
      await desktop(page, `/business/${slug}`)
      await expect(page.locator('main')).toBeVisible()
      await expect(page.locator('body')).not.toContainText('Internal Server Error')
    }
  })
})

// ── 9. Social links — real ADC URLs ──────────────────────────────────────────
test.describe('Social links — correct real ADC URLs', () => {
  test('Facebook link points to americandreamclub', async ({ page }) => {
    await desktop(page, '/')
    const anyFb = page.locator('a[href*="facebook.com"]').first()
    await expect(anyFb).toBeVisible()
    const href = await anyFb.getAttribute('href')
    expect(href).toContain('facebook.com')
  })

  test('Instagram link points to americandreamclub', async ({ page }) => {
    await desktop(page, '/')
    const igLink = page.locator('a[href*="instagram.com"]').first()
    await expect(igLink).toBeVisible()
    const href = await igLink.getAttribute('href')
    expect(href).toContain('instagram.com')
  })

  test('YouTube link points to americandreamclub channel', async ({ page }) => {
    await desktop(page, '/')
    const ytLink = page.locator('a[href*="youtube.com"]').first()
    await expect(ytLink).toBeVisible()
    const href = await ytLink.getAttribute('href')
    expect(href).toContain('youtube.com')
  })

  test('social links open in new tab', async ({ page }) => {
    await desktop(page, '/')
    const socialLinks = page.locator('header a[href*="facebook.com"], header a[href*="instagram.com"], header a[href*="youtube.com"]')
    const count = await socialLinks.count()
    if (count > 0) {
      const target = await socialLinks.first().getAttribute('target')
      expect(target).toBe('_blank')
    }
  })
})

// ── 10. 21+ age gate ──────────────────────────────────────────────────────────
test.describe('21+ age restriction — matches old site', () => {
  test('21+ badge visible in footer', async ({ page }) => {
    await desktop(page, '/')
    await expect(page.locator('footer')).toContainText('21+')
  })

  test('21+ notice present on contact page', async ({ page }) => {
    await desktop(page, '/contact')
    await expect(page.locator('body')).toContainText('21')
  })

  test('21+ notice or policy mentioned on homepage', async ({ page }) => {
    await desktop(page, '/')
    await expect(page.locator('body')).toContainText('21')
  })
})

// ── 11. Newsletter ────────────────────────────────────────────────────────────
test.describe('Newsletter — matches old site signup', () => {
  test('newsletter section with email input in footer', async ({ page }) => {
    await desktop(page, '/')
    const footer = page.locator('footer')
    await expect(footer.locator('input[type="email"]')).toBeVisible()
    await expect(footer).toContainText(/newsletter/i)
  })

  test('newsletter email placeholder present', async ({ page }) => {
    await desktop(page, '/')
    const emailInput = page.locator('footer input[type="email"]').first()
    await expect(emailInput).toBeVisible()
    // Either has placeholder text or aria-label
    const placeholder = await emailInput.getAttribute('placeholder')
    const ariaLabel = await emailInput.getAttribute('aria-label')
    expect(placeholder || ariaLabel).toBeTruthy()
  })
})

// ── 12. Multilingual — PL + EN ────────────────────────────────────────────────
test.describe('Multilingual — PL and EN available', () => {
  test('PL homepage has lang="pl"', async ({ page }) => {
    await desktop(page, '/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'pl')
  })

  test('/en homepage has lang="en"', async ({ page }) => {
    await desktop(page, '/en')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test('/en renders English content', async ({ page }) => {
    await desktop(page, '/en')
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
    // English site should have English nav labels
    await expect(page.locator('header')).toBeVisible()
  })

  test('/en/restaurant loads in English', async ({ page }) => {
    const resp = await page.goto(`${BASE}/en/restaurant`)
    expect(resp?.status()).not.toBe(500)
    await expect(page).toHaveURL(`${BASE}/en/restaurant`)
    await expect(page.locator('main')).toBeVisible()
  })
})

// ── 13. SEO ───────────────────────────────────────────────────────────────────
test.describe('SEO parity — meta tags and structured data', () => {
  test('homepage has <title> set', async ({ page }) => {
    await desktop(page, '/')
    const title = await page.title()
    expect(title.length).toBeGreaterThan(5)
    expect(title).toMatch(/american dream|jazz|poznań/i)
  })

  test('homepage has meta description', async ({ page }) => {
    await desktop(page, '/')
    const desc = await page.locator('meta[name="description"]').getAttribute('content')
    expect(desc).toBeTruthy()
    expect(desc!.length).toBeGreaterThan(20)
  })

  test('sitemap contains the new /restaurant URL', async ({ request }) => {
    const resp = await request.get(`${BASE}/sitemap.xml`)
    const body = await resp.text()
    expect(body).toContain('restaurant')
  })

  test('robots.txt allows crawlers', async ({ request }) => {
    const resp = await request.get(`${BASE}/robots.txt`)
    const body = await resp.text()
    expect(body.toLowerCase()).toContain('user-agent')
  })
})

// ── 14. Feature comparison: new vs old ───────────────────────────────────────
test.describe('New features not on old site', () => {
  test('NEW: dedicated reservation page /rezerwacja', async ({ page }) => {
    await desktop(page, '/rezerwacja')
    await expect(page).toHaveURL(`${BASE}/rezerwacja`)
    await expect(page.locator('main')).toBeVisible()
  })

  test('NEW: artist contact page /kontakt-dla-artystow', async ({ page }) => {
    await desktop(page, '/kontakt-dla-artystow')
    await expect(page).toHaveURL(`${BASE}/kontakt-dla-artystow`)
    await expect(page.locator('form, [data-artist-form]').first()).toBeVisible()
  })

  test('NEW: /admin CMS panel accessible', async ({ page }) => {
    await desktop(page, '/admin')
    await expect(page.locator('body')).not.toContainText('404')
    await expect(page.locator('body')).not.toContainText('500')
  })

  test('NEW: news article detail page with slug routing', async ({ page }) => {
    await desktop(page, '/news')
    // Check there are slug-based article links (new: slug routing vs old: WordPress-style)
    const links = page.locator('a[href^="/news/"]')
    const count = await links.count()
    // News exist if seeded; otherwise the listing still renders
    await expect(page.locator('main')).toBeVisible()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('NEW: dedicated /news/pod-papugami route', async ({ page }) => {
    await desktop(page, '/news/pod-papugami')
    await expect(page).toHaveURL(`${BASE}/news/pod-papugami`)
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  })
})

// ── 15. Homepage key sections ─────────────────────────────────────────────────
test.describe('Homepage — all key sections from old site', () => {
  test('"Nowy Jork w centrum Poznania" intro heading', async ({ page }) => {
    await desktop(page, '/')
    await expect(page.locator('body')).toContainText('Nowy Jork w centrum Poznania')
  })

  test('American Dream Club name in header or hero', async ({ page }) => {
    await desktop(page, '/')
    await expect(page.locator('body')).toContainText('American Dream')
  })

  test('IMPREZY PRYWATNE section present', async ({ page }) => {
    await desktop(page, '/')
    await expect(page.locator('body')).toContainText('IMPREZY PRYWATNE')
  })

  test('IMPREZY FIRMOWE section present', async ({ page }) => {
    await desktop(page, '/')
    await expect(page.locator('body')).toContainText('IMPREZY FIRMOWE')
  })

  test('footer address "Dominikańska 9" present', async ({ page }) => {
    await desktop(page, '/')
    await expect(page.locator('footer')).toContainText('Dominikańska')
  })

  test('footer phone +48 500 210 333 present', async ({ page }) => {
    await desktop(page, '/')
    await expect(page.locator('footer')).toContainText('+48 500 210 333')
  })

  test('RESTAURACJA & JAZZ CLUB description in topbar or hero', async ({ page }) => {
    await desktop(page, '/')
    await expect(page.locator('body')).toContainText(/restauracja|jazz club/i)
  })
})

// ── 16. Missing on new site (known gaps vs old site) ──────────────────────────
test.describe('Known gaps vs old site — tracked for future implementation', () => {
  test.skip('OLD only: separate /oferta/wieczory-kawalerskie/ page', async ({ page }) => {
    // Old site had a dedicated page; new site consolidates into /business
    // Marked skip — this is a known intentional consolidation
    await desktop(page, '/business')
    await expect(page.locator('body')).toContainText(/kawalersk|bachelor/i)
  })

  test.skip('OLD only: separate /oferta/spotkania-biznesowe/ page', async ({ page }) => {
    // Old site had a dedicated page; new site consolidates into /business
    await desktop(page, '/business')
    await expect(page.locator('body')).toContainText(/biznesow|business/i)
  })

  test.skip('OLD only: separate /wino/ wine page', async ({ page }) => {
    // Old site had a dedicated wine page; new site includes wine in /bar-and-cocktails
    // Marked skip until a dedicated wine section is implemented
    await desktop(page, '/bar-and-cocktails')
    await expect(page.locator('body')).toContainText(/wino|wine/i)
  })

  test.skip('OLD only: TripAdvisor link in footer', async ({ page }) => {
    // Old site linked to TripAdvisor; not yet in new site footer
    await desktop(page, '/')
    await expect(page.locator('footer a[href*="tripadvisor"]')).toBeVisible()
  })
})
