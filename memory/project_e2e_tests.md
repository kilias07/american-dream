---
name: project-e2e-tests
description: E2E test suite overview — what exists, how to run, known gaps
metadata:
  type: project
---

Three Playwright E2E test files in `tests/e2e/`:

1. **frontend.e2e.spec.ts** — general smoke tests (locale routing, 200 responses, SEO, forms basics)
2. **clicks.e2e.spec.ts** — every interactive click: header desktop/mobile, footer links, contact/newsletter/artist forms, news card navigation, language round-trip, responsive breakpoints (47 tests)
3. **old-site-parity.e2e.spec.ts** — content parity vs old https://americandreamclub.pl: contact info, hours, all page routes, menu items, cocktails, cigars, events, 21+ badge, social links, SEO (79 tests; 4 `test.skip` for known intentional gaps)

Run: `pnpm test:e2e` (local dev server) or `pnpm test:e2e:live` (Cloudflare Workers).

**Why:** Created to verify every click works and to lock in parity with the old WordPress site.

**How to apply:** Reference when adding new pages or features — add tests to the appropriate file.
