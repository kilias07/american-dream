import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

// Uwaga klienta 2026-07 (ETAP 1, zmiany globalne): tekst spod hero przenosi się
// NA hero — blok `pageHero` dostaje pole `body` (localized textarea).
// `pages.layout` jest lokalizowany na poziomie bloków (tabele bloków mają kolumnę
// `_locale`), więc wystarczy zwykła kolumna `body` w tabeli bloku + jej
// odpowiedniku wersji. Czysta addycja — bez dotykania danych.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_page_hero\` ADD \`body\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_page_hero\` ADD \`body\` text;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_page_hero\` DROP COLUMN \`body\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_page_hero\` DROP COLUMN \`body\`;`)
}
