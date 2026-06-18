import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_set_menu_menus\` ADD \`image_id\` integer REFERENCES media(id);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_set_menu_menus_image_idx\` ON \`pages_blocks_set_menu_menus\` (\`image_id\`);`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_set_menu_menus\` ADD \`image_id\` integer REFERENCES media(id);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_set_menu_menus_image_idx\` ON \`_pages_v_blocks_set_menu_menus\` (\`image_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_set_menu_menus\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`price\` numeric,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_set_menu\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_pages_blocks_set_menu_menus\`("_order", "_parent_id", "_locale", "id", "name", "price") SELECT "_order", "_parent_id", "_locale", "id", "name", "price" FROM \`pages_blocks_set_menu_menus\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_set_menu_menus\`;`)
  await db.run(sql`ALTER TABLE \`__new_pages_blocks_set_menu_menus\` RENAME TO \`pages_blocks_set_menu_menus\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`pages_blocks_set_menu_menus_order_idx\` ON \`pages_blocks_set_menu_menus\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_set_menu_menus_parent_id_idx\` ON \`pages_blocks_set_menu_menus\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_set_menu_menus_locale_idx\` ON \`pages_blocks_set_menu_menus\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_set_menu_menus\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`price\` numeric,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_set_menu\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new__pages_v_blocks_set_menu_menus\`("_order", "_parent_id", "_locale", "id", "name", "price", "_uuid") SELECT "_order", "_parent_id", "_locale", "id", "name", "price", "_uuid" FROM \`_pages_v_blocks_set_menu_menus\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_set_menu_menus\`;`)
  await db.run(sql`ALTER TABLE \`__new__pages_v_blocks_set_menu_menus\` RENAME TO \`_pages_v_blocks_set_menu_menus\`;`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_set_menu_menus_order_idx\` ON \`_pages_v_blocks_set_menu_menus\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_set_menu_menus_parent_id_idx\` ON \`_pages_v_blocks_set_menu_menus\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_set_menu_menus_locale_idx\` ON \`_pages_v_blocks_set_menu_menus\` (\`_locale\`);`)
}
