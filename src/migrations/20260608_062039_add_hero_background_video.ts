import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_hero_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`subtext\` text,
  	\`background_image_id\` integer,
  	\`background_video_id\` integer,
  	\`background_video_url\` text,
  	\`cta_link_type\` text DEFAULT 'reference',
  	\`cta_link_new_tab\` integer,
  	\`cta_link_url\` text,
  	\`cta_link_label\` text,
  	\`cta_icon\` text DEFAULT 'ticket',
  	\`block_name\` text,
  	FOREIGN KEY (\`background_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`background_video_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_pages_blocks_hero_banner\`("_order", "_parent_id", "_path", "_locale", "id", "heading", "subtext", "background_image_id", "background_video_url", "cta_link_type", "cta_link_new_tab", "cta_link_url", "cta_link_label", "cta_icon", "block_name") SELECT "_order", "_parent_id", "_path", "_locale", "id", "heading", "subtext", "background_image_id", "background_video_url", "cta_link_type", "cta_link_new_tab", "cta_link_url", "cta_link_label", "cta_icon", "block_name" FROM \`pages_blocks_hero_banner\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_hero_banner\`;`)
  await db.run(sql`ALTER TABLE \`__new_pages_blocks_hero_banner\` RENAME TO \`pages_blocks_hero_banner\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_banner_order_idx\` ON \`pages_blocks_hero_banner\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_banner_parent_id_idx\` ON \`pages_blocks_hero_banner\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_banner_path_idx\` ON \`pages_blocks_hero_banner\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_banner_locale_idx\` ON \`pages_blocks_hero_banner\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_banner_background_image_idx\` ON \`pages_blocks_hero_banner\` (\`background_image_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_banner_background_video_idx\` ON \`pages_blocks_hero_banner\` (\`background_video_id\`);`)
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_hero_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`subtext\` text,
  	\`background_image_id\` integer,
  	\`background_video_id\` integer,
  	\`background_video_url\` text,
  	\`cta_link_type\` text DEFAULT 'reference',
  	\`cta_link_new_tab\` integer,
  	\`cta_link_url\` text,
  	\`cta_link_label\` text,
  	\`cta_icon\` text DEFAULT 'ticket',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`background_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`background_video_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new__pages_v_blocks_hero_banner\`("_order", "_parent_id", "_path", "_locale", "id", "heading", "subtext", "background_image_id", "background_video_url", "cta_link_type", "cta_link_new_tab", "cta_link_url", "cta_link_label", "cta_icon", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "_locale", "id", "heading", "subtext", "background_image_id", "background_video_url", "cta_link_type", "cta_link_new_tab", "cta_link_url", "cta_link_label", "cta_icon", "_uuid", "block_name" FROM \`_pages_v_blocks_hero_banner\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_hero_banner\`;`)
  await db.run(sql`ALTER TABLE \`__new__pages_v_blocks_hero_banner\` RENAME TO \`_pages_v_blocks_hero_banner\`;`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_banner_order_idx\` ON \`_pages_v_blocks_hero_banner\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_banner_parent_id_idx\` ON \`_pages_v_blocks_hero_banner\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_banner_path_idx\` ON \`_pages_v_blocks_hero_banner\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_banner_locale_idx\` ON \`_pages_v_blocks_hero_banner\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_banner_background_image_idx\` ON \`_pages_v_blocks_hero_banner\` (\`background_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_banner_background_video_idx\` ON \`_pages_v_blocks_hero_banner\` (\`background_video_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_hero_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`subtext\` text,
  	\`background_image_id\` integer,
  	\`background_video_url\` text DEFAULT '/videos/hero-banner.mp4',
  	\`cta_link_type\` text DEFAULT 'reference',
  	\`cta_link_new_tab\` integer,
  	\`cta_link_url\` text,
  	\`cta_link_label\` text,
  	\`cta_icon\` text DEFAULT 'ticket',
  	\`block_name\` text,
  	FOREIGN KEY (\`background_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_pages_blocks_hero_banner\`("_order", "_parent_id", "_path", "_locale", "id", "heading", "subtext", "background_image_id", "background_video_url", "cta_link_type", "cta_link_new_tab", "cta_link_url", "cta_link_label", "cta_icon", "block_name") SELECT "_order", "_parent_id", "_path", "_locale", "id", "heading", "subtext", "background_image_id", "background_video_url", "cta_link_type", "cta_link_new_tab", "cta_link_url", "cta_link_label", "cta_icon", "block_name" FROM \`pages_blocks_hero_banner\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_hero_banner\`;`)
  await db.run(sql`ALTER TABLE \`__new_pages_blocks_hero_banner\` RENAME TO \`pages_blocks_hero_banner\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_banner_order_idx\` ON \`pages_blocks_hero_banner\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_banner_parent_id_idx\` ON \`pages_blocks_hero_banner\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_banner_path_idx\` ON \`pages_blocks_hero_banner\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_banner_locale_idx\` ON \`pages_blocks_hero_banner\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_banner_background_image_idx\` ON \`pages_blocks_hero_banner\` (\`background_image_id\`);`)
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_hero_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`subtext\` text,
  	\`background_image_id\` integer,
  	\`background_video_url\` text DEFAULT '/videos/hero-banner.mp4',
  	\`cta_link_type\` text DEFAULT 'reference',
  	\`cta_link_new_tab\` integer,
  	\`cta_link_url\` text,
  	\`cta_link_label\` text,
  	\`cta_icon\` text DEFAULT 'ticket',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`background_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new__pages_v_blocks_hero_banner\`("_order", "_parent_id", "_path", "_locale", "id", "heading", "subtext", "background_image_id", "background_video_url", "cta_link_type", "cta_link_new_tab", "cta_link_url", "cta_link_label", "cta_icon", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "_locale", "id", "heading", "subtext", "background_image_id", "background_video_url", "cta_link_type", "cta_link_new_tab", "cta_link_url", "cta_link_label", "cta_icon", "_uuid", "block_name" FROM \`_pages_v_blocks_hero_banner\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_hero_banner\`;`)
  await db.run(sql`ALTER TABLE \`__new__pages_v_blocks_hero_banner\` RENAME TO \`_pages_v_blocks_hero_banner\`;`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_banner_order_idx\` ON \`_pages_v_blocks_hero_banner\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_banner_parent_id_idx\` ON \`_pages_v_blocks_hero_banner\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_banner_path_idx\` ON \`_pages_v_blocks_hero_banner\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_banner_locale_idx\` ON \`_pages_v_blocks_hero_banner\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_banner_background_image_idx\` ON \`_pages_v_blocks_hero_banner\` (\`background_image_id\`);`)
}
