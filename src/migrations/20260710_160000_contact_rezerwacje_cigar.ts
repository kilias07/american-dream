import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

// Uwagi klienta 2026-07 (ETAP 1, GRUPA 3) — czyste addycje:
//  1. eveningPhases.phases.primaryCtaIcon (select reserve|ticket) — rozróżnienie
//     ikony rezerwacji od biletu na banerach /rezerwacje.
//  2. menuImage.pdfDownload + pdfLabel — przycisk „Pobierz PDF" na Cigar Room
//     (wzór 1:1 z menuGallery).
//  3. pages.requireAgeGate — popup 18+ przy wejściu (Cigar Room).
//  4. ui-labels: grupa ageGate (teksty popupu, localized).
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // 1. eveningPhases — ikona głównego CTA per faza
  await db.run(
    sql`ALTER TABLE \`pages_blocks_evening_phases_phases\` ADD \`primary_cta_icon\` text DEFAULT 'reserve';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_evening_phases_phases\` ADD \`primary_cta_icon\` text DEFAULT 'reserve';`,
  )

  // 2. menuImage — PDF do pobrania (kolumny jak w menu_gallery)
  await db.run(
    sql`ALTER TABLE \`pages_blocks_menu_image\` ADD \`pdf_download_id\` integer REFERENCES media(id);`,
  )
  await db.run(sql`ALTER TABLE \`pages_blocks_menu_image\` ADD \`pdf_label\` text;`)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_menu_image_pdf_download_idx\` ON \`pages_blocks_menu_image\` (\`pdf_download_id\`);`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_menu_image\` ADD \`pdf_download_id\` integer REFERENCES media(id);`,
  )
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_menu_image\` ADD \`pdf_label\` text;`)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_menu_image_pdf_download_idx\` ON \`_pages_v_blocks_menu_image\` (\`pdf_download_id\`);`,
  )

  // 3. pages — bramka wiekowa 18+
  await db.run(sql`ALTER TABLE \`pages\` ADD \`require_age_gate\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`_pages_v\` ADD \`version_require_age_gate\` integer DEFAULT false;`)

  // 4. ui-labels — teksty popupu 18+ (grupa ageGate, pola localized)
  await db.run(sql`ALTER TABLE \`ui_labels_locales\` ADD \`age_gate_title\` text;`)
  await db.run(sql`ALTER TABLE \`ui_labels_locales\` ADD \`age_gate_body\` text;`)
  await db.run(sql`ALTER TABLE \`ui_labels_locales\` ADD \`age_gate_confirm_label\` text;`)
  await db.run(sql`ALTER TABLE \`ui_labels_locales\` ADD \`age_gate_decline_label\` text;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_evening_phases_phases\` DROP COLUMN \`primary_cta_icon\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_evening_phases_phases\` DROP COLUMN \`primary_cta_icon\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`pages_blocks_menu_image_pdf_download_idx\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_menu_image\` DROP COLUMN \`pdf_download_id\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_menu_image\` DROP COLUMN \`pdf_label\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`_pages_v_blocks_menu_image_pdf_download_idx\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_menu_image\` DROP COLUMN \`pdf_download_id\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_menu_image\` DROP COLUMN \`pdf_label\`;`)
  await db.run(sql`ALTER TABLE \`pages\` DROP COLUMN \`require_age_gate\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v\` DROP COLUMN \`version_require_age_gate\`;`)
  await db.run(sql`ALTER TABLE \`ui_labels_locales\` DROP COLUMN \`age_gate_title\`;`)
  await db.run(sql`ALTER TABLE \`ui_labels_locales\` DROP COLUMN \`age_gate_body\`;`)
  await db.run(sql`ALTER TABLE \`ui_labels_locales\` DROP COLUMN \`age_gate_confirm_label\`;`)
  await db.run(sql`ALTER TABLE \`ui_labels_locales\` DROP COLUMN \`age_gate_decline_label\`;`)
}
