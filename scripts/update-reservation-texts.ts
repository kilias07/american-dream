/**
 * Surgically restore the full reservation-page texts (1:1 with the design PDF
 * `project/sites/ADC_Rezerwacje.pdf`). The seed shipped truncated bodies for the
 * three evening phases and the 21+ notice; this patches ONLY those `body` fields
 * on the `rezerwacje` Page, per locale, leaving images / CTAs / everything else
 * untouched.
 *
 * Local:      pnpm run update:reservation-texts
 * Cloudflare: CLOUDFLARE_ENV=<env> NODE_ENV=production PAYLOAD_FORCE_WRANGLER=true \
 *             pnpm run update:reservation-texts        (Node 22)
 *
 * Idempotent — safe to re-run.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

// Phase bodies are in array order: [opening, concert, club].
const PHASES_PL = [
  'Zapraszamy do rozpoczęcia wieczoru w spokojnej, klubowej atmosferze. Rezerwacja stolika jest bezpłatna. Planujesz zostać na koncert? Prosimy o wcześniejszy zakup biletu.',
  'Wyjątkowy wieczór z muzyką na żywo. Subtelne brzmienia fortepianu i saksofonu, elegancka improwizacja oraz klimat klasycznego jazzu tworzą niezapomniane doświadczenie muzyczne.',
  'Po części koncertowej zapraszamy do dalszego spędzenia czasu w naszej przestrzeni. Na gości czeka projekcja koncertu na dużym ekranie oraz starannie przygotowana oferta kuchni i baru. Rezerwacja stolika pozostaje bezpłatna.',
]
const NOTICE_PL =
  'Uprzejmie informujemy, że American Dream Club jest miejscem przeznaczonym wyłącznie dla osób dorosłych powyżej 21. roku życia. Dziękujemy za zrozumienie i zapraszamy serdecznie wszystkich pełnoletnich miłośników dobrej zabawy!'

const PHASES_EN = [
  'Start your evening in a calm, club atmosphere. Booking a table is free of charge. Planning to stay for the concert? Please buy a ticket in advance.',
  'A special evening of live music. The subtle sounds of piano and saxophone, elegant improvisation and the atmosphere of classic jazz create an unforgettable musical experience.',
  'After the concert, stay on and enjoy more time in our space. Guests can watch the concert on a large screen and enjoy a carefully prepared food and bar offering. Booking a table remains free of charge.',
]
const NOTICE_EN =
  'Please note that American Dream Club is a venue reserved exclusively for adults aged 21 and over. Thank you for your understanding — we warmly welcome all of-age lovers of good fun!'

type Block = Record<string, unknown> & { blockType?: string; phases?: Array<Record<string, unknown>> }

function patchLayout(layout: Block[], phases: string[], notice: string): Block[] {
  return layout.map((block) => {
    if (block.blockType === 'eveningPhases' && Array.isArray(block.phases)) {
      return {
        ...block,
        phases: block.phases.map((p, i) => (phases[i] ? { ...p, body: phases[i] } : p)),
      }
    }
    if (block.blockType === 'notice21Plus') {
      return { ...block, body: notice }
    }
    return block
  })
}

async function run() {
  const payload = await getPayload({ config: configPromise })
  const log = (m: string) => payload.logger.info(m)

  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'rezerwacje' } },
    locale: 'pl',
    depth: 0,
    limit: 1,
  })
  const page = docs[0]
  if (!page) throw new Error('rezerwacje page not found')

  await payload.update({
    collection: 'pages',
    id: page.id,
    locale: 'pl',
    data: { layout: patchLayout(page.layout as Block[], PHASES_PL, NOTICE_PL) as unknown as typeof page.layout },
  })
  log('Updated rezerwacje texts (pl)')

  const en = await payload.findByID({ collection: 'pages', id: page.id, locale: 'en', depth: 0 })
  await payload.update({
    collection: 'pages',
    id: page.id,
    locale: 'en',
    data: { layout: patchLayout(en.layout as Block[], PHASES_EN, NOTICE_EN) as unknown as typeof en.layout },
  })
  log('Updated rezerwacje texts (en)')

  log('Done.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
