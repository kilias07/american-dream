# CMS translations

The site's interface strings live in `src/config/ui-strings.ts`. Everything in
this folder is the *editorial* content — page copy, events, menus, news, legal
documents — which lives in the CMS and therefore cannot be translated in code.

## Files

- `source.json` — every translatable string found in the CMS, deduplicated,
  with a note of where each one appears. Regenerate with `i18n-extract`.
- `de.json` / `fr.json` / `es.json` — flat `Polish → translation` dictionaries.
- `parts/done-NN.json` — the same translations grouped per batch, three
  languages side by side. This is the file to edit when correcting wording;
  the flat dictionaries are merged from these.

Polish is the source language: it is where the copy was actually written, and
the English rows are themselves a translation.

## Workflow

```bash
# 1. Pull the current strings out of the CMS
CLOUDFLARE_ENV=staging NODE_ENV=production PAYLOAD_FORCE_WRANGLER=true \
  pnpm exec tsx scripts/i18n-extract.ts

# 2. Translate anything new (edit parts/done-NN.json, then merge to de/fr/es.json)

# 3. Write collections and globals back through the CMS
CLOUDFLARE_ENV=staging NODE_ENV=production PAYLOAD_FORCE_WRANGLER=true \
  pnpm exec tsx scripts/i18n-apply.ts de fr es

# 4. Write the page tree directly (see below)
node scripts/i18n-apply-pages.mjs "D1 --env=staging" de fr es
```

Both steps are repeatable: re-running with a fuller dictionary just fills gaps.

## Why pages take a different path

A page's `layout` is a localized `blocks` field. Payload rewrites *every*
locale of such a field on each save, and on D1 those writes are not
transactional — a failure mid-write leaves Polish or English rows deleted and
not restored. `i18n-apply.ts` therefore skips pages, and
`i18n-apply-pages.mjs` copies the Polish rows and inserts translated ones
instead, never deleting anything except a previous run's rows for the same
target language.

## After applying

Content written straight to the database does not fire the CMS revalidation
hooks, so the cached pages must be invalidated by hand:

```bash
curl -X POST "$BASE/api/revalidate" -H "x-revalidate-secret: $SECRET" \
  -H 'content-type: application/json' -d '{"tag":"pages"}'
```

Global tags use underscores (`global_ui_labels`), not the hyphenated slug.
