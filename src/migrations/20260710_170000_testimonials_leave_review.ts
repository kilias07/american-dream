import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

// Uwaga klienta 2026-07 (C8): przycisk „Zostaw opinię" pod komponentem opinii —
// pola leaveReviewLabel (localized; bloki layoutu są per-locale, więc zwykła
// kolumna) + leaveReviewUrl na bloku `testimonials`. Czysta addycja.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_testimonials\` ADD \`leave_review_label\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_testimonials\` ADD \`leave_review_url\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_testimonials\` ADD \`leave_review_label\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_testimonials\` ADD \`leave_review_url\` text;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_testimonials\` DROP COLUMN \`leave_review_label\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_testimonials\` DROP COLUMN \`leave_review_url\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_testimonials\` DROP COLUMN \`leave_review_label\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_testimonials\` DROP COLUMN \`leave_review_url\`;`)
}
