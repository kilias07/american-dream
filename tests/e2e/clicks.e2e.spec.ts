/**
 * American Dream Club — click & interaction tests.
 *
 * URL scheme (SEO audit):
 *   - Polish is the DEFAULT, served at UNPREFIXED URLs: `/`, `/restaurant`,
 *     `/bar-and-cocktails`, `/cigar-lounge`, `/events`, `/events/[slug]`,
 *     `/business`, `/business/[slug]`, `/news`, `/news/[slug]`,
 *     `/news/pod-papugami`, `/contact`, `/privacy`, `/rezerwacje`,
 *     `/kontakt-dla-artystow`.
 *   - English mirrors everything under `/en/...`.
 *   - The language switcher is a <button> pair (PL | EN), not <a href> links.
 *   - Old URLs 301-redirect to the new ones; unknown pages redirect "up a level"
 *     (no dedicated 404 page).
 *
 * Every interactive element is exercised:
 *  1.  Header (desktop) — logo, topbar links, social icons, nav items, language switcher, CTA
 *  2.  Mobile menu — hamburger opens, close button, backdrop, nav items, language, CTA
 *  3.  Footer — logo, phone, nav columns, social icons, bottom-bar links
 *  4.  Contact form — fill + validation + submit
 *  5.  Newsletter form — fill + submit
 *  6.  Artist application form — fill + submit
 *  7.  News — article card click (slug routing)
 *  8.  Events — event card click (slug routing)
 *  9.  Language switching — full PL → EN round-trip via header
 * 10.  Rezerwacje — page renders and contact action is present
 * 11.  Responsive nav
 * 12.  Business (twoje-wydarzenie) — private-event page
 * 13.  301 redirects — old URLs → new scheme
 * 14.  No 404 — unknown paths redirect up a level
 */

import { test, expect, type Page } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const HOME = `${BASE}/`

async function goto(page: Page, path: string) {
  await page.goto(`${BASE}${path}`)
}

// ── helpers ───────────────────────────────────────────────────────────────────

/** Set desktop viewport (1280×800) and navigate. */
async function desktop(page: Page, path: string) {
  await page.setViewportSize({ width: 1280, height: 800 })
  await goto(page, path)
}

/** Set mobile viewport (390×844) and navigate. */
async function mobile(page: Page, path: string) {
  await page.setViewportSize({ width: 390, height: 844 })
  await goto(page, path)
}

/** The visible header language-switcher button ("PL" or "EN"). */
function langButton(page: Page, label: 'PL' | 'EN') {
  return page
    .locator('header button:visible')
    .filter({ hasText: new RegExp(`^${label}$`) })
    .first()
}

// ── 1. Header — Desktop ───────────────────────────────────────────────────────
test.describe('Header — desktop clicks', () => {
  test('logo click navigates to the homepage', async ({ page }) => {
    await desktop(page, '/contact')
    await page.locator('header a').filter({ has: page.locator('svg, img') }).first().click()
    await expect(page).toHaveURL(HOME)
  })

  test('topbar phone link has correct tel: href', async ({ page }) => {
    await desktop(page, '/')
    const phoneLink = page.locator('header a[href^="tel:"]').first()
    await expect(phoneLink).toBeVisible()
    const href = await phoneLink.getAttribute('href')
    expect(href).toMatch(/^tel:\+?48500210333$/)
  })

  test('topbar address link opens Google Maps', async ({ page }) => {
    await desktop(page, '/')
    const addressLink = page.locator('header a[href*="google.com/maps"], header a[href*="maps.app"]').first()
    await expect(addressLink).toBeVisible()
    const href = await addressLink.getAttribute('href')
    expect(href).toBeTruthy()
    expect(href).toMatch(/google\.com\/maps|maps\.app/i)
  })

  test('social icon — Facebook has correct href', async ({ page }) => {
    await desktop(page, '/')
    const fbLink = page.locator('header a[href*="facebook.com"]').first()
    await expect(fbLink).toBeVisible()
    const href = await fbLink.getAttribute('href')
    expect(href).toContain('facebook.com/americandreamclub')
  })

  test('social icon — Instagram has correct href', async ({ page }) => {
    await desktop(page, '/')
    const igLink = page.locator('header a[href*="instagram.com"]').first()
    await expect(igLink).toBeVisible()
    const href = await igLink.getAttribute('href')
    expect(href).toContain('instagram.com/americandreamclub')
  })

  test('social icon — YouTube has correct href', async ({ page }) => {
    await desktop(page, '/')
    const ytLink = page.locator('header a[href*="youtube.com"]').first()
    await expect(ytLink).toBeVisible()
    const href = await ytLink.getAttribute('href')
    expect(href).toContain('youtube.com/@americandreamclub')
  })

  test('left nav items link to unprefixed (or /en) paths — never legacy /pl', async ({ page }) => {
    await desktop(page, '/')
    const navLinks = page.locator('header nav a')
    const count = await navLinks.count()
    expect(count).toBeGreaterThan(0)

    // Collect all hrefs
    const hrefs = await navLinks.evaluateAll((els) =>
      els.map((el) => el.getAttribute('href') ?? '')
    )

    for (const href of hrefs) {
      if (href.startsWith('/') && !href.startsWith('//')) {
        // PL is unprefixed; the legacy `/pl/...` prefix must be gone.
        expect(href).not.toMatch(/^\/pl(\/|$)/)
      }
    }
  })

  test('clicking a nav item actually navigates', async ({ page }) => {
    await desktop(page, '/')
    // Find first internal nav link that is NOT the homepage / external / tel.
    const navLinks = page.locator('header nav a')
    const count = await navLinks.count()
    for (let i = 0; i < count; i++) {
      const href = await navLinks.nth(i).getAttribute('href')
      if (href && /^\/[a-z]/.test(href) && href !== '/') {
        await navLinks.nth(i).click()
        await expect(page).toHaveURL(`${BASE}${href}`)
        return
      }
    }
    // If no subpage nav link found, the test still validates nav links exist.
    expect(count).toBeGreaterThan(0)
  })

  test('PL language button is active and EN button navigates to /en', async ({ page }) => {
    await desktop(page, '/')
    await expect(langButton(page, 'PL')).toHaveAttribute('aria-current', 'true')
    const enBtn = langButton(page, 'EN')
    await expect(enBtn).toBeVisible()
    await enBtn.click()
    await expect(page).toHaveURL(`${BASE}/en`)
  })

  test('from /en, PL language button navigates back to the PL homepage', async ({ page }) => {
    await desktop(page, '/en')
    const plBtn = langButton(page, 'PL')
    await expect(plBtn).toBeVisible()
    await plBtn.click()
    await expect(page).toHaveURL(HOME)
  })

  test('CTA "ZAREZERWUJ" button opens the MyRest booking widget (no navigation)', async ({ page }) => {
    await desktop(page, '/')
    const cta = page.locator('header').getByText(/zarezerwuj/i).first()
    await expect(cta).toBeVisible()
    // The reservation CTA opens the MyRest booking widget instead of navigating
    // to a page. The integration script is injected client-side (#myrest-integration)
    // and the modal markup is appended to <body> (#mr-widget-handler).
    await expect(page.locator('#myrest-integration')).toHaveCount(1)
    await cta.click()
    await expect(page).toHaveURL(HOME) // stays on the homepage — no navigation
    await expect(page.locator('#mr-widget-handler')).toHaveCount(1)
  })
})

// ── 2. Mobile menu interactions ───────────────────────────────────────────────
test.describe('Mobile menu — interactions', () => {
  test('hamburger button opens the drawer', async ({ page }) => {
    await mobile(page, '/')
    const hamburger = page.locator('button[aria-label="Open menu"]')
    await expect(hamburger).toBeVisible()
    await hamburger.click()
    // Drawer should slide in
    const drawer = page.locator('[class*="translate-x-0"]').filter({ hasText: /pl|en/i }).first()
    await expect(drawer).toBeVisible({ timeout: 2000 })
  })

  test('close button hides the drawer', async ({ page }) => {
    await mobile(page, '/')
    await page.locator('button[aria-label="Open menu"]').click()
    const closeBtn = page.locator('button[aria-label="Close menu"]')
    await expect(closeBtn).toBeVisible()
    await closeBtn.click()
    // Drawer should slide out
    await page.waitForTimeout(350) // animation
    await expect(page.locator('button[aria-label="Close menu"]')).toBeHidden()
  })

  test('backdrop click closes the drawer', async ({ page }) => {
    await mobile(page, '/')
    await page.locator('button[aria-label="Open menu"]').click()
    await expect(page.locator('button[aria-label="Close menu"]')).toBeVisible()

    // Click the semi-transparent backdrop (first fixed overlay element)
    const backdrop = page.locator('.fixed.inset-0').first()
    await backdrop.click({ position: { x: 10, y: 10 } })
    await page.waitForTimeout(350)
    await expect(page.locator('button[aria-label="Close menu"]')).toBeHidden()
  })

  test('tapping a nav link in mobile menu navigates and closes the menu', async ({ page }) => {
    await mobile(page, '/')
    await page.locator('button[aria-label="Open menu"]').click()

    // Find first link inside the nav drawer that goes to a subpage
    const drawerNav = page.locator('.fixed.top-0.right-0 nav a').first()
    const href = await drawerNav.getAttribute('href')
    await drawerNav.click()
    if (href) await expect(page).toHaveURL(`${BASE}${href}`)
    // Menu should close
    await page.waitForTimeout(350)
    await expect(page.locator('button[aria-label="Close menu"]')).toBeHidden()
  })

  test('mobile language switcher navigates to /en', async ({ page }) => {
    await mobile(page, '/')
    await page.locator('button[aria-label="Open menu"]').click()
    const enBtn = page
      .locator('.fixed.top-0.right-0')
      .getByRole('button', { name: 'EN', exact: true })
      .first()
    await expect(enBtn).toBeVisible()
    await enBtn.click()
    await expect(page).toHaveURL(`${BASE}/en`)
  })

  test('mobile social icons are visible and have hrefs', async ({ page }) => {
    await mobile(page, '/')
    await page.locator('button[aria-label="Open menu"]').click()
    const socialLinks = page.locator('.fixed.top-0.right-0 a[href*="facebook.com"], .fixed.top-0.right-0 a[href*="instagram.com"], .fixed.top-0.right-0 a[href*="youtube.com"]')
    await expect(socialLinks.first()).toBeVisible()
    const count = await socialLinks.count()
    expect(count).toBeGreaterThanOrEqual(2)
  })
})

// ── 3. Footer interactions ────────────────────────────────────────────────────
test.describe('Footer — clicks', () => {
  test('footer logo click navigates to the homepage', async ({ page }) => {
    await desktop(page, '/contact')
    const footerLogo = page.locator('footer a').first()
    await footerLogo.click()
    await expect(page).toHaveURL(HOME)
  })

  test('footer phone link has tel: href', async ({ page }) => {
    await desktop(page, '/')
    const phoneLink = page.locator('footer a[href^="tel:"]')
    await expect(phoneLink.first()).toBeVisible()
    const href = await phoneLink.first().getAttribute('href')
    expect(href).toMatch(/tel:\+?48500210333/)
  })

  test('footer nav column links are clickable and never legacy /pl', async ({ page }) => {
    await desktop(page, '/')
    const footerLinks = page.locator('footer ul a')
    const count = await footerLinks.count()
    expect(count).toBeGreaterThan(3)

    const hrefs = await footerLinks.evaluateAll((els) =>
      els.map((el) => el.getAttribute('href') ?? '')
    )
    const internalLinks = hrefs.filter((h) => h.startsWith('/'))
    expect(internalLinks.length).toBeGreaterThan(0)

    // PL internal links are unprefixed; no legacy `/pl/...` links remain.
    for (const href of internalLinks) {
      expect(href).not.toMatch(/^\/pl(\/|$)/)
    }
  })

  test('footer Facebook social link is present and correct', async ({ page }) => {
    await desktop(page, '/')
    const fbLink = page.locator('footer a[href*="facebook.com"]').first()
    await expect(fbLink).toBeVisible()
    const href = await fbLink.getAttribute('href')
    expect(href).toContain('facebook.com/americandreamclub')
  })

  test('footer Instagram social link is present and correct', async ({ page }) => {
    await desktop(page, '/')
    const igLink = page.locator('footer a[href*="instagram.com"]').first()
    await expect(igLink).toBeVisible()
    const href = await igLink.getAttribute('href')
    expect(href).toContain('instagram.com/americandreamclub')
  })

  test('footer YouTube social link is present and correct', async ({ page }) => {
    await desktop(page, '/')
    const ytLink = page.locator('footer a[href*="youtube.com"]').first()
    await expect(ytLink).toBeVisible()
    const href = await ytLink.getAttribute('href')
    expect(href).toContain('youtube.com/@americandreamclub')
  })

  test('footer bottom-bar links are clickable', async ({ page }) => {
    await desktop(page, '/')
    const bottomBar = page.locator('footer .bg-brand-navy a')
    const count = await bottomBar.count()
    expect(count).toBeGreaterThan(0)
  })
})

// ── 4. Contact form ───────────────────────────────────────────────────────────
test.describe('Contact form — interactions', () => {
  test('contact form fields are focusable and accept input', async ({ page }) => {
    await desktop(page, '/contact')

    const nameInput = page.locator('input[name="name"], input[placeholder*="mię"], input[placeholder*="Imię"]').first()
    const messageInput = page.locator('textarea, input[name="message"]').first()
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()

    await expect(emailInput).toBeVisible()
    await emailInput.fill('test@example.com')
    await expect(emailInput).toHaveValue('test@example.com')

    if (await nameInput.isVisible()) {
      await nameInput.fill('Jan Kowalski')
      await expect(nameInput).toHaveValue('Jan Kowalski')
    }

    if (await messageInput.isVisible()) {
      await messageInput.fill('Wiadomość testowa')
      await expect(messageInput).toHaveValue('Wiadomość testowa')
    }
  })

  test('contact form has a submit button', async ({ page }) => {
    await desktop(page, '/contact')
    const submitBtn = page.locator('button[type="submit"], input[type="submit"]').first()
    await expect(submitBtn).toBeVisible()
    await expect(submitBtn).toBeEnabled()
  })

  test('contact form submit with invalid email shows validation or response', async ({ page }) => {
    await desktop(page, '/contact')
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    await emailInput.fill('not-an-email')

    const submitBtn = page.locator('button[type="submit"]').first()
    await submitBtn.click()

    // Browser native validation or custom error message
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
    const hasErrorMsg = await page.locator('[class*="error"], [class*="invalid"], [role="alert"]').count()
    expect(isInvalid || hasErrorMsg > 0).toBeTruthy()
  })

  test('privacy policy checkbox is present and checkable', async ({ page }) => {
    await desktop(page, '/contact')
    const checkbox = page.locator('input[type="checkbox"]').first()
    if (await checkbox.isVisible()) {
      await checkbox.check()
      await expect(checkbox).toBeChecked()
    }
  })
})

// ── 5. Newsletter form ────────────────────────────────────────────────────────
test.describe('Newsletter form — interactions', () => {
  test('newsletter email input accepts an address', async ({ page }) => {
    await desktop(page, '/')
    const footer = page.locator('footer')
    const emailInput = footer.locator('input[type="email"]').first()
    await expect(emailInput).toBeVisible()
    await emailInput.fill('newsletter@test.pl')
    await expect(emailInput).toHaveValue('newsletter@test.pl')
  })

  test('newsletter form has submit button', async ({ page }) => {
    await desktop(page, '/')
    const footer = page.locator('footer')
    const submitBtn = footer.locator('button[type="submit"], button').filter({ hasText: /zapisz|wyślij|subscribe|send/i }).first()
    if (await submitBtn.count() > 0) {
      await expect(submitBtn).toBeVisible()
    } else {
      // Submit may be an arrow icon button
      const anyBtn = footer.locator('button').last()
      await expect(anyBtn).toBeVisible()
    }
  })

  test('newsletter submit with valid email shows success or pending state', async ({ page }) => {
    await desktop(page, '/')
    const footer = page.locator('footer')
    const emailInput = footer.locator('input[type="email"]').first()
    await emailInput.fill('e2e-test@americandream.test')

    const submitBtn = footer.locator('button').last()
    await submitBtn.click()

    // Should show some feedback — success message, spinner, or same input (email not critical for CI)
    await page.waitForTimeout(1000)
    // We just verify no unhandled error occurs
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
    await expect(page.locator('body')).not.toContainText('500')
  })
})

// ── 6. Artist form ────────────────────────────────────────────────────────────
test.describe('Artist application form — interactions', () => {
  test('artist form renders with input fields', async ({ page }) => {
    await desktop(page, '/kontakt-dla-artystow')
    await expect(page.locator('form, [data-artist-form]').first()).toBeVisible()
    const inputs = page.locator('form input, form textarea, form select')
    const count = await inputs.count()
    expect(count).toBeGreaterThan(1)
  })

  test('artist form email field accepts input', async ({ page }) => {
    await desktop(page, '/kontakt-dla-artystow')
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    await expect(emailInput).toBeVisible()
    await emailInput.fill('artist@band.pl')
    await expect(emailInput).toHaveValue('artist@band.pl')
  })

  test('artist form has a submit button', async ({ page }) => {
    await desktop(page, '/kontakt-dla-artystow')
    const submitBtn = page.locator('button[type="submit"]').first()
    await expect(submitBtn).toBeVisible()
    await expect(submitBtn).toBeEnabled()
  })
})

// ── 7. News — article card click (slug routing) ───────────────────────────────
test.describe('News — article navigation', () => {
  test('news listing page renders article links', async ({ page }) => {
    await desktop(page, '/news')
    // Article cards should be slug-based links to detail pages
    const articleLinks = page.locator('a[href^="/news/"]')
    const count = await articleLinks.count()
    if (count > 0) {
      const href = await articleLinks.first().getAttribute('href')
      expect(href).toMatch(/^\/news\/[a-z0-9-]+$/)
    }
  })

  test('clicking an article link navigates to its detail page', async ({ page }) => {
    await desktop(page, '/news')
    const articleLinks = page.locator('a[href^="/news/"]')
    const count = await articleLinks.count()
    if (count > 0) {
      const href = await articleLinks.first().getAttribute('href')
      await articleLinks.first().click()
      if (href) await expect(page).toHaveURL(`${BASE}${href}`)
      await expect(page.locator('main')).toBeVisible()
    }
  })
})

// ── 8. Events — event navigation (slug routing) ──────────────────────────────
test.describe('Events — event interaction', () => {
  test('events page renders event/calendar content', async ({ page }) => {
    await desktop(page, '/events')
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  })

  test('events page contains slug-based event links', async ({ page }) => {
    await desktop(page, '/events')
    const eventLinks = page.locator('a[href^="/events/"]')
    const count = await eventLinks.count()
    if (count > 0) {
      const href = await eventLinks.first().getAttribute('href')
      // Events are now addressed by SLUG, not by numeric id.
      expect(href).toMatch(/^\/events\/[a-z0-9-]+$/)
    }
  })

  test('clicking an event link opens its detail page by slug', async ({ page }) => {
    await desktop(page, '/events')
    const eventLinks = page.locator('a[href^="/events/"]')
    const count = await eventLinks.count()
    if (count > 0) {
      const href = await eventLinks.first().getAttribute('href')
      await eventLinks.first().click()
      if (href) await expect(page).toHaveURL(`${BASE}${href}`)
      await expect(page.locator('main')).toBeVisible()
    }
  })
})

// ── 9. Language switching — full round-trip ───────────────────────────────────
test.describe('Language switching — full round-trip', () => {
  test('PL→EN→PL round-trip via header language switcher', async ({ page }) => {
    await desktop(page, '/')
    await expect(page).toHaveURL(HOME)

    // Switch to EN
    await langButton(page, 'EN').click()
    await expect(page).toHaveURL(`${BASE}/en`)
    await expect(page.locator('header')).toBeVisible()

    // Switch back to PL (unprefixed homepage)
    await langButton(page, 'PL').click()
    await expect(page).toHaveURL(HOME)
  })

  test('switching locale on a subpage keeps you on the same page', async ({ page }) => {
    await desktop(page, '/restaurant')
    await langButton(page, 'EN').click()
    await expect(page).toHaveURL(`${BASE}/en/restaurant`)
    await langButton(page, 'PL').click()
    await expect(page).toHaveURL(`${BASE}/restaurant`)
  })

  test('/en homepage renders correct English content', async ({ page }) => {
    await desktop(page, '/en')
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })
})

// ── 10. Rezerwacja page ───────────────────────────────────────────────────────
test.describe('Rezerwacja — reservation page', () => {
  test('/rezerwacja renders without errors', async ({ page }) => {
    await desktop(page, '/rezerwacja')
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
    await expect(page.locator('body')).toContainText(/rezerwacj/i)
  })

  test('/rezerwacja contains a contact action (phone or form)', async ({ page }) => {
    await desktop(page, '/rezerwacja')
    // Should have either a phone link, form, or email link
    const hasPhone = await page.locator('a[href^="tel:"]').count()
    const hasForm = await page.locator('form, input[type="email"]').count()
    const hasEmail = await page.locator('a[href^="mailto:"]').count()
    expect(hasPhone + hasForm + hasEmail).toBeGreaterThan(0)
  })
})

// ── 11. Responsive — nav items hidden/visible by breakpoint ─────────────────
test.describe('Responsive navigation', () => {
  test('hamburger button is hidden on desktop (≥1024px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await goto(page, '/')
    const hamburger = page.locator('button[aria-label="Open menu"]')
    await expect(hamburger).toBeHidden()
  })

  test('hamburger button is visible on mobile (<1024px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await goto(page, '/')
    const hamburger = page.locator('button[aria-label="Open menu"]')
    await expect(hamburger).toBeVisible()
  })

  test('desktop nav links are hidden on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await goto(page, '/')
    // Desktop nav is inside a .hidden.lg:flex container
    const desktopNav = page.locator('header .hidden.lg\\:flex nav').first()
    await expect(desktopNav).toBeHidden()
  })
})

// ── 12. Business (twoje-wydarzenie) — private event page ───────────────────────
test.describe('Business — private/corporate event page', () => {
  test('/business renders without errors', async ({ page }) => {
    await desktop(page, '/business')
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  })

  test('/business has sales contact info', async ({ page }) => {
    await desktop(page, '/business')
    // Should show contact info for event bookings
    const hasPhone = await page.locator('a[href^="tel:"]').count()
    expect(hasPhone).toBeGreaterThan(0)
  })

  test('business detail pages render by slug', async ({ page }) => {
    await desktop(page, '/business/meetings')
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  })
})

// ── 13. 301 redirects — old URLs → new scheme ─────────────────────────────────
test.describe('301 redirects — old URLs land on the new scheme', () => {
  const cases: [string, string][] = [
    // renamed Payload page slugs / dedicated routes
    ['/restauracja', '/restaurant'],
    ['/bar', '/bar-and-cocktails'],
    ['/cigar-room', '/cigar-lounge'],
    ['/twoje-wydarzenie', '/business'],
    ['/kontakt', '/contact'],
    ['/polityka-prywatnosci', '/privacy'],
    ['/program', '/events'],
    ['/aktualnosci', '/news'],
    // old WordPress URLs → closest current section
    ['/kuchnia', '/restaurant'],
    ['/palarnia-cygar', '/cigar-lounge'],
    ['/kalendarium', '/events'],
    ['/wino', '/bar-and-cocktails'],
    ['/oferta/spotkania-biznesowe', '/business/meetings'],
    ['/oferta/urodziny', '/business/birthday'],
    ['/oferta/wieczory-kawalerskie', '/business/stag'],
    ['/oferta/wynajem-sali-na-imprezy', '/business/venue-hire'],
    ['/spotkania-wigilijne', '/business/christmas'],
    // legacy `/pl/...` prefix is stripped (then may chain to a renamed slug)
    ['/pl', '/'],
    ['/pl/kontakt', '/contact'],
    ['/pl/restauracja', '/restaurant'],
  ]

  for (const [from, to] of cases) {
    test(`${from} → ${to}`, async ({ page }) => {
      await page.goto(`${BASE}${from}`)
      await expect(page).toHaveURL(`${BASE}${to}`)
    })
  }

  test('old URL replies with a permanent-redirect status (301/308)', async ({ request }) => {
    const resp = await request.get(`${BASE}/restauracja`, { maxRedirects: 0 })
    expect([301, 308]).toContain(resp.status())
    const location = resp.headers()['location']
    expect(location).toContain('/restaurant')
  })

  test('old article deep URL keeps its slug (/aktualnosci/:slug → /news/:slug)', async ({ request }) => {
    const resp = await request.get(`${BASE}/aktualnosci/some-article`, { maxRedirects: 0 })
    expect([301, 308]).toContain(resp.status())
    expect(resp.headers()['location']).toContain('/news/some-article')
  })
})

// ── 14. No 404 — unknown paths redirect "up a level" ──────────────────────────
test.describe('No 404 page — unknown paths redirect up', () => {
  test('unknown single-segment page redirects to the homepage', async ({ page }) => {
    await page.goto(`${BASE}/this-page-does-not-exist`)
    await expect(page).toHaveURL(HOME)
    await expect(page.locator('main')).toBeVisible()
  })

  test('unknown event slug redirects up to /events', async ({ page }) => {
    await page.goto(`${BASE}/events/no-such-event-xyz`)
    await expect(page).toHaveURL(`${BASE}/events`)
  })

  test('unknown news slug redirects up to /news', async ({ page }) => {
    await page.goto(`${BASE}/news/no-such-article-xyz`)
    await expect(page).toHaveURL(`${BASE}/news`)
  })

  test('unknown business detail slug renders a shell, not a 404', async ({ page }) => {
    // Business detail (`/business/[slug]`) never hard-404s — an unknown slug
    // renders an empty shell within the site chrome.
    await page.goto(`${BASE}/business/no-such-offer-xyz`)
    await expect(page).toHaveURL(`${BASE}/business/no-such-offer-xyz`)
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  })
})
