import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`musicians\` ADD \`hero_image_id\` integer REFERENCES media(id);`)
  await db.run(sql`CREATE INDEX \`musicians_hero_image_idx\` ON \`musicians\` (\`hero_image_id\`);`)
  await db.run(sql`ALTER TABLE \`musicians_locales\` ADD \`role\` text;`)
  await db.run(sql`ALTER TABLE \`musicians_locales\` ADD \`body\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_musicians\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`generate_slug\` integer DEFAULT true,
  	\`slug\` text NOT NULL,
  	\`photo_id\` integer,
  	\`order\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`photo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_musicians\`("id", "name", "generate_slug", "slug", "photo_id", "order", "updated_at", "created_at") SELECT "id", "name", "generate_slug", "slug", "photo_id", "order", "updated_at", "created_at" FROM \`musicians\`;`)
  await db.run(sql`DROP TABLE \`musicians\`;`)
  await db.run(sql`ALTER TABLE \`__new_musicians\` RENAME TO \`musicians\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE UNIQUE INDEX \`musicians_slug_idx\` ON \`musicians\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`musicians_photo_idx\` ON \`musicians\` (\`photo_id\`);`)
  await db.run(sql`CREATE INDEX \`musicians_updated_at_idx\` ON \`musicians\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`musicians_created_at_idx\` ON \`musicians\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`musicians_locales\` DROP COLUMN \`role\`;`)
  await db.run(sql`ALTER TABLE \`musicians_locales\` DROP COLUMN \`body\`;`)
}
