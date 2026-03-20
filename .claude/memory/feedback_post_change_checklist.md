---
name: post-change checklist — always run tests and local deploy
description: After any significant code changes, always run tests and verify local build before declaring done
type: feedback
---

After big changes, always run tests and local deploy before considering the task complete. If something is broken, fix it and repeat.

**Why:** User explicitly asked for this. Broken tests and deploy issues should be caught by me, not surfaced to the user later.

**How to apply:**
1. `pnpm run test:int` — integration tests (vitest)
2. `pnpm run build` — Next.js production build (catches type errors, missing routes, broken imports)
3. If either fails: diagnose, fix, and repeat from step 1
4. E2e tests (`pnpm run test:e2e`) require a running dev server — skip unless specifically verifying frontend behavior
5. Note: `pnpm run build` is often the most useful single check — it catches both TypeScript errors AND route/rendering issues
