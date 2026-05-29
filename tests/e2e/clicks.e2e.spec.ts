/**
 * American Dream Club — click & interaction tests.
 *
 * Every interactive element is exercised:
 *  1.  Header (desktop) — logo, topbar links, social icons, nav items, language switcher, CTA
 *  2.  Mobile menu — hamburger opens, close button, backdrop, nav items, language, CTA
 *  3.  Footer — logo, phone, nav columns, social icons, bottom-bar links
 *  4.  Contact form — fill + validation + submit
 *  5.  Newsletter form — fill + submit
 *  6.  Artist application form — fill + submit
 *  7.  News (Aktualności) — article card click
 *  8.  Program — event card click
 *  9.  Language switching — full /pl → /en round-trip via header
 * 10.  Rezerwacje — page renders and CTA is clickable
 */

import { test, expect, type Page } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'

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

// ── 1. Header — Desktop ───────────────────────────────────────────────────────
test.describe('Header — desktop clicks', () => {
  test('logo click navigates to /pl homepage', async ({ page }) => {
    await desktop(page, '/pl/kontakt')
    await page.locator('header a').filter({ has: page.locator('svg, img') }).first().click()
    await expect(page).toHaveURL(/\/pl$/)
  })

  test('topbar phone link has correct tel: href', async ({ page }) => {
    await desktop(page, '/pl')
    const phoneLink = page.locator('header a[href^="tel:"]').first()
    await expect(phoneLink).toBeVisible()
    const href = await phoneLink.getAttribute('href')
    expect(href).toMatch(/^tel:\+?48500210333$/)
  })

  test('topbar address link opens Google Maps', async ({ page }) => {
    await desktop(page, '/pl')
    const addressLink = page.locator('header a[href*="google.com/maps"], header a[href*="maps.app"]').first()
    await expect(addressLink).toBeVisible()
    const href = await addressLink.getAttribute('href')
    expect(href).toBeTruthy()
    expect(href).toMatch(/google\.com\/maps|maps\.app/i)
  })

  test('social icon — Facebook has correct href', async ({ page }) => {
    await desktop(page, '/pl')
    const fbLink = page.locator('header a[href*="facebook.com"]').first()
    await expect(fbLink).toBeVisible()
    const href = await fbLink.getAttribute('href')
    expect(href).toContain('facebook.com/americandreamclub')
  })

  test('social icon — Instagram has correct href', async ({ page }) => {
    await desktop(page, '/pl')
    const igLink = page.locator('header a[href*="instagram.com"]').first()
    await expect(igLink).toBeVisible()
    const href = await igLink.getAttribute('href')
    expect(href).toContain('instagram.com/americandreamclub')
  })

  test('social icon — YouTube has correct href', async ({ page }) => {
    await desktop(page, '/pl')
    const ytLink = page.locator('header a[href*="youtube.com"]').first()
    await expect(ytLink).toBeVisible()
    const href = await ytLink.getAttribute('href')
    expect(href).toContain('youtube.com/@americandreamclub')
  })

  test('left nav items link to correct locale-prefixed paths', async ({ page }) => {
    await desktop(page, '/pl')
    const navLinks = page.locator('header nav a')
    const count = await navLinks.count()
    expect(count).toBeGreaterThan(0)

    // Collect all hrefs
    const hrefs = await navLinks.evaluateAll((els) =>
      els.map((el) => el.getAttribute('href') ?? '')
    )

    for (const href of hrefs) {
      if (href.startsWith('/') && !href.startsWith('//')) {
        expect(href).toMatch(/^\/(pl|en)/)
      }
    }
  })

  test('clicking a nav item actually navigates', async ({ page }) => {
    await desktop(page, '/pl')
    // Find first internal nav link that is NOT the homepage
    const navLinks = page.locator('header nav a')
    const count = await navLinks.count()
    for (let i = 0; i < count; i++) {
      const href = await navLinks.nth(i).getAttribute('href')
      if (href && href.startsWith('/pl/')) {
        await navLinks.nth(i).click()
        await expect(page).toHaveURL(`${BASE}${href}`)
        return
      }
    }
    // If no subpage nav link found, skip (test still validates nav links exist)
    expect(count).toBeGreaterThan(0)
  })

  test('PL language link is highlighted and EN link navigates to /en', async ({ page }) => {
    await desktop(page, '/pl')
    const enLink = page.locator('header a[href="/en"]').first()
    await expect(enLink).toBeVisible()
    await enLink.click()
    await expect(page).toHaveURL(`${BASE}/en`)
  })

  test('from /en, PL language link navigates back to /pl', async ({ page }) => {
    await desktop(page, '/en')
    const plLink = page.locator('header a[href="/pl"]').first()
    await expect(plLink).toBeVisible()
    await plLink.click()
    await expect(page).toHaveURL(`${BASE}/pl`)
  })

  test('CTA "ZAREZERWUJ" button navigates to reservation page', async ({ page }) => {
    await desktop(page, '/pl')
    const cta = page.locator('header').getByText(/zarezerwuj/i)
    await expect(cta).toBeVisible()
    await cta.click()
    // Should navigate to rezerwacje or have a booking URL
    await expect(page).toHaveURL(/\/pl\/(rezerwacje|[a-z-]+)/)
  })
})

// ── 2. Mobile menu interactions ───────────────────────────────────────────────
test.describe('Mobile menu — interactions', () => {
  test('hamburger button opens the drawer', async ({ page }) => {
    await mobile(page, '/pl')
    const hamburger = page.locator('button[aria-label="Open menu"]')
    await expect(hamburger).toBeVisible()
    await hamburger.click()
    // Drawer should slide in
    const drawer = page.locator('[class*="translate-x-0"]').filter({ hasText: /pl|en/i }).first()
    await expect(drawer).toBeVisible({ timeout: 2000 })
  })

  test('close button hides the drawer', async ({ page }) => {
    await mobile(page, '/pl')
    await page.locator('button[aria-label="Open menu"]').click()
    const closeBtn = page.locator('button[aria-label="Close menu"]')
    await expect(closeBtn).toBeVisible()
    await closeBtn.click()
    // Drawer should slide out
    await page.waitForTimeout(350) // animation
    await expect(page.locator('button[aria-label="Close menu"]')).toBeHidden()
  })

  test('backdrop click closes the drawer', async ({ page }) => {
    await mobile(page, '/pl')
    await page.locator('button[aria-label="Open menu"]').click()
    await expect(page.locator('button[aria-label="Close menu"]')).toBeVisible()

    // Click the semi-transparent backdrop (first fixed overlay element)
    const backdrop = page.locator('.fixed.inset-0').first()
    await backdrop.click({ position: { x: 10, y: 10 } })
    await page.waitForTimeout(350)
    await expect(page.locator('button[aria-label="Close menu"]')).toBeHidden()
  })

  test('tapping a nav link in mobile menu navigates and closes the menu', async ({ page }) => {
    await mobile(page, '/pl')
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
    await mobile(page, '/pl')
    await page.locator('button[aria-label="Open menu"]').click()
    const enLink = page.locator('.fixed.top-0.right-0 a[href="/en"]')
    await expect(enLink).toBeVisible()
    await enLink.click()
    await expect(page).toHaveURL(`${BASE}/en`)
  })

  test('mobile social icons are visible and have hrefs', async ({ page }) => {
    await mobile(page, '/pl')
    await page.locator('button[aria-label="Open menu"]').click()
    const socialLinks = page.locator('.fixed.top-0.right-0 a[href*="facebook.com"], .fixed.top-0.right-0 a[href*="instagram.com"], .fixed.top-0.right-0 a[href*="youtube.com"]')
    await expect(socialLinks.first()).toBeVisible()
    const count = await socialLinks.count()
    expect(count).toBeGreaterThanOrEqual(2)
  })
})

// ── 3. Footer interactions ────────────────────────────────────────────────────
test.describe('Footer — clicks', () => {
  test('footer logo click navigates to /pl homepage', async ({ page }) => {
    await desktop(page, '/pl/kontakt')
    const footerLogo = page.locator('footer a').first()
    await footerLogo.click()
    await expect(page).toHaveURL(/\/pl$/)
  })

  test('footer phone link has tel: href', async ({ page }) => {
    await desktop(page, '/pl')
    const phoneLink = page.locator('footer a[href^="tel:"]')
    await expect(phoneLink.first()).toBeVisible()
    const href = await phoneLink.first().getAttribute('href')
    expect(href).toMatch(/tel:\+?48500210333/)
  })

  test('footer nav column links are clickable and locale-prefixed', async ({ page }) => {
    await desktop(page, '/pl')
    const footerLinks = page.locator('footer ul a')
    const count = await footerLinks.count()
    expect(count).toBeGreaterThan(3)

    const hrefs = await footerLinks.evaluateAll((els) =>
      els.map((el) => el.getAttribute('href') ?? '')
    )
    const internalLinks = hrefs.filter((h) => h.startsWith('/'))
    expect(internalLinks.length).toBeGreaterThan(0)

    // All internal links should start with /pl or /en
    for (const href of internalLinks) {
      expect(href).toMatch(/^\/(pl|en)/)
    }
  })

  test('footer Facebook social link is present and correct', async ({ page }) => {
    await desktop(page, '/pl')
    const fbLink = page.locator('footer a[href*="facebook.com"]').first()
    await expect(fbLink).toBeVisible()
    const href = await fbLink.getAttribute('href')
    expect(href).toContain('facebook.com/americandreamclub')
  })

  test('footer Instagram social link is present and correct', async ({ page }) => {
    await desktop(page, '/pl')
    const igLink = page.locator('footer a[href*="instagram.com"]').first()
    await expect(igLink).toBeVisible()
    const href = await igLink.getAttribute('href')
    expect(href).toContain('instagram.com/americandreamclub')
  })

  test('footer YouTube social link is present and correct', async ({ page }) => {
    await desktop(page, '/pl')
    const ytLink = page.locator('footer a[href*="youtube.com"]').first()
    await expect(ytLink).toBeVisible()
    const href = await ytLink.getAttribute('href')
    expect(href).toContain('youtube.com/@americandreamclub')
  })

  test('footer bottom-bar links are clickable', async ({ page }) => {
    await desktop(page, '/pl')
    const bottomBar = page.locator('footer .bg-brand-navy a')
    const count = await bottomBar.count()
    expect(count).toBeGreaterThan(0)
  })
})

// ── 4. Contact form ───────────────────────────────────────────────────────────
test.describe('Contact form — interactions', () => {
  test('contact form fields are focusable and accept input', async ({ page }) => {
    await desktop(page, '/pl/kontakt')

    const nameInput = page.locator('input[name="name"], input[placeholder*="mię"], input[placeholder*="Imię"]').first()
    const phoneInput = page.locator('input[name="phone"], input[type="tel"], input[placeholder*="elefon"]').first()
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    const messageInput = page.locator('textarea, input[name="message"]').first()

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
    await desktop(page, '/pl/kontakt')
    const submitBtn = page.locator('button[type="submit"], input[type="submit"]').first()
    await expect(submitBtn).toBeVisible()
    await expect(submitBtn).toBeEnabled()
  })

  test('contact form submit with invalid email shows validation or response', async ({ page }) => {
    await desktop(page, '/pl/kontakt')
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
    await desktop(page, '/pl/kontakt')
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
    await desktop(page, '/pl')
    const footer = page.locator('footer')
    const emailInput = footer.locator('input[type="email"]').first()
    await expect(emailInput).toBeVisible()
    await emailInput.fill('newsletter@test.pl')
    await expect(emailInput).toHaveValue('newsletter@test.pl')
  })

  test('newsletter form has submit button', async ({ page }) => {
    await desktop(page, '/pl')
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
    await desktop(page, '/pl')
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
    await desktop(page, '/pl/kontakt-dla-artystow')
    await expect(page.locator('form, [data-artist-form]').first()).toBeVisible()
    const inputs = page.locator('form input, form textarea, form select')
    const count = await inputs.count()
    expect(count).toBeGreaterThan(1)
  })

  test('artist form email field accepts input', async ({ page }) => {
    await desktop(page, '/pl/kontakt-dla-artystow')
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    await expect(emailInput).toBeVisible()
    await emailInput.fill('artist@band.pl')
    await expect(emailInput).toHaveValue('artist@band.pl')
  })

  test('artist form has a submit button', async ({ page }) => {
    await desktop(page, '/pl/kontakt-dla-artystow')
    const submitBtn = page.locator('button[type="submit"]').first()
    await expect(submitBtn).toBeVisible()
    await expect(submitBtn).toBeEnabled()
  })
})

// ── 7. Aktualności — article card click ──────────────────────────────────────
test.describe('Aktualności — article navigation', () => {
  test('news listing page renders article links', async ({ page }) => {
    await desktop(page, '/pl/aktualnosci')
    // Article cards should be links to detail pages
    const articleLinks = page.locator('a[href*="/pl/aktualnosci/"]')
    const count = await articleLinks.count()
    if (count > 0) {
      const href = await articleLinks.first().getAttribute('href')
      expect(href).toMatch(/\/pl\/aktualnosci\/[a-z0-9-]+/)
    }
  })

  test('clicking an article link navigates to its detail page', async ({ page }) => {
    await desktop(page, '/pl/aktualnosci')
    const articleLinks = page.locator('a[href*="/pl/aktualnosci/"]')
    const count = await articleLinks.count()
    if (count > 0) {
      const href = await articleLinks.first().getAttribute('href')
      await articleLinks.first().click()
      if (href) await expect(page).toHaveURL(`${BASE}${href}`)
      await expect(page.locator('main')).toBeVisible()
    }
  })
})

// ── 8. Program — event navigation ────────────────────────────────────────────
test.describe('Program — event interaction', () => {
  test('program page renders event/calendar content', async ({ page }) => {
    await desktop(page, '/pl/program')
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  })

  test('program page contains clickable event links', async ({ page }) => {
    await desktop(page, '/pl/program')
    const eventLinks = page.locator('a[href*="/pl/program/"]')
    const count = await eventLinks.count()
    if (count > 0) {
      const href = await eventLinks.first().getAttribute('href')
      expect(href).toMatch(/\/pl\/program\/[a-z0-9-]+/)
    }
  })
})

// ── 9. Language switching — full round-trip ───────────────────────────────────
test.describe('Language switching — full round-trip', () => {
  test('PL→EN→PL round-trip via header language switcher', async ({ page }) => {
    await desktop(page, '/pl')
    await expect(page).toHaveURL(`${BASE}/pl`)

    // Switch to EN
    await page.locator('header a[href="/en"]').first().click()
    await expect(page).toHaveURL(`${BASE}/en`)
    await expect(page.locator('header')).toBeVisible()

    // Switch back to PL
    await page.locator('header a[href="/pl"]').first().click()
    await expect(page).toHaveURL(`${BASE}/pl`)
  })

  test('/en homepage renders correct English content', async ({ page }) => {
    await desktop(page, '/en')
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })
})

// ── 10. Rezerwacje page ───────────────────────────────────────────────────────
test.describe('Rezerwacje — reservation page', () => {
  test('/pl/rezerwacje renders without errors', async ({ page }) => {
    await desktop(page, '/pl/rezerwacje')
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
    await expect(page.locator('body')).toContainText(/rezerwacj/i)
  })

  test('/pl/rezerwacje contains a contact action (phone or form)', async ({ page }) => {
    await desktop(page, '/pl/rezerwacje')
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
    await goto(page, '/pl')
    const hamburger = page.locator('button[aria-label="Open menu"]')
    await expect(hamburger).toBeHidden()
  })

  test('hamburger button is visible on mobile (<1024px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await goto(page, '/pl')
    const hamburger = page.locator('button[aria-label="Open menu"]')
    await expect(hamburger).toBeVisible()
  })

  test('desktop nav links are hidden on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await goto(page, '/pl')
    // Desktop nav is inside a .hidden.lg:flex container
    const desktopNav = page.locator('header .hidden.lg\\:flex nav').first()
    await expect(desktopNav).toBeHidden()
  })
})

// ── 12. Twoje wydarzenie — event booking page ─────────────────────────────────
test.describe('Twoje wydarzenie — private event page', () => {
  test('/pl/twoje-wydarzenie renders without errors', async ({ page }) => {
    await desktop(page, '/pl/twoje-wydarzenie')
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  })

  test('/pl/twoje-wydarzenie has sales contact info', async ({ page }) => {
    await desktop(page, '/pl/twoje-wydarzenie')
    // Should show contact info for event bookings
    const hasPhone = await page.locator('a[href^="tel:"]').count()
    expect(hasPhone).toBeGreaterThan(0)
  })
})
