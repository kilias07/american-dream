import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

// One-off: fill the Chopin event `body` with richly-formatted Lexical content
// so we can see how the event description band renders headings, lists, quotes,
// bold/italic and links.

const t = (text: string, format = 0) => ({
  type: 'text', detail: 0, format, mode: 'normal', style: '', text, version: 1,
})
const para = (children: any[]) => ({
  type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr', textFormat: 0, children,
})
const heading = (tag: string, text: string) => ({
  type: 'heading', tag, format: '', indent: 0, version: 1, direction: 'ltr', children: [t(text)],
})
const list = (listType: 'bullet' | 'number', items: string[]) => ({
  type: 'list', listType, tag: listType === 'bullet' ? 'ul' : 'ol', start: 1,
  format: '', indent: 0, version: 1, direction: 'ltr',
  children: items.map((it, i) => ({
    type: 'listitem', value: i + 1, format: '', indent: 0, version: 1, direction: 'ltr',
    children: [t(it)],
  })),
})
const quote = (text: string) => ({
  type: 'quote', format: '', indent: 0, version: 1, direction: 'ltr', children: [t(text)],
})
const link = (text: string, url: string) => ({
  type: 'link', fields: { linkType: 'custom', url, newTab: true },
  format: '', indent: 0, version: 1, direction: 'ltr', children: [t(text)],
})

const body = {
  root: {
    type: 'root', format: '', indent: 0, version: 1, direction: 'ltr' as const,
    children: [
      para([
        t('Wyjątkowy recital fortepianowy w klubowej atmosferze American Dream Club. '),
        t('Dwa fortepiany, jeden wieczór', 1),
        t(' — muzyka Fryderyka Chopina w nowych, '),
        t('autorskich aranżacjach', 2),
        t(' na cztery ręce.'),
      ]),
      heading('h2', 'Program wieczoru'),
      para([
        t('Usłyszysz najbardziej rozpoznawalne dzieła kompozytora, przeplatane improwizacjami i jazzowymi interpretacjami. To spotkanie klasyki z duchem nowego Jorku — eleganckie, ale swobodne.'),
      ]),
      heading('h3', 'W repertuarze m.in.'),
      list('bullet', [
        'Nokturn es-dur op. 9 nr 2',
        'Walc Des-dur „Minutowy” op. 64 nr 1',
        'Polonez As-dur „Heroiczny” op. 53',
        'Etiuda E-dur op. 10 nr 3 „Tristesse”',
      ]),
      heading('h3', 'Jak wygląda wieczór'),
      list('number', [
        'Otwarcie wieczoru i powitalny koktajl od 19:00',
        'Pierwsza część recitalu z komentarzem prowadzącego',
        'Przerwa z możliwością zamówienia kolacji i deseru',
        'Druga część oraz finał z bisami',
      ]),
      quote('Chopin grany na dwa fortepiany brzmi tak, jakby sala oddychała dwa razy głębiej.'),
      para([
        t('Liczba miejsc ograniczona — rezerwacja stolika obowiązkowa. Szczegółowy program publikujemy w '),
        link('zakładce Program', '/events'),
        t('. Zapraszamy na niezapomniany wieczór z muzyką, kolacją i rozmową.'),
      ]),
    ],
  },
}

const run = async () => {
  const payload = await getPayload({ config: configPromise })
  const found = await payload.find({
    collection: 'events',
    where: { slug: { equals: 'chopin-na-dwa-fortepiany' } },
    limit: 1,
    locale: 'pl',
  })
  if (!found.docs.length) { console.error('event not found'); process.exit(1) }
  const id = found.docs[0].id
  await payload.update({
    collection: 'events',
    id,
    locale: 'pl',
    data: { descriptionHeading: 'Chopin na dwa fortepiany — recital', body: body as never },
  })
  console.log('Updated body for event', id)
  process.exit(0)
}
run().catch((e) => { console.error(e); process.exit(1) })
