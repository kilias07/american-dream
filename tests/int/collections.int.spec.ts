import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload

beforeAll(async () => {
  const payloadConfig = await config
  payload = await getPayload({ config: payloadConfig })
  // Warm up the miniflare D1 connection — the first query after globalSetup's
  // migrate can transiently fail on a cold connection. Retry a lightweight read.
  for (let i = 0; i < 5; i++) {
    try {
      await payload.find({ collection: 'users', limit: 1 })
      break
    } catch {
      await new Promise((r) => setTimeout(r, 300))
    }
  }
})

describe('ADC collections', () => {
  it('creates and reads a Musician', async () => {
    const m = await payload.create({
      collection: 'musicians',
      data: { name: 'Test Pianist', slug: 'test-pianist', instrument: 'FORTEPIAN', order: 1 },
      locale: 'pl',
    })
    expect(m.id).toBeDefined()
    const found = await payload.findByID({ collection: 'musicians', id: m.id, locale: 'pl' })
    expect(found.name).toBe('Test Pianist')
  })

  it('creates Menu category + item with price and relationship', async () => {
    const cat = await payload.create({
      collection: 'menu-categories',
      data: { title: 'Test Cigars', menuType: 'cigars', order: 1 },
      locale: 'pl',
    })
    const item = await payload.create({
      collection: 'menu-items',
      data: {
        name: 'Test Cigar',
        price: 42,
        currency: 'zł',
        menuType: 'cigars',
        category: cat.id,
        available: true,
        order: 1,
      },
      locale: 'pl',
    })
    expect(item.price).toBe(42)
    const populated = await payload.findByID({ collection: 'menu-items', id: item.id, depth: 1, locale: 'pl' })
    const category = populated.category
    expect(typeof category === 'object' && category?.title).toBe('Test Cigars')
  })

  it('creates an Event with eventType + performer relationship', async () => {
    const musician = await payload.create({
      collection: 'musicians',
      data: { name: 'Sax Player', slug: 'sax-player', instrument: 'SAKSOFON' },
      locale: 'pl',
    })
    const event = await payload.create({
      collection: 'events',
      data: {
        title: 'Special Recital',
        eventType: 'special',
        leadTitle: 'Recital',
        date: new Date().toISOString(),
        price: 140,
        performers: [{ musician: musician.id, instrument: 'saksofon' }],
        shareEnabled: true,
      },
      locale: 'pl',
    })
    expect(event.eventType).toBe('special')
    expect(event.performers?.length).toBe(1)
  })

  it('creates Rooms, TeamMembers and Testimonials', async () => {
    const room = await payload.create({
      collection: 'rooms',
      data: { name: 'VIP Room', slug: 'vip-room', capacity: 12, equipment: [{ item: 'Projector' }] },
      locale: 'pl',
    })
    expect(room.capacity).toBe(12)

    const member = await payload.create({
      collection: 'team-members',
      data: { name: 'Jan Manager', role: 'MANAGER', email: 'jan@example.com', phone: '+48 500 000 000' },
      locale: 'pl',
    })
    expect(member.email).toBe('jan@example.com')

    const testi = await payload.create({
      collection: 'testimonials',
      data: { author: 'Anna', text: 'Wspaniałe miejsce!', rating: 5, source: 'google' },
      locale: 'pl',
    })
    expect(testi.rating).toBe(5)
  })

  it('allows PUBLIC create of an ArtistApplication (overrideAccess: false)', async () => {
    const app = await payload.create({
      collection: 'artist-applications',
      data: {
        fullName: 'Anonymous Musician',
        email: 'musician@example.com',
        instrument: 'Trumpet',
      },
      overrideAccess: false, // simulate public (unauthenticated) submission
    })
    expect(app.id).toBeDefined()
    expect(app.status).toBe('new')
  })

  it('localizes a Page block layout across pl + en', async () => {
    const page = await payload.create({
      collection: 'pages',
      data: {
        title: 'Test Page',
        slug: 'test-page',
        layout: [
          { blockType: 'aboutIntro', heading: 'Witaj', body: 'Polski tekst' },
        ],
        _status: 'published',
      },
      locale: 'pl',
    })
    await payload.update({
      collection: 'pages',
      id: page.id,
      data: {
        title: 'Test Page EN',
        layout: [{ blockType: 'aboutIntro', heading: 'Welcome', body: 'English text' }],
      },
      locale: 'en',
    })

    const pl = await payload.findByID({ collection: 'pages', id: page.id, locale: 'pl' })
    const en = await payload.findByID({ collection: 'pages', id: page.id, locale: 'en' })
    const plBlock = (pl.layout as Array<{ heading?: string }>)[0]
    const enBlock = (en.layout as Array<{ heading?: string }>)[0]
    expect(plBlock.heading).toBe('Witaj')
    expect(enBlock.heading).toBe('Welcome')
  })
})

describe('ADC globals', () => {
  it('reads the new globals', async () => {
    await payload.updateGlobal({
      slug: 'opening-hours',
      data: { days: [{ day: 'monday', closed: true }] },
    })
    const hours = await payload.findGlobal({ slug: 'opening-hours' })
    expect(hours.days?.[0]?.day).toBe('monday')

    const settings = await payload.updateGlobal({
      slug: 'site-settings',
      data: { siteName: 'American Dream Club' },
    })
    expect(settings.siteName).toBe('American Dream Club')

    const legal = await payload.findGlobal({ slug: 'legal' })
    expect(legal).toBeDefined()
  })
})
