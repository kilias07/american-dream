import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`pages_blocks_menu_image_images\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`caption\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_menu_image\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_menu_image_images_order_idx\` ON \`pages_blocks_menu_image_images\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_menu_image_images_parent_id_idx\` ON \`pages_blocks_menu_image_images\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_menu_image_images_locale_idx\` ON \`pages_blocks_menu_image_images\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_menu_image_images_image_idx\` ON \`pages_blocks_menu_image_images\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_menu_image\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`eyebrow\` text,
  	\`heading\` text,
  	\`enable_lightbox\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_menu_image_order_idx\` ON \`pages_blocks_menu_image\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_menu_image_parent_id_idx\` ON \`pages_blocks_menu_image\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_menu_image_path_idx\` ON \`pages_blocks_menu_image\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_menu_image_locale_idx\` ON \`pages_blocks_menu_image\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_menu_image_images\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`caption\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_menu_image\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_menu_image_images_order_idx\` ON \`_pages_v_blocks_menu_image_images\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_menu_image_images_parent_id_idx\` ON \`_pages_v_blocks_menu_image_images\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_menu_image_images_locale_idx\` ON \`_pages_v_blocks_menu_image_images\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_menu_image_images_image_idx\` ON \`_pages_v_blocks_menu_image_images\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_menu_image\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`eyebrow\` text,
  	\`heading\` text,
  	\`enable_lightbox\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_menu_image_order_idx\` ON \`_pages_v_blocks_menu_image\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_menu_image_parent_id_idx\` ON \`_pages_v_blocks_menu_image\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_menu_image_path_idx\` ON \`_pages_v_blocks_menu_image\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_menu_image_locale_idx\` ON \`_pages_v_blocks_menu_image\` (\`_locale\`);`)
  await db.run(sql`ALTER TABLE \`pages_blocks_image_gallery_images\` ADD \`size\` text DEFAULT 'normal';`)
  await db.run(sql`ALTER TABLE \`pages_blocks_image_gallery\` ADD \`columns\` text DEFAULT '3';`)
  await db.run(sql`ALTER TABLE \`pages_blocks_image_gallery\` ADD \`enable_lightbox\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_image_gallery_images\` ADD \`size\` text DEFAULT 'normal';`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_image_gallery\` ADD \`columns\` text DEFAULT '3';`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_image_gallery\` ADD \`enable_lightbox\` integer DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`pages_blocks_menu_image_images\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_menu_image\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_menu_image_images\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_menu_image\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_image_gallery_images\` DROP COLUMN \`size\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_image_gallery\` DROP COLUMN \`columns\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_image_gallery\` DROP COLUMN \`enable_lightbox\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_image_gallery_images\` DROP COLUMN \`size\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_image_gallery\` DROP COLUMN \`columns\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_image_gallery\` DROP COLUMN \`enable_lightbox\`;`)
}
