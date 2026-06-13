'use client'
import { useEffect } from 'react'

/**
 * Root layout hardcodes `<html lang="pl">`. The EN tree renders this so EN pages
 * report `lang="en"` to crawlers / assistive tech without moving the `<html>`
 * element out of the shared root layout.
 */
export function SetHtmlLang({ lang }: { lang: string }): null {
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  return null
}
