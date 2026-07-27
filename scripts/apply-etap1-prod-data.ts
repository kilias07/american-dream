/**
 * Finał ETAP 1 (mail Rabbit Design, PDF „zmian v1", 2026-07) — CHIRURGICZNE
 * zmiany danych na REMOTE D1. Celowo nie używa seeda: prod ma treści
 * edytowane przez klienta (np. baner „Lunch Time & Café"), których nie wolno
 * nadpisać. Zakres — wyłącznie:
 *
 *  1. site-settings: ikona Google Maps → wizytówka (CID), mapa na Kontakcie →
 *     pinezka z nazwą klubu (nie adres pocztowy);
 *  2. strona `restaurant`: usunięcie żółtego linku „NASZE MENU ›" z hero
 *     (inlineLinkLabel/Url) — reszta layoutu NIETKNIĘTA;
 *  3. strona `bar-and-cocktails`: podmiana bloku `menuSection` na
 *     `menuGallery` (bento na obrazki, jak Restauracja) — hero i bento
 *     zostają dokładnie jak są; kafelki dostają WŁASNE, nowe media docs
 *     (placeholdery — klient podmienia w /admin), żeby podmiana jednego
 *     obrazka nigdy nie „przeciekała" do innych slotów.
 *
 * Uruchomienie (Node 22):
 *   NODE_ENV=production PAYLOAD_FORCE_WRANGLER=true npx tsx scripts/apply-etap1-prod-data.ts
 * Po nim: `wrangler r2 object put` dla plików kafelków (skrypt wypisuje
 * komendy) + POST /api/revalidate.
 */
import path from 'path'
import os from 'os'
import { promises as fsp } from 'fs'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const WIZYTOWKA = 'https://maps.google.com/?cid=7031611719575019223'
const MAP_EMBED =
  'https://www.google.com/maps?q=American+Dream+Club+%E2%80%93+Restauracja+z+muzyk%C4%85+na+%C5%BCywo+przy+Starym+Rynku+w+Poznaniu&output=embed'
const PLACEHOLDER = path.join(ROOT, 'public/images/placeholders/bar.jpg')

async function run() {
  const payload = await getPayload({ config })
  const log = (m: string) => payload.logger.info(m)

  // ── 1. site-settings ───────────────────────────────────────────────────────
  const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
  const social = (settings.social ?? []).map((s) =>
    s.platform === 'googleMaps' ? { ...s, url: WIZYTOWKA } : s,
  )
  await payload.updateGlobal({
    slug: 'site-settings',
    data: { social, mapEmbedUrl: MAP_EMBED } as never,
  })
  log('✓ site-settings: googleMaps → wizytówka CID, mapEmbedUrl → pinezka z nazwą')

  // ── 2. restaurant: hero bez „NASZE MENU ›" ────────────────────────────────
  for (const locale of ['pl', 'en'] as const) {
    const restaurant = await payload.find({
      collection: 'pages',
      where: { slug: { equals: 'restaurant' } },
      locale,
      depth: 0,
      limit: 1,
    })
    const doc = restaurant.docs[0]
    if (!doc) throw new Error('restaurant page not found')
    const layout = (doc.layout ?? []).map((b) =>
      b.blockType === 'pageHero'
        ? ({ ...b, inlineLinkLabel: null, inlineLinkUrl: null } as typeof b)
        : b,
    )
    await payload.update({
      collection: 'pages',
      id: doc.id,
      data: { layout } as never,
      locale,
    })
    log(`✓ restaurant (${locale}): inlineLink usunięty z hero (layout bez innych zmian)`)
  }

  // ── 3. bar: menuSection → menuGallery ─────────────────────────────────────
  // Nowe media docs per slot (filename = <key>.jpg, jak slotImg w seedzie).
  const uploaded: string[] = []
  async function slotMedia(key: string): Promise<number> {
    const filename = `${key}.jpg`
    const existing = await payload.find({
      collection: 'media',
      where: { filename: { equals: filename } },
      limit: 1,
    })
    if (existing.docs[0]) return existing.docs[0].id as number
    const tmp = path.join(os.tmpdir(), filename)
    await fsp.copyFile(PLACEHOLDER, tmp)
    try {
      const created = await payload.create({
        collection: 'media',
        data: { alt: 'Cocktail Bar — kafelek menu (podmień w /admin)' },
        filePath: tmp,
      })
      uploaded.push(filename)
      return created.id as number
    } finally {
      await fsp.unlink(tmp).catch(() => {})
    }
  }

  const tiles = {
    r1l: await slotMedia('bar-menu-r1-left'),
    r1r: await slotMedia('bar-menu-r1-right'),
    r2l: await slotMedia('bar-menu-r2-left'),
    r2r: await slotMedia('bar-menu-r2-right'),
  }
  const rows: Array<{ layout: string; left: number | null; right: number | null; full: number | null }> = [
    { layout: 'split', left: tiles.r1l, right: tiles.r1r, full: null },
    { layout: 'split', left: tiles.r2l, right: tiles.r2r, full: null },
  ]

  const galleryLoc = {
    pl: { eyebrow: 'Karta baru', heading: 'NASZE MENU', pdfLabel: 'ZOBACZ CAŁE MENU (PDF)' },
    en: { eyebrow: 'The bar menu', heading: 'OUR MENU', pdfLabel: 'SEE THE FULL MENU (PDF)' },
  }

  for (const locale of ['pl', 'en'] as const) {
    const bar = await payload.find({
      collection: 'pages',
      where: { slug: { equals: 'bar-and-cocktails' } },
      locale,
      depth: 0,
      limit: 1,
    })
    const doc = bar.docs[0]
    if (!doc) throw new Error('bar page not found')
    const hadMenuSection = (doc.layout ?? []).some((b) => b.blockType === 'menuSection')
    if (!hadMenuSection) {
      log(`• bar (${locale}): brak bloku menuSection — pomijam (już podmienione?)`)
      continue
    }
    const layout = (doc.layout ?? []).map((b) =>
      b.blockType === 'menuSection'
        ? {
            blockType: 'menuGallery',
            ...galleryLoc[locale],
            aspectRatio: '707/1000',
            rows,
          }
        : b,
    )
    await payload.update({
      collection: 'pages',
      id: doc.id,
      data: { layout } as never,
      locale,
    })
    log(`✓ bar (${locale}): menuSection → menuGallery (hero i bento nietknięte)`)
  }

  if (uploaded.length) {
    log('R2: wgraj pliki (Local API na remote nie zapisuje binariów do R2):')
    for (const f of uploaded) {
      log(`  npx wrangler r2 object put american-dream/${f} --file public/images/placeholders/bar.jpg --remote`)
    }
  }
  log('Gotowe. Teraz: POST /api/revalidate (pages, global_site_settings, slugi).')
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
