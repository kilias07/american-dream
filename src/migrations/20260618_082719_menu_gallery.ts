import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`pages_blocks_menu_gallery_rows\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`left_id\` integer,
  	\`right_id\` integer,
  	FOREIGN KEY (\`left_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`right_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_menu_gallery\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_menu_gallery_rows_order_idx\` ON \`pages_blocks_menu_gallery_rows\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_menu_gallery_rows_parent_id_idx\` ON \`pages_blocks_menu_gallery_rows\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_menu_gallery_rows_locale_idx\` ON \`pages_blocks_menu_gallery_rows\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_menu_gallery_rows_left_idx\` ON \`pages_blocks_menu_gallery_rows\` (\`left_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_menu_gallery_rows_right_idx\` ON \`pages_blocks_menu_gallery_rows\` (\`right_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_menu_gallery\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`eyebrow\` text,
  	\`heading\` text,
  	\`pdf_download_id\` integer,
  	\`pdf_label\` text,
  	\`aspect_ratio\` text DEFAULT '3/4',
  	\`block_name\` text,
  	FOREIGN KEY (\`pdf_download_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_menu_gallery_order_idx\` ON \`pages_blocks_menu_gallery\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_menu_gallery_parent_id_idx\` ON \`pages_blocks_menu_gallery\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_menu_gallery_path_idx\` ON \`pages_blocks_menu_gallery\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_menu_gallery_locale_idx\` ON \`pages_blocks_menu_gallery\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_menu_gallery_pdf_download_idx\` ON \`pages_blocks_menu_gallery\` (\`pdf_download_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_menu_gallery_rows\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`left_id\` integer,
  	\`right_id\` integer,
  	\`_uuid\` text,
  	FOREIGN KEY (\`left_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`right_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_menu_gallery\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_menu_gallery_rows_order_idx\` ON \`_pages_v_blocks_menu_gallery_rows\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_menu_gallery_rows_parent_id_idx\` ON \`_pages_v_blocks_menu_gallery_rows\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_menu_gallery_rows_locale_idx\` ON \`_pages_v_blocks_menu_gallery_rows\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_menu_gallery_rows_left_idx\` ON \`_pages_v_blocks_menu_gallery_rows\` (\`left_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_menu_gallery_rows_right_idx\` ON \`_pages_v_blocks_menu_gallery_rows\` (\`right_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_menu_gallery\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`eyebrow\` text,
  	\`heading\` text,
  	\`pdf_download_id\` integer,
  	\`pdf_label\` text,
  	\`aspect_ratio\` text DEFAULT '3/4',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`pdf_download_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_menu_gallery_order_idx\` ON \`_pages_v_blocks_menu_gallery\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_menu_gallery_parent_id_idx\` ON \`_pages_v_blocks_menu_gallery\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_menu_gallery_path_idx\` ON \`_pages_v_blocks_menu_gallery\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_menu_gallery_locale_idx\` ON \`_pages_v_blocks_menu_gallery\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_menu_gallery_pdf_download_idx\` ON \`_pages_v_blocks_menu_gallery\` (\`pdf_download_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`pages_blocks_menu_gallery_rows\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_menu_gallery\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_menu_gallery_rows\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_menu_gallery\`;`)
}
