/**
 * SEO "Title Case" wg audytu: każde słowo zaczyna się wielką literą — także
 * spójniki i przyimki (I, W, Na). Ponieważ kapitalizujemy KAŻDE słowo, zasada
 * „po . ! ? kontynuuj wielką literą” jest spełniona automatycznie.
 *
 * Reguły:
 * - kapitalizujemy tylko pierwszą literę każdego słowa (granica = początek lub
 *   biały znak), reszta tokenu zostaje bez zmian → akronimy (ADC) i nazwy
 *   własne (American Dream Club) są zachowane, a `&`, liczby i myślniki nietknięte;
 * - Unicode-aware (\p{L}) + polskie reguły wielkości liter.
 *
 * Stosowane dla title / description / h1 oraz pól dynamicznych
 * ({Nazwa Wydarzenia}, {Nazwa Aktualności}…). Keywords NIE przechodzą tej
 * normalizacji (frazy pod wyszukiwarkę mogą być małymi literami).
 */
export function toTitleCase(input: string | null | undefined): string {
  if (!input) return ''
  return input.replace(/(^|\s)(\p{L})/gu, (_match, pre: string, ch: string) => {
    return pre + ch.toLocaleUpperCase('pl')
  })
}
