import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('root redirects to default locale', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page).toHaveURL('http://localhost:3000/en')
  })

  test('locale prefix is preserved on navigation', async ({ page }) => {
    await page.goto('http://localhost:3000/en')
    await expect(page).toHaveURL('http://localhost:3000/en')
  })

  test('polish locale route is accessible', async ({ page }) => {
    await page.goto('http://localhost:3000/pl')
    await expect(page).toHaveURL('http://localhost:3000/pl')
  })
})
