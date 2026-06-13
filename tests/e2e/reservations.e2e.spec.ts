/**
 * American Dream Club — reservation wizard & status page (spec §3).
 *
 *  1.  /rezerwacja page renders (PL + EN)
 *  2.  CTA opens the wizard; step 1 shows the three options; "Dalej" gates on selection
 *  3.  Selecting an option advances to the event-picker step
 *  4.  Close warning: after entering data, the X asks to confirm (in-app, not beforeunload)
 *  5.  Status page shows the not-found card for an unknown reservation id
 */

import { test, expect, type Page } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'

async function openWizard(page: Page) {
  await page.goto(`${BASE}/rezerwacja`)
  await page.getByRole('button', { name: 'Rozpocznij rezerwację' }).click()
  return page.getByRole('dialog', { name: 'Rezerwacja' })
}

test.describe('Reservation wizard', () => {
  test('reservations page renders (PL)', async ({ page }) => {
    await page.goto(`${BASE}/rezerwacja`)
    await expect(page.getByRole('heading', { level: 1, name: 'Rezerwacje' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Rozpocznij rezerwację' })).toBeVisible()
  })

  test('reservations page renders (EN)', async ({ page }) => {
    await page.goto(`${BASE}/en/rezerwacja`)
    await expect(page.getByRole('heading', { level: 1, name: 'Reservations' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start a reservation' })).toBeVisible()
  })

  // The in-app reservation wizard is currently DISABLED on the live site — the
  // reservation CTAs open the MyRest widget instead (the wizard code is kept but
  // not mounted). These wizard-interaction tests are skipped until/if the in-app
  // flow is re-enabled. The page-render and status tests above/below still apply.
  test.skip('CTA opens the wizard on step 1 with three options', async ({ page }) => {
    const dialog = await openWizard(page)
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Krok 1 z 5')).toBeVisible()
    await expect(dialog.getByText('Otwarcie wieczoru')).toBeVisible()
    await expect(dialog.getByText('Koncert', { exact: true })).toBeVisible()
    await expect(dialog.getByText('Wieczór klubowy')).toBeVisible()
    // Next is gated until an option is chosen.
    await expect(dialog.getByRole('button', { name: 'Dalej' })).toBeDisabled()
  })

  test.skip('selecting an option advances to the event step', async ({ page }) => {
    const dialog = await openWizard(page)
    await dialog.getByText('Otwarcie wieczoru').click()
    const next = dialog.getByRole('button', { name: 'Dalej' })
    await expect(next).toBeEnabled()
    await next.click()
    await expect(dialog.getByText('Wybierz wydarzenie')).toBeVisible()
  })

  test.skip('closing after entering data asks for confirmation', async ({ page }) => {
    const dialog = await openWizard(page)
    // Selecting an option marks the form as touched.
    await dialog.getByText('Koncert', { exact: true }).click()
    await dialog.getByRole('button', { name: 'Zamknij', exact: true }).click()

    await expect(page.getByText('Na pewno chcesz zamknąć?')).toBeVisible()
    // "Go back" keeps the wizard open.
    await page.getByRole('button', { name: 'Wróć' }).click()
    await expect(dialog).toBeVisible()
    // "Close anyway" dismisses it.
    await dialog.getByRole('button', { name: 'Zamknij', exact: true }).click()
    await page.getByRole('button', { name: 'Zamknij mimo to' }).click()
    await expect(dialog).toBeHidden()
  })
})

test.describe('Reservation status page', () => {
  test('unknown id shows the not-found card (PL)', async ({ page }) => {
    await page.goto(`${BASE}/rezerwacja/status?id=ADC-000000-9999`)
    await expect(page.getByRole('heading', { name: 'Nie znaleziono rezerwacji' })).toBeVisible()
  })

  test('unknown id shows the not-found card (EN)', async ({ page }) => {
    await page.goto(`${BASE}/en/rezerwacja/status?id=ADC-000000-9999`)
    await expect(page.getByRole('heading', { name: 'Reservation not found' })).toBeVisible()
  })
})
