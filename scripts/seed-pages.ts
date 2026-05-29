/**
 * Seed script — creates initial pages in EN and PL.
 * Run with: pnpm payload run scripts/seed-pages.ts
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

const pages = [
  {
    slug: 'home',
    en: 'Home',
    pl: 'Strona główna',
  },
  {
    slug: 'restauracja',
    en: 'Restaurant',
    pl: 'Restauracja',
  },
  {
    slug: 'program',
    en: 'Programme',
    pl: 'Program',
  },
  {
    slug: 'imprezy-okolicznosciowe',
    en: 'Special Events',
    pl: 'Imprezy Okolicznościowe',
  },
  {
    slug: 'kontakt',
    en: 'Contact',
    pl: 'Kontakt',
  },
]

async function seed() {
  const payload = await getPayload({ config: configPromise })

  for (const page of pages) {
    // Check if already exists
    const existing = await payload.find({
      collection: 'pages',
      where: { slug: { equals: page.slug } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      console.log(`⏭  Skipping "${page.slug}" — already exists`)
      continue
    }

    await payload.create({
      collection: 'pages',
      locale: 'en',
      data: {
        title: page.en,
        slug: page.slug,
        layout: [],
        _status: 'published',
      },
    })

    // Update with PL locale
    const created = await payload.find({
      collection: 'pages',
      where: { slug: { equals: page.slug } },
      limit: 1,
    })

    if (created.docs[0]) {
      await payload.update({
        collection: 'pages',
        id: created.docs[0].id,
        locale: 'pl',
        data: {
          title: page.pl,
          layout: [],
          _status: 'published',
        },
      })
    }

    console.log(`✅ Created "${page.slug}" (EN: ${page.en}, PL: ${page.pl})`)
  }

  console.log('\nDone! Seed complete.')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
