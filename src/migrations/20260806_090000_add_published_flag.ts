import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`events\` ADD \`published\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`recurring_series\` ADD \`published\` integer DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`published\`;`)
  await db.run(sql`ALTER TABLE \`recurring_series\` DROP COLUMN \`published\`;`)
}
