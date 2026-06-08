import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`events_repeat_days\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`is_recurring\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`repeat_type\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`repeat_until\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`events_repeat_days\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`events_repeat_days_order_idx\` ON \`events_repeat_days\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`events_repeat_days_parent_idx\` ON \`events_repeat_days\` (\`parent_id\`);`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`is_recurring\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`repeat_type\` text;`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`repeat_until\` text;`)
}
