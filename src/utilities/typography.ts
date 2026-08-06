/**
 * Polish typography: single-letter conjunctions/prepositions (a, i, o, u, w, z)
 * must not end a line ("sieroty"/"zawieszki"). CSS cannot express this rule, so
 * we glue the letter to the next word with a non-breaking space at render time.
 * Data in the CMS stays untouched.
 */

// A single letter counts only when it stands alone: preceded by start-of-text,
// whitespace or an opening bracket/quote, and followed by regular spaces.
// JS `\s` includes \u00A0, so a letter directly after an earlier replacement
// still matches (e.g. "a i w Poznaniu" → every letter gets glued).
const ORPHAN_RE = /(?<=^|[\s(„“”"'>])([aiouwzAIOUWZ]) +(?=\S)/g

export function fixOrphans(text: string): string {
  return text.replace(ORPHAN_RE, '$1\u00A0')
}

/**
 * Walk a serialized Lexical editor state and fix orphans in every text node.
 * Returns a copy; safe to call with the object straight from Payload.
 */
export function fixOrphansInRichText<T>(state: T): T {
  if (state == null || typeof state !== 'object') return state

  const walk = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(walk)
    if (node == null || typeof node !== 'object') return node
    const rec = node as Record<string, unknown>
    const out: Record<string, unknown> = { ...rec }
    if (typeof rec.text === 'string') out.text = fixOrphans(rec.text)
    if (Array.isArray(rec.children)) out.children = rec.children.map(walk)
    if (rec.root && typeof rec.root === 'object') out.root = walk(rec.root)
    return out
  }

  return walk(state) as T
}
