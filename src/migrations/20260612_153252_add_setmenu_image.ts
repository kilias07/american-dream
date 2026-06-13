import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_set_menu\` ADD \`image_id\` integer REFERENCES media(id);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_set_menu_image_idx\` ON \`pages_blocks_set_menu\` (\`image_id\`);`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_set_menu\` ADD \`image_id\` integer REFERENCES media(id);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_set_menu_image_idx\` ON \`_pages_v_blocks_set_menu\` (\`image_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_set_menu\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`subtitle\` text,
  	\`date_label\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_pages_blocks_set_menu\`("_order", "_parent_id", "_path", "_locale", "id", "heading", "subtitle", "date_label", "block_name") SELECT "_order", "_parent_id", "_path", "_locale", "id", "heading", "subtitle", "date_label", "block_name" FROM \`pages_blocks_set_menu\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_set_menu\`;`)
  await db.run(sql`ALTER TABLE \`__new_pages_blocks_set_menu\` RENAME TO \`pages_blocks_set_menu\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`pages_blocks_set_menu_order_idx\` ON \`pages_blocks_set_menu\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_set_menu_parent_id_idx\` ON \`pages_blocks_set_menu\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_set_menu_path_idx\` ON \`pages_blocks_set_menu\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_set_menu_locale_idx\` ON \`pages_blocks_set_menu\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_set_menu\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`subtitle\` text,
  	\`date_label\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new__pages_v_blocks_set_menu\`("_order", "_parent_id", "_path", "_locale", "id", "heading", "subtitle", "date_label", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "_locale", "id", "heading", "subtitle", "date_label", "_uuid", "block_name" FROM \`_pages_v_blocks_set_menu\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_set_menu\`;`)
  await db.run(sql`ALTER TABLE \`__new__pages_v_blocks_set_menu\` RENAME TO \`_pages_v_blocks_set_menu\`;`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_set_menu_order_idx\` ON \`_pages_v_blocks_set_menu\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_set_menu_parent_id_idx\` ON \`_pages_v_blocks_set_menu\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_set_menu_path_idx\` ON \`_pages_v_blocks_set_menu\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_set_menu_locale_idx\` ON \`_pages_v_blocks_set_menu\` (\`_locale\`);`)
}
