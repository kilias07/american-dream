import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

// Hand-trimmed to the genuine delta (`migrate:create` regenerated the full schema
// because it diffs against a pre-reservations base — see 20260608_133322).
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`reservations\` ADD \`anonymized_at\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`reservations\` DROP COLUMN \`anonymized_at\`;`)
}
