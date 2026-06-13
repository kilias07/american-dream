/**
 * American Dream Club — end-to-end smoke tests.
 *
 * Run against local dev server:  pnpm test:e2e
 * Run against live Cloudflare:   BASE_URL=https://american-dream.kilias07.workers.dev pnpm test:e2e
 *
 * URL scheme (SEO audit):
 *   - Polish is the DEFAULT, served at UNPREFIXED URLs: `/`, `/restaurant`,
 *     `/bar-and-cocktails`, `/cigar-lounge`, `/events`, `/events/[slug]`,
 *     `/business`, `/news`, `/news/[slug]`, `/contact`, `/privacy`,
 *     `/rezerwacja`, `/kontakt-dla-artystow`.
 *   - English mirrors everything under `/en/...`.
 *   - Old `/pl/...` URLs and old Polish slugs 301-redirect to the new scheme.
 *   - There is NO 404 page — unknown paths redirect "up a level".
 *
 * Tests cover:
 *  1. Locale routing (unprefixed PL default, /en prefix)
 *  2. All public pages return 200 with key content
 *  3. Nav links use the new unprefixed (or /en) hrefs (no legacy /pl)
 *  4. Language switcher (PL ↔ EN)
 *  5. Menu PDF convention (/menu/*.pdf accessible without locale)
 *  6. Old slugs redirect to the new scheme (QR-code / legacy-link scenario)
 *  7. Detail routes: event (by slug), article
 *  8. Blocks: menu items present, BIG BEAT, offerCards visible
 *  9. Admin login page is accessible
 * 10. robots.txt + sitemap.xml
 */

import { test, expect, type Page } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'

// ── helpers ──────────────────────────────────────────────────────────────────
async function goto(page: Page, path: string) {
  await page.goto(`${BASE}${path}`)
}

// ── 1. Locale routing ────────────────────────────────────────────────────────
test.describe('Locale routing', () => {
  test('/ renders the Polish homepage at the unprefixed root', async ({ page }) => {
    await goto(page, '/')
    await expect(page).toHaveURL(`${BASE}/`)
    await expect(page.locator('header')).toBeVisible()
  })

  test('/ has <html lang="pl">', async ({ page }) => {
    await goto(page, '/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'pl')
  })

  test('/en renders the English homepage', async ({ page }) => {
    await goto(page, '/en')
    await expect(page).toHaveURL(`${BASE}/en`)
    await expect(page.locator('header')).toBeVisible()
  })
})

// ── 2. All main pages return 200 with identifiable content ───────────────────
test.describe('Main pages', () => {
  const pages: Array<[string, string, string]> = [
    // [path, expected keyword, element selector]
    ['/',                      'American Dream',    'header'],
    ['/restaurant',            'Restauracja',       'h1, h2'],
    ['/bar-and-cocktails',     'Cocktail Bar',      'h1, h2'],
    ['/cigar-lounge',          'Cigar Room',        'h1, h2'],
    ['/events',                'Program',           'h1, h2'],
    ['/business',              'Twoje wydarzenie',  'h1, h2'],
    ['/rezerwacja',            'Rezerwacj',         'h1, h2'],
    ['/contact',               'Kontakt',           'h1, h2'],
    ['/kontakt-dla-artystow',  'Kontakt',           'h1, h2'],
    ['/news',                  'AKTUALNOŚCI',       'h1, h2, p'],
  ]

  for (const [path, keyword, selector] of pages) {
    test(`${path} renders with "${keyword}"`, async ({ page }) => {
      await goto(page, path)
      await expect(page).toHaveURL(`${BASE}${path}`)
      // Page should contain the expected keyword somewhere
      await expect(page.locator(selector).first()).toBeVisible()
      await expect(page.locator('body')).toContainText(keyword, { ignoreCase: true })
    })
  }
})

// ── 3. Old slugs redirect to the new scheme (QR-code / legacy-link scenario) ──
test.describe('Old slug redirects → new scheme', () => {
  const redirects: Array<[string, string]> = [
    ['/restauracja', '/restaurant'],
    ['/bar', '/bar-and-cocktails'],
    ['/cigar-room', '/cigar-lounge'],
    ['/program', '/events'],
    ['/kontakt', '/contact'],
    ['/aktualnosci', '/news'],
    // legacy `/pl/...` prefix is stripped (and may chain to a renamed slug)
    ['/pl', '/'],
    ['/pl/restauracja', '/restaurant'],
    ['/pl/kontakt', '/contact'],
  ]

  for (const [from, to] of redirects) {
    test(`${from} redirects to ${to}`, async ({ page }) => {
      await goto(page, from)
      await page.waitForURL(`${BASE}${to}`)
      expect(page.url()).toBe(`${BASE}${to}`)
    })
  }
})

// ── 4. Nav links are on the new scheme (no legacy /pl prefix) ─────────────────
test.describe('Navigation links', () => {
  test('header nav links never use the legacy /pl prefix', async ({ page }) => {
    await goto(page, '/')
    const navLinks = page.locator('header a[href]')
    const hrefs = await navLinks.evaluateAll((els) =>
      els.map((el) => el.getAttribute('href') ?? '')
    )
    // Every internal link should be either unprefixed PL, /en/..., or an anchor/external
    const internalLinks = hrefs.filter(
      (h) => h.startsWith('/') && !h.startsWith('//') && !h.startsWith('/_next')
    )
    for (const href of internalLinks) {
      // The legacy `/pl/...` prefix must be gone.
      expect(href).not.toMatch(/^\/pl(\/|$)/)
    }
  })

  test('ZAREZERWUJ button is visible in the header', async ({ page }) => {
    // The reserve button may be hidden on mobile viewport — check desktop
    await page.setViewportSize({ width: 1280, height: 800 })
    await goto(page, '/')
    const reserveBtn = page.locator('header').getByText(/zarezerwuj/i)
    await expect(reserveBtn).toBeVisible()
  })
})

// ── 5. Language switcher ──────────────────────────────────────────────────────
test.describe('Language switcher', () => {
  test('language switcher PL and EN are visible', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await goto(page, '/')
    // Both PL and EN should be visible in the header on desktop
    await expect(page.locator('header').getByText(/^pl$/i).first()).toBeVisible()
    await expect(page.locator('header').getByText(/^en$/i).first()).toBeVisible()
  })

  test('EN switch navigates to /en', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await goto(page, '/')
    // The language switcher is a <button> pair (PL | EN).
    const enBtn = page
      .locator('header button:visible')
      .filter({ hasText: /^EN$/ })
      .first()
    await expect(enBtn).toBeVisible()
    await enBtn.click()
    await expect(page).toHaveURL(`${BASE}/en`)
  })
})

// ── 6. Menu PDFs (QR code scenario — no locale prefix required) ──────────────
test.describe('Menu PDFs', () => {
  test('/menu/menu-pl.pdf is accessible (HTTP 200)', async ({ request }) => {
    const resp = await request.get(`${BASE}/menu/menu-pl.pdf`)
    expect(resp.status()).toBe(200)
    expect(resp.headers()['content-type']).toMatch(/pdf/)
  })

  test('/menu/menu-en.pdf is accessible (HTTP 200)', async ({ request }) => {
    const resp = await request.get(`${BASE}/menu/menu-en.pdf`)
    expect(resp.status()).toBe(200)
    expect(resp.headers()['content-type']).toMatch(/pdf/)
  })

  test('"Zobacz całe menu (PDF)" button links to /menu/*.pdf', async ({ page }) => {
    await goto(page, '/cigar-lounge')
    const pdfLink = page.locator('a').filter({ hasText: /menu.*pdf|pdf.*menu/i })
    await expect(pdfLink.first()).toBeVisible()
    const href = await pdfLink.first().getAttribute('href')
    expect(href).toMatch(/\/menu\/.*\.pdf$/)
  })
})

// ── 7. Detail routes ──────────────────────────────────────────────────────────
test.describe('Detail routes', () => {
  test('/news/:slug renders an article (or redirects up to /news if missing)', async ({ page }) => {
    const resp = await page.goto(`${BASE}/news/swing-rytm-ktory-zmienil-swiat`)
    // Never a 500. Either the article renders, or — for an unseeded slug — the
    // no-404 behaviour redirects "up a level" to /news.
    expect(resp?.status()).not.toBe(500)
    await expect(page).toHaveURL(/\/news(\/swing-rytm-ktory-zmienil-swiat)?$/)
    await expect(page.locator('main')).toBeVisible()
  })

  test('/events/:slug renders an event detail page', async ({ page }) => {
    // Events are addressed by SLUG now (not by numeric id). Visit the listing and
    // click the first event card so the test is robust to whatever is seeded.
    await goto(page, '/events')
    const eventLinks = page.locator('a[href^="/events/"]')
    const count = await eventLinks.count()
    if (count > 0) {
      const href = await eventLinks.first().getAttribute('href')
      expect(href).toMatch(/^\/events\/[a-z0-9-]+$/)
      await eventLinks.first().click()
      await expect(page).toHaveURL(/\/events\/[a-z0-9-]+$/)
      await expect(page.locator('main')).toBeVisible()
      await expect(page.locator('body')).not.toContainText('Internal Server Error')
    }
  })
})

// ── 8. Key content blocks ────────────────────────────────────────────────────
test.describe('Content blocks', () => {
  test('/restaurant: menu categories are shown', async ({ page }) => {
    await goto(page, '/restaurant')
    await expect(page.locator('body')).toContainText('Przystawki')
    await expect(page.locator('body')).toContainText('Dania główne')
    await expect(page.locator('body')).toContainText('Desery')
  })

  test('/restaurant: BIG BEAT! promo block is shown', async ({ page }) => {
    await goto(page, '/restaurant')
    await expect(page.locator('body')).toContainText('BIG BEAT')
    await expect(page.locator('body')).toContainText('B.B. KING')
  })

  test('/cigar-lounge: cigar menu with categories', async ({ page }) => {
    await goto(page, '/cigar-lounge')
    await expect(page.locator('body')).toContainText('Nikaragua')
    await expect(page.locator('body')).toContainText('Dominikana')
    await expect(page.locator('body')).toContainText('Kuba')
    // At least one cigar price (zł)
    await expect(page.locator('body')).toContainText('zł')
  })

  test('/bar-and-cocktails: cocktail cards with jazz musician names', async ({ page }) => {
    await goto(page, '/bar-and-cocktails')
    await expect(page.locator('body')).toContainText('Miles Davis')
    await expect(page.locator('body')).toContainText('Ella Fitzgerald')
    await expect(page.locator('body')).toContainText('39 zł')
  })

  test('/: homepage shows "Nowy Jork w centrum Poznania" intro', async ({ page }) => {
    await goto(page, '/')
    await expect(page.locator('body')).toContainText('Nowy Jork w centrum Poznania')
  })

  test('/: IMPREZY PRYWATNE + IMPREZY FIRMOWE on homepage', async ({ page }) => {
    await goto(page, '/')
    await expect(page.locator('body')).toContainText('IMPREZY PRYWATNE')
    await expect(page.locator('body')).toContainText('IMPREZY FIRMOWE')
  })

  test('/business: VIP Room equipment list', async ({ page }) => {
    await goto(page, '/business')
    await expect(page.locator('body')).toContainText('EPSON')
    await expect(page.locator('body')).toContainText('1920')
  })

  test('/events: special events carousel shows tributes', async ({ page }) => {
    await goto(page, '/events')
    await expect(page.locator('body')).toContainText('Miles Davis')
  })
})

// ── 9. Footer ─────────────────────────────────────────────────────────────────
test.describe('Footer', () => {
  test('footer renders with 21+ badge and newsletter', async ({ page }) => {
    await goto(page, '/')
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
    await expect(footer).toContainText('21+')
    await expect(footer).toContainText(/newsletter/i)
  })

  test('footer contains contact info', async ({ page }) => {
    await goto(page, '/')
    await expect(page.locator('footer')).toContainText('+48 500 210 333')
  })
})

// ── 10. Admin ─────────────────────────────────────────────────────────────────
test.describe('Admin', () => {
  test('/admin is accessible (no 404/500)', async ({ page }) => {
    await goto(page, '/admin')
    // Admin redirects to login — should see some admin UI, not a 404
    await expect(page.locator('body')).not.toContainText('404')
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  })
})

// ── 11. SEO ───────────────────────────────────────────────────────────────────
test.describe('SEO', () => {
  test('robots.txt is accessible and allows crawling', async ({ request }) => {
    const resp = await request.get(`${BASE}/robots.txt`)
    expect(resp.status()).toBe(200)
    const body = await resp.text()
    // Next.js generates either 'User-agent' or 'User-Agent' depending on version
    expect(body.toLowerCase()).toContain('user-agent')
    expect(body.toLowerCase()).toContain('sitemap')
  })

  test('sitemap.xml is accessible and contains new-scheme entries', async ({ request }) => {
    const resp = await request.get(`${BASE}/sitemap.xml`)
    expect(resp.status()).toBe(200)
    const body = await resp.text()
    expect(body).toContain('<loc>')
    // New unprefixed scheme: the canonical restaurant URL should be present.
    expect(body).toContain('restaurant')
  })

  test('/ has proper <html lang="pl">', async ({ page }) => {
    await goto(page, '/')
    const lang = await page.locator('html').getAttribute('lang')
    expect(lang).toBe('pl')
  })
})

// ── 12. Forms ────────────────────────────────────────────────────────────────
test.describe('Forms', () => {
  test('/contact renders a contact form', async ({ page }) => {
    await goto(page, '/contact')
    // Form should have an email input
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible()
  })

  test('/kontakt-dla-artystow renders the artist application form', async ({ page }) => {
    await goto(page, '/kontakt-dla-artystow')
    await expect(page.locator('form, [data-artist-form]').first()).toBeVisible()
  })

  test('newsletter form is in the footer', async ({ page }) => {
    await goto(page, '/')
    const footer = page.locator('footer')
    await expect(footer.locator('input[type="email"]').first()).toBeVisible()
  })
})
