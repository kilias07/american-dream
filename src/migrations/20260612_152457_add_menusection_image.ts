import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_menu_section\` ADD \`image_id\` integer REFERENCES media(id);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_menu_section_image_idx\` ON \`pages_blocks_menu_section\` (\`image_id\`);`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_menu_section\` ADD \`image_id\` integer REFERENCES media(id);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_menu_section_image_idx\` ON \`_pages_v_blocks_menu_section\` (\`image_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_menu_section\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`section_tag\` text,
  	\`heading\` text,
  	\`menu_type\` text,
  	\`layout\` text DEFAULT 'pricedList',
  	\`group_by_category\` integer DEFAULT true,
  	\`pdf_download_id\` integer,
  	\`block_name\` text,
  	FOREIGN KEY (\`pdf_download_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_pages_blocks_menu_section\`("_order", "_parent_id", "_path", "_locale", "id", "section_tag", "heading", "menu_type", "layout", "group_by_category", "pdf_download_id", "block_name") SELECT "_order", "_parent_id", "_path", "_locale", "id", "section_tag", "heading", "menu_type", "layout", "group_by_category", "pdf_download_id", "block_name" FROM \`pages_blocks_menu_section\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_menu_section\`;`)
  await db.run(sql`ALTER TABLE \`__new_pages_blocks_menu_section\` RENAME TO \`pages_blocks_menu_section\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`pages_blocks_menu_section_order_idx\` ON \`pages_blocks_menu_section\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_menu_section_parent_id_idx\` ON \`pages_blocks_menu_section\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_menu_section_path_idx\` ON \`pages_blocks_menu_section\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_menu_section_locale_idx\` ON \`pages_blocks_menu_section\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_menu_section_pdf_download_idx\` ON \`pages_blocks_menu_section\` (\`pdf_download_id\`);`)
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_menu_section\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`section_tag\` text,
  	\`heading\` text,
  	\`menu_type\` text,
  	\`layout\` text DEFAULT 'pricedList',
  	\`group_by_category\` integer DEFAULT true,
  	\`pdf_download_id\` integer,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`pdf_download_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new__pages_v_blocks_menu_section\`("_order", "_parent_id", "_path", "_locale", "id", "section_tag", "heading", "menu_type", "layout", "group_by_category", "pdf_download_id", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "_locale", "id", "section_tag", "heading", "menu_type", "layout", "group_by_category", "pdf_download_id", "_uuid", "block_name" FROM \`_pages_v_blocks_menu_section\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_menu_section\`;`)
  await db.run(sql`ALTER TABLE \`__new__pages_v_blocks_menu_section\` RENAME TO \`_pages_v_blocks_menu_section\`;`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_menu_section_order_idx\` ON \`_pages_v_blocks_menu_section\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_menu_section_parent_id_idx\` ON \`_pages_v_blocks_menu_section\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_menu_section_path_idx\` ON \`_pages_v_blocks_menu_section\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_menu_section_locale_idx\` ON \`_pages_v_blocks_menu_section\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_menu_section_pdf_download_idx\` ON \`_pages_v_blocks_menu_section\` (\`pdf_download_id\`);`)
}
