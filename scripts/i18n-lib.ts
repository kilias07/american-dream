/**
 * Shared walker for the CMS translation pipeline.
 *
 * Payload marks translatable content with `localized: true`. Rather than
 * hand-listing field paths (which drift the moment a block gains a field), we
 * walk the *config* alongside the *data* and collect every text/textarea/
 * richText value that sits under a localized field. `localized` on a container
 * (a blocks array, a group) covers everything inside it, so the flag is
 * inherited downwards.
 */
import type { Field } from 'payload'

/** Lexical rich-text nodes carry their copy in `text` on leaf nodes. */
function walkLexical(node: unknown, visit: (s: string) => string | undefined): unknown {
  if (Array.isArray(node)) return node.map((n) => walkLexical(n, visit))
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'text' && typeof v === 'string' && v.trim()) {
        out[k] = visit(v) ?? v
      } else {
        out[k] = walkLexical(v, visit)
      }
    }
    return out
  }
  return node
}

type Visit = (s: string) => string | undefined

const TEXT_TYPES = new Set(['text', 'textarea'])

/**
 * Some fields are `text` but hold machine values, not prose. Payload still
 * marks them localized (a link's `url` differs per language), so the field
 * type alone cannot tell them apart — we exclude them by name.
 */
const SKIP_NAMES = new Set([
  'id',
  'blockName',
  'blockType',
  'slug',
  'url',
  'icon',
  'color',
  'anchor',
  'number',
  'value',
  'embed',
  'mapEmbed',
])
// `email` and `phone` are deliberately absent: a field can be *named* email and
// still hold the label "Adres email". The value guard below tells an actual
// address or number from a caption, which is the distinction that matters.
const SKIP_NAME_RE = /(^|[a-z])(url|href|id|slug|icon|color|embed)$/i

/** Values that are plainly not prose, whatever the field is called. */
const SKIP_VALUE_RE =
  /^(https?:\/\/|\/[a-z0-9/-]*$|[0-9a-f]{16,}$|#[0-9a-fA-F]{3,8}$|[+\d][\d\s()-]{6,}$|\S+@\S+\.\S+$)/

function isTranslatable(name: string, value: string): boolean {
  if (SKIP_NAMES.has(name) || SKIP_NAME_RE.test(name)) return false
  const v = value.trim()
  if (!v || SKIP_VALUE_RE.test(v)) return false
  // Embed markup (a YouTube <iframe>, say) is content but not prose.
  if (/^<[a-z]+[\s>]/i.test(v)) return false
  // A bare token with no letters (ordering keys, numerals) carries no meaning.
  return /\p{L}/u.test(v)
}

/**
 * Walk `data` guided by `fields`. Every localized string is passed to `visit`;
 * a returned string replaces it (apply mode), `undefined` leaves it (extract
 * mode). Returns the rebuilt data so one function serves both directions.
 */
export type WalkOpts = {
  /**
   * Drop the `id` of array/block rows that belong to a *localized* container.
   *
   * Payload stores such a container as a separate row set per locale, each row
   * with its own primary key. Feeding it the Polish row's id while writing
   * German makes it insert the German row under the Polish key — a primary-key
   * collision. Dropping the id lets Payload mint a fresh one.
   *
   * Rows of a NON-localized array (a footer link whose `label` alone is
   * localized) must keep their ids: there is one shared row set, and the
   * per-locale values hang off those very ids in a `_locales` side table.
   * Dropping the id there makes Payload recreate the rows and silently discard
   * every other language's values — which is data loss, not a failed write.
   */
  newRowIds?: boolean
}

export function walkFields(
  fields: Field[],
  data: unknown,
  visit: Visit,
  inherited = false,
  opts: WalkOpts = {},
): unknown {
  if (!data || typeof data !== 'object') return data
  const obj = data as Record<string, unknown>
  const out: Record<string, unknown> = { ...obj }

  for (const field of fields) {
    const localized = inherited || ('localized' in field && field.localized === true)

    // Layout-only wrappers hold fields but no data key of their own.
    if (field.type === 'row' || field.type === 'collapsible') {
      Object.assign(out, walkFields(field.fields, out, visit, localized, opts) as object)
      continue
    }
    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        if ('name' in tab && tab.name) {
          out[tab.name] = walkFields(tab.fields, out[tab.name], visit, localized, opts)
        } else {
          Object.assign(out, walkFields(tab.fields, out, visit, localized, opts) as object)
        }
      }
      continue
    }

    if (!('name' in field) || !field.name) continue
    const value = out[field.name]
    if (value == null) continue

    if (TEXT_TYPES.has(field.type)) {
      if (localized && typeof value === 'string' && isTranslatable(field.name, value)) {
        const next = visit(value)
        if (next !== undefined) out[field.name] = next
      }
      continue
    }

    if (field.type === 'richText') {
      if (localized) out[field.name] = walkLexical(value, visit)
      continue
    }

    if (field.type === 'group') {
      out[field.name] = walkFields(field.fields, value, visit, localized, opts)
      continue
    }

    if (field.type === 'array') {
      if (Array.isArray(value)) {
        out[field.name] = value.map((row) =>
          reid(walkFields(field.fields, row, visit, localized, opts), opts, localized),
        )
      }
      continue
    }

    if (field.type === 'blocks') {
      if (Array.isArray(value)) {
        out[field.name] = value.map((row) => {
          const blockType = (row as Record<string, unknown>)?.blockType
          const def = field.blocks.find((b) => b.slug === blockType)
          if (!def) return row
          return reid(walkFields(def.fields, row, visit, localized, opts), opts, localized)
        })
      }
      continue
    }
  }

  return out
}

function reid(row: unknown, opts: WalkOpts, localized: boolean): unknown {
  if (!opts.newRowIds || !localized || !row || typeof row !== 'object') return row
  const { id: _drop, ...rest } = row as Record<string, unknown>
  return rest
}

/** Payload rejects these on write; they are managed by the DB. */
export function stripMeta<T extends Record<string, unknown>>(doc: T): T {
  const { createdAt: _c, updatedAt: _u, ...rest } = doc
  return rest as T
}
