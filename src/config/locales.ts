export const localeDefinitions = [
  { label: 'English', code: 'en' as const },
  { label: 'Polish', code: 'pl' as const },
  { label: 'German', code: 'de' as const },
] as const

export const locales = localeDefinitions.map((l) => l.code)
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'
