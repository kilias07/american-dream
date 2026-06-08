import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`events\` ADD \`show_upcoming\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`events_locales\` ADD \`performers_heading\` text;`)
  await db.run(sql`ALTER TABLE \`events_locales\` ADD \`share_label\` text;`)
  await db.run(sql`ALTER TABLE \`events_locales\` ADD \`upcoming_heading\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`show_upcoming\`;`)
  await db.run(sql`ALTER TABLE \`events_locales\` DROP COLUMN \`performers_heading\`;`)
  await db.run(sql`ALTER TABLE \`events_locales\` DROP COLUMN \`share_label\`;`)
  await db.run(sql`ALTER TABLE \`events_locales\` DROP COLUMN \`upcoming_heading\`;`)
}
