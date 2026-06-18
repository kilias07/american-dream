import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
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
  await db.run(sql`CREATE TABLE \`pages_blocks_special_menu\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`logo_id\` integer,
  	\`heading\` text,
  	\`subtitle\` text,
  	\`body\` text,
  	\`cta_label\` text,
  	\`cta_url\` text,
  	\`notice\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_special_menu_order_idx\` ON \`pages_blocks_special_menu\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_special_menu_parent_id_idx\` ON \`pages_blocks_special_menu\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_special_menu_path_idx\` ON \`pages_blocks_special_menu\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_special_menu_locale_idx\` ON \`pages_blocks_special_menu\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_special_menu_image_idx\` ON \`pages_blocks_special_menu\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_special_menu_logo_idx\` ON \`pages_blocks_special_menu\` (\`logo_id\`);`)
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
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_special_menu\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`logo_id\` integer,
  	\`heading\` text,
  	\`subtitle\` text,
  	\`body\` text,
  	\`cta_label\` text,
  	\`cta_url\` text,
  	\`notice\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_special_menu_order_idx\` ON \`_pages_v_blocks_special_menu\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_special_menu_parent_id_idx\` ON \`_pages_v_blocks_special_menu\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_special_menu_path_idx\` ON \`_pages_v_blocks_special_menu\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_special_menu_locale_idx\` ON \`_pages_v_blocks_special_menu\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_special_menu_image_idx\` ON \`_pages_v_blocks_special_menu\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_special_menu_logo_idx\` ON \`_pages_v_blocks_special_menu\` (\`logo_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`pages_blocks_special_menu_categories_items\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_special_menu_categories\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_special_menu\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_special_menu_categories_items\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_special_menu_categories\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_special_menu\`;`)
}
