/**
 * Verify the CMS is set up and editable:
 *  1. Ensure a local admin user exists (so you can log into /admin).
 *  2. Inventory every collection + global and list the upload (image) fields —
 *     i.e. exactly where you swap the placeholder photos in the admin panel.
 *  3. Smoke-test editability: create → update → delete a throwaway page via the
 *     Local API (the same path the admin UI uses), proving writes work.
 *
 * Run: pnpm exec tsx scripts/verify-cms.ts
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import type { Field } from 'payload'
import configPromise from '../src/payload.config'

const ADMIN_EMAIL = 'admin@americandreamclub.pl'
const ADMIN_PASSWORD = 'ADCadmin!2026' // LOCAL DEV ONLY — change after first login

function uploadFields(fields: Field[], prefix = ''): string[] {
  const out: string[] = []
  for (const f of fields) {
    // @ts-expect-error narrow at runtime
    const name = f.name ? `${prefix}${f.name}` : prefix.replace(/\.$/, '')
    if (f.type === 'upload') out.push(name)
    if (f.type === 'blocks') for (const b of f.blocks) out.push(...uploadFields(b.fields, `${name}[${b.slug}].`))
    // @ts-expect-error array/group/row/collapsible
    if (f.fields) out.push(...uploadFields(f.fields, name ? `${name}.` : prefix))
    // @ts-expect-error tabs
    if (f.tabs) for (const t of f.tabs) out.push(...uploadFields(t.fields, prefix))
  }
  return out
}

async function run() {
  const payload = await getPayload({ config: configPromise })
  const log = (m: string) => payload.logger.info(m)

  // 1. Admin user
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: ADMIN_EMAIL } },
    limit: 1,
  })
  if (existing.docs[0]) {
    log(`👤 admin user already exists: ${ADMIN_EMAIL}`)
  } else {
    await payload.create({
      collection: 'users',
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    })
    log(`👤 created admin user: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}  (CHANGE AFTER LOGIN)`)
  }

  // 2. Inventory collections + globals + upload fields
  log('\n📚 COLLECTIONS (slug — #docs — image/upload fields):')
  for (const col of payload.config.collections) {
    if (col.slug === 'payload-migrations' || col.slug === 'payload-preferences' || col.slug === 'payload-locked-documents') continue
    let count = 0
    try {
      count = (await payload.count({ collection: col.slug as 'pages' })).totalDocs
    } catch {
      /* ignore */
    }
    const ups = [...new Set(uploadFields(col.fields))].filter(Boolean)
    log(`  • ${col.slug} — ${count} docs — uploads: ${ups.length ? ups.join(', ') : '—'}`)
  }

  log('\n🌐 GLOBALS (slug — image/upload fields):')
  for (const g of payload.config.globals) {
    const ups = [...new Set(uploadFields(g.fields))].filter(Boolean)
    log(`  • ${g.slug} — uploads: ${ups.length ? ups.join(', ') : '—'}`)
  }

  // 3. Editability smoke test (create → update → delete a throwaway page)
  log('\n🧪 Editability smoke test (Local API write path = admin UI write path):')
  const draft = await payload.create({
    collection: 'pages',
    data: { title: '__cms_verify__', slug: '__cms_verify__', _status: 'draft' } as never,
  })
  log(`   create page #${draft.id} ✓`)
  await payload.update({
    collection: 'pages',
    id: draft.id,
    data: { title: '__cms_verify__ edited' } as never,
  })
  log('   update page ✓')
  await payload.delete({ collection: 'pages', id: draft.id })
  log('   delete page ✓')

  log('\n✅ CMS verified: admin user ready, all collections/globals registered, writes work.')
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
