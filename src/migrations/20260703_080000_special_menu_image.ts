import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

/**
 * specialMenu: the inline priced dish list (categories/items + VAT notice) is
 * replaced by one client-uploaded menu graphic (`menuImage`), matching the
 * à-la-carte tiles and the cigar menu. Hand-written — migrate:create hangs on
 * mixed drop+add diffs.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_special_menu\` ADD \`menu_image_id\` integer REFERENCES media(id);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_special_menu_menu_image_idx\` ON \`pages_blocks_special_menu\` (\`menu_image_id\`);`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_special_menu\` ADD \`menu_image_id\` integer REFERENCES media(id);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_special_menu_menu_image_idx\` ON \`_pages_v_blocks_special_menu\` (\`menu_image_id\`);`)
  await db.run(sql`DROP TABLE \`pages_blocks_special_menu_categories_items\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_special_menu_categories\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_special_menu_categories_items\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_special_menu_categories\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_special_menu\` DROP COLUMN \`notice\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_special_menu\` DROP COLUMN \`notice\`;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`pages_blocks_special_menu_menu_image_idx\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_special_menu\` DROP COLUMN \`menu_image_id\`;`)
  await db.run(sql`DROP INDEX \`_pages_v_blocks_special_menu_menu_image_idx\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_special_menu\` DROP COLUMN \`menu_image_id\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_special_menu\` ADD \`notice\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_special_menu\` ADD \`notice\` text;`)
  await db.run(sql`CREATE TABLE \`pages_blocks_special_menu_categories\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`column\` text DEFAULT 'left',
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_special_menu\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_special_menu_categories_order_idx\` ON \`pages_blocks_special_menu_categories\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_special_menu_categories_parent_id_idx\` ON \`pages_blocks_special_menu_categories\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_special_menu_categories_locale_idx\` ON \`pages_blocks_special_menu_categories\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_special_menu_categories_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`price\` numeric,
  	\`ingredients\` text,
  	\`dietary\` text DEFAULT 'none',
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_special_menu_categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_special_menu_categories_items_order_idx\` ON \`pages_blocks_special_menu_categories_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_special_menu_categories_items_parent_id_idx\` ON \`pages_blocks_special_menu_categories_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_special_menu_categories_items_locale_idx\` ON \`pages_blocks_special_menu_categories_items\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_special_menu_categories\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`column\` text DEFAULT 'left',
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_special_menu\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_special_menu_categories_order_idx\` ON \`_pages_v_blocks_special_menu_categories\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_special_menu_categories_parent_id_idx\` ON \`_pages_v_blocks_special_menu_categories\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_special_menu_categories_locale_idx\` ON \`_pages_v_blocks_special_menu_categories\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_special_menu_categories_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`price\` numeric,
  	\`ingredients\` text,
  	\`dietary\` text DEFAULT 'none',
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_special_menu_categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_special_menu_categories_items_order_idx\` ON \`_pages_v_blocks_special_menu_categories_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_special_menu_categories_items_parent_id_idx\` ON \`_pages_v_blocks_special_menu_categories_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_special_menu_categories_items_locale_idx\` ON \`_pages_v_blocks_special_menu_categories_items\` (\`_locale\`);`)
}
