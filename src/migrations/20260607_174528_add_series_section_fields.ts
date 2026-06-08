import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`recurring_series\` ADD \`upcoming_count\` numeric DEFAULT 6;`)
  await db.run(sql`ALTER TABLE \`recurring_series\` ADD \`show_other_series\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`recurring_series\` ADD \`show_news\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`recurring_series_locales\` ADD \`upcoming_heading\` text;`)
  await db.run(sql`ALTER TABLE \`recurring_series_locales\` ADD \`see_programme_label\` text;`)
  await db.run(sql`ALTER TABLE \`recurring_series_locales\` ADD \`other_series_heading\` text;`)
  await db.run(sql`ALTER TABLE \`recurring_series_locales\` ADD \`news_heading\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`recurring_series\` DROP COLUMN \`upcoming_count\`;`)
  await db.run(sql`ALTER TABLE \`recurring_series\` DROP COLUMN \`show_other_series\`;`)
  await db.run(sql`ALTER TABLE \`recurring_series\` DROP COLUMN \`show_news\`;`)
  await db.run(sql`ALTER TABLE \`recurring_series_locales\` DROP COLUMN \`upcoming_heading\`;`)
  await db.run(sql`ALTER TABLE \`recurring_series_locales\` DROP COLUMN \`see_programme_label\`;`)
  await db.run(sql`ALTER TABLE \`recurring_series_locales\` DROP COLUMN \`other_series_heading\`;`)
  await db.run(sql`ALTER TABLE \`recurring_series_locales\` DROP COLUMN \`news_heading\`;`)
}
