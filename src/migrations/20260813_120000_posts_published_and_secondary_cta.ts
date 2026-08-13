import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

// Uwagi klienta 2026-08 (partia 3) — czyste addycje:
//  1. posts.published — miękki „unpublish" aktualności, ten sam wzorzec co
//     w Events/RecurringSeries (migracja 20260806_090000).
//  2. offerCards.cards / bentoSection.items — drugi, opcjonalny przycisk
//     (etykieta + adres albo plik z Mediów, np. PDF z ofertą).
//
// Tabele bloków są localized po wierszu (kolumna `_locale`), więc lokalizowana
// etykieta trafia do tej samej tabeli — nie ma osobnych `*_locales`.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // 1. Aktualności — checkbox „Opublikowane"
  await db.run(sql`ALTER TABLE \`posts\` ADD \`published\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`_posts_v\` ADD \`version_published\` integer DEFAULT true;`)

  // 2a. offerCards — drugi przycisk
  await db.run(
    sql`ALTER TABLE \`pages_blocks_offer_cards_cards\` ADD \`secondary_cta_label\` text;`,
  )
  await db.run(sql`ALTER TABLE \`pages_blocks_offer_cards_cards\` ADD \`secondary_cta_url\` text;`)
  await db.run(
    sql`ALTER TABLE \`pages_blocks_offer_cards_cards\` ADD \`secondary_cta_file_id\` integer REFERENCES media(id);`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_offer_cards_cards\` ADD \`secondary_cta_label\` text;`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_offer_cards_cards\` ADD \`secondary_cta_url\` text;`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_offer_cards_cards\` ADD \`secondary_cta_file_id\` integer REFERENCES media(id);`,
  )

  // 2b. bentoSection — drugi przycisk
  await db.run(
    sql`ALTER TABLE \`pages_blocks_bento_section_items\` ADD \`secondary_cta_label\` text;`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_bento_section_items\` ADD \`secondary_cta_url\` text;`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_bento_section_items\` ADD \`secondary_cta_file_id\` integer REFERENCES media(id);`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_bento_section_items\` ADD \`secondary_cta_label\` text;`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_bento_section_items\` ADD \`secondary_cta_url\` text;`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_bento_section_items\` ADD \`secondary_cta_file_id\` integer REFERENCES media(id);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`posts\` DROP COLUMN \`published\`;`)
  await db.run(sql`ALTER TABLE \`_posts_v\` DROP COLUMN \`version_published\`;`)

  await db.run(
    sql`ALTER TABLE \`pages_blocks_offer_cards_cards\` DROP COLUMN \`secondary_cta_label\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_offer_cards_cards\` DROP COLUMN \`secondary_cta_url\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_offer_cards_cards\` DROP COLUMN \`secondary_cta_file_id\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_offer_cards_cards\` DROP COLUMN \`secondary_cta_label\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_offer_cards_cards\` DROP COLUMN \`secondary_cta_url\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_offer_cards_cards\` DROP COLUMN \`secondary_cta_file_id\`;`,
  )

  await db.run(
    sql`ALTER TABLE \`pages_blocks_bento_section_items\` DROP COLUMN \`secondary_cta_label\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_bento_section_items\` DROP COLUMN \`secondary_cta_url\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_bento_section_items\` DROP COLUMN \`secondary_cta_file_id\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_bento_section_items\` DROP COLUMN \`secondary_cta_label\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_bento_section_items\` DROP COLUMN \`secondary_cta_url\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_bento_section_items\` DROP COLUMN \`secondary_cta_file_id\`;`,
  )
}
