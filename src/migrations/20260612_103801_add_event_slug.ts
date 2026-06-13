import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`events\` ADD \`generate_slug\` integer DEFAULT true;`)
  // Added as NULLABLE (not NOT NULL): SQLite cannot add a NOT NULL column to a
  // table that already has rows without a constant default, and a constant
  // default would violate the unique index. Existing rows are backfilled with
  // distinct slugs by scripts/backfill-event-slugs.ts immediately after this
  // migration runs (SQLite treats NULLs as distinct, so the unique index is
  // created safely while legacy rows are still NULL). New rows always get a
  // slug from the slugField() hook (required at the app layer).
  await db.run(sql`ALTER TABLE \`events\` ADD \`slug\` text;`)
  await db.run(sql`CREATE UNIQUE INDEX \`events_slug_idx\` ON \`events\` (\`slug\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`events_slug_idx\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`generate_slug\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`slug\`;`)
}
