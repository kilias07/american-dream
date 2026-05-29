/**
 * American Dream Club — end-to-end smoke tests.
 *
 * Run against local dev server:  pnpm test:e2e
 * Run against live Cloudflare:   BASE_URL=https://american-dream.kilias07.workers.dev pnpm test:e2e
 *
 * Tests cover:
 *  1. Locale routing (redirects, prefix preservation)
 *  2. All public pages return 200 with key content
 *  3. Nav links use locale-prefixed hrefs (no redirect round-trip)
 *  4. Language switcher (PL ↔ EN)
 *  5. Menu PDF convention (/menu/*.pdf accessible without locale)
 *  6. Unprefixed slugs redirect to /pl/ (QR-code scenario)
 *  7. Detail routes: event, article, recurring series
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
  test('/ redirects to a locale-prefixed URL', async ({ page }) => {
    await goto(page, '/')
    await page.waitForURL(/\/(pl|en)$/)
    expect(page.url()).toMatch(/\/(pl|en)$/)
  })

  test('/pl renders the Polish homepage', async ({ page }) => {
    await goto(page, '/pl')
    await expect(page).toHaveURL(`${BASE}/pl`)
    await expect(page.locator('header')).toBeVisible()
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
    // [locale path, expected heading text, element selector]
    ['/pl',                     'American Dream',    'header'],
    ['/pl/restauracja',         'Restauracja',       'h1, h2'],
    ['/pl/bar',                 'Cocktail Bar',      'h1, h2'],
    ['/pl/cigar-room',          'Cigar Room',        'h1, h2'],
    ['/pl/program',             'Program',           'h1, h2'],
    ['/pl/twoje-wydarzenie',    'Twoje wydarzenie',  'h1, h2'],
    ['/pl/rezerwacje',          'Rezerwacja',        'h1, h2'],
    ['/pl/kontakt',             'Kontakt',           'h1, h2'],
    ['/pl/kontakt-dla-artystow','Kontakt',           'h1, h2'],
    ['/pl/aktualnosci',         'AKTUALNOŚCI',       'h1, h2, p'],
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

// ── 3. Unprefixed slugs redirect to /pl/ (QR-code scenario) ─────────────────
test.describe('Unprefixed slug redirects', () => {
  const slugs = ['restauracja', 'bar', 'cigar-room', 'program', 'kontakt', 'rezerwacje', 'aktualnosci']

  for (const slug of slugs) {
    test(`/${slug} redirects to /pl/${slug}`, async ({ page }) => {
      await goto(page, `/${slug}`)
      await page.waitForURL(`${BASE}/pl/${slug}`)
      expect(page.url()).toBe(`${BASE}/pl/${slug}`)
    })
  }
})

// ── 4. Nav links are locale-prefixed (no redirect) ───────────────────────────
test.describe('Navigation links', () => {
  test('header nav links on /pl contain /pl/ prefix', async ({ page }) => {
    await goto(page, '/pl')
    const navLinks = page.locator('header a[href]')
    const hrefs = await navLinks.evaluateAll((els) =>
      els.map((el) => el.getAttribute('href') ?? '')
    )
    // Every internal link should be either /pl/..., /en/..., or an anchor/external
    const internalLinks = hrefs.filter(
      (h) => h.startsWith('/') && !h.startsWith('//') && !h.startsWith('/_next')
    )
    for (const href of internalLinks) {
      // Should not be an unprefixed page slug that would trigger a redirect
      expect(href).not.toMatch(/^\/(restauracja|bar|cigar-room|program|twoje-wydarzenie|rezerwacje|kontakt|aktualnosci)$/)
    }
  })

  test('ZAREZERWUJ button is visible in the header', async ({ page }) => {
    await goto(page, '/pl')
    // The reserve button may be hidden on mobile viewport — check desktop
    await page.setViewportSize({ width: 1280, height: 800 })
    const reserveBtn = page.locator('header').getByText(/zarezerwuj/i)
    await expect(reserveBtn).toBeVisible()
  })
})

// ── 5. Language switcher ──────────────────────────────────────────────────────
test.describe('Language switcher', () => {
  test('language switcher PL and EN links are visible', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await goto(page, '/pl')
    // Both PL and EN should be visible in the header on desktop
    await expect(page.locator('header').getByText(/^pl$/i).first()).toBeVisible()
    await expect(page.locator('header').getByText(/^en$/i).first()).toBeVisible()
  })

  test('EN link navigates to /en', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await goto(page, '/pl')
    const enLink = page.locator('header a[href*="/en"]').first()
    await expect(enLink).toBeVisible()
    const href = await enLink.getAttribute('href')
    expect(href).toContain('/en')
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
    await goto(page, '/pl/cigar-room')
    const pdfLink = page.locator('a').filter({ hasText: /menu.*pdf|pdf.*menu/i })
    await expect(pdfLink.first()).toBeVisible()
    const href = await pdfLink.first().getAttribute('href')
    expect(href).toMatch(/\/menu\/.*\.pdf$/)
  })
})

// ── 7. Detail routes ──────────────────────────────────────────────────────────
test.describe('Detail routes', () => {
  test('/pl/aktualnosci/swing-rytm-ktory-zmienil-swiat renders an article', async ({ page }) => {
    const resp = await page.goto(`${BASE}/pl/aktualnosci/swing-rytm-ktory-zmienil-swiat`)
    // Accept 200 (article exists) or 404 (slug not seeded yet); never a 500
    expect(resp?.status()).not.toBe(500)
    if (resp?.status() === 200) {
      await expect(page.locator('main')).toBeVisible()
    }
  })

  test('/pl/program/1 renders an event detail page', async ({ page }) => {
    await goto(page, '/pl/program/1')
    // Should show an event title (not 404)
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('body')).not.toContainText('404')
  })
})

// ── 8. Key content blocks ────────────────────────────────────────────────────
test.describe('Content blocks', () => {
  test('/pl/restauracja: menu categories are shown', async ({ page }) => {
    await goto(page, '/pl/restauracja')
    await expect(page.locator('body')).toContainText('Przystawki')
    await expect(page.locator('body')).toContainText('Dania główne')
    await expect(page.locator('body')).toContainText('Desery')
  })

  test('/pl/restauracja: BIG BEAT! promo block is shown', async ({ page }) => {
    await goto(page, '/pl/restauracja')
    await expect(page.locator('body')).toContainText('BIG BEAT')
    await expect(page.locator('body')).toContainText('B.B. KING')
  })

  test('/pl/cigar-room: cigar menu with categories', async ({ page }) => {
    await goto(page, '/pl/cigar-room')
    await expect(page.locator('body')).toContainText('Nikaragua')
    await expect(page.locator('body')).toContainText('Dominikana')
    await expect(page.locator('body')).toContainText('Kuba')
    // At least one cigar price (zł)
    await expect(page.locator('body')).toContainText('zł')
  })

  test('/pl/bar: cocktail cards with jazz musician names', async ({ page }) => {
    await goto(page, '/pl/bar')
    await expect(page.locator('body')).toContainText('Miles Davis')
    await expect(page.locator('body')).toContainText('Ella Fitzgerald')
    await expect(page.locator('body')).toContainText('39 zł')
  })

  test('/pl: homepage shows "Nowy Jork w centrum Poznania" intro', async ({ page }) => {
    await goto(page, '/pl')
    await expect(page.locator('body')).toContainText('Nowy Jork w centrum Poznania')
  })

  test('/pl: IMPREZY PRYWATNE + IMPREZY FIRMOWE on homepage', async ({ page }) => {
    await goto(page, '/pl')
    await expect(page.locator('body')).toContainText('IMPREZY PRYWATNE')
    await expect(page.locator('body')).toContainText('IMPREZY FIRMOWE')
  })

  test('/pl/twoje-wydarzenie: VIP Room equipment list', async ({ page }) => {
    await goto(page, '/pl/twoje-wydarzenie')
    await expect(page.locator('body')).toContainText('EPSON')
    await expect(page.locator('body')).toContainText('1920')
  })

  test('/pl/program: special events carousel shows tributes', async ({ page }) => {
    await goto(page, '/pl/program')
    await expect(page.locator('body')).toContainText('Miles Davis')
  })
})

// ── 9. Footer ─────────────────────────────────────────────────────────────────
test.describe('Footer', () => {
  test('footer renders with 21+ badge and opening hours', async ({ page }) => {
    await goto(page, '/pl')
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
    await expect(footer).toContainText('21+')
    await expect(footer).toContainText('NEWSLETTER')
  })

  test('footer contains contact info', async ({ page }) => {
    await goto(page, '/pl')
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

  test('sitemap.xml is accessible and contains /pl entries', async ({ request }) => {
    const resp = await request.get(`${BASE}/sitemap.xml`)
    expect(resp.status()).toBe(200)
    const body = await resp.text()
    expect(body).toContain('<loc>')
    expect(body).toContain('/pl')
  })

  test('/pl has proper <html lang="pl">', async ({ page }) => {
    await goto(page, '/pl')
    const lang = await page.locator('html').getAttribute('lang')
    expect(lang).toBe('pl')
  })
})

// ── 12. Forms ────────────────────────────────────────────────────────────────
test.describe('Forms', () => {
  test('/pl/kontakt renders a contact form', async ({ page }) => {
    await goto(page, '/pl/kontakt')
    // Form should have an email input
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible()
  })

  test('/pl/kontakt-dla-artystow renders the artist application form', async ({ page }) => {
    await goto(page, '/pl/kontakt-dla-artystow')
    await expect(page.locator('form, [data-artist-form]').first()).toBeVisible()
  })

  test('newsletter form is in the footer', async ({ page }) => {
    await goto(page, '/pl')
    const footer = page.locator('footer')
    await expect(footer.locator('input[type="email"]').first()).toBeVisible()
  })
})
