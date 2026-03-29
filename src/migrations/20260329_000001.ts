import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Add new scalar columns to header table
  await db.run(sql`ALTER TABLE \`header\` ADD \`phone\` text;`)
  await db.run(sql`ALTER TABLE \`header\` ADD \`address\` text;`)
  await db.run(sql`ALTER TABLE \`header\` ADD \`logo_id\` integer REFERENCES \`media\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION;`)
  await db.run(sql`ALTER TABLE \`header\` ADD \`cta_button_type\` text DEFAULT 'reference';`)
  await db.run(sql`ALTER TABLE \`header\` ADD \`cta_button_new_tab\` integer;`)
  await db.run(sql`ALTER TABLE \`header\` ADD \`cta_button_url\` text;`)
  await db.run(sql`ALTER TABLE \`header\` ADD \`cta_button_label\` text;`)

  // Create locales table for localized topBarText
  await db.run(sql`
    CREATE TABLE \`header_locales\` (
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      \`top_bar_text\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`header\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`header_locales_locale_parent_id_unique\` ON \`header_locales\` (\`_locale\`, \`_parent_id\`);`)

  // Drop old unified nav items table
  await db.run(sql`DROP TABLE IF EXISTS \`header_nav_items\`;`)

  // Create social links array table
  await db.run(sql`
    CREATE TABLE \`header_social_links\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`platform\` text NOT NULL,
      \`url\` text NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`header\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    );
  `)
  await db.run(sql`CREATE INDEX \`header_social_links_order_idx\` ON \`header_social_links\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`header_social_links_parent_id_idx\` ON \`header_social_links\` (\`_parent_id\`);`)

  // Create left nav items array table
  await db.run(sql`
    CREATE TABLE \`header_nav_items_left\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`link_type\` text DEFAULT 'reference',
      \`link_new_tab\` integer,
      \`link_url\` text,
      \`link_label\` text NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`header\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    );
  `)
  await db.run(sql`CREATE INDEX \`header_nav_items_left_order_idx\` ON \`header_nav_items_left\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`header_nav_items_left_parent_id_idx\` ON \`header_nav_items_left\` (\`_parent_id\`);`)

  // Create right nav items array table
  await db.run(sql`
    CREATE TABLE \`header_nav_items_right\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`link_type\` text DEFAULT 'reference',
      \`link_new_tab\` integer,
      \`link_url\` text,
      \`link_label\` text NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`header\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    );
  `)
  await db.run(sql`CREATE INDEX \`header_nav_items_right_order_idx\` ON \`header_nav_items_right\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`header_nav_items_right_parent_id_idx\` ON \`header_nav_items_right\` (\`_parent_id\`);`)

  // Add media relationship column to header_rels for logo
  await db.run(sql`ALTER TABLE \`header_rels\` ADD \`media_id\` integer REFERENCES \`media\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION;`)
  await db.run(sql`CREATE INDEX \`header_rels_media_id_idx\` ON \`header_rels\` (\`media_id\`);`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Remove media_id from header_rels
  await db.run(sql`DROP INDEX IF EXISTS \`header_rels_media_id_idx\`;`)
  // Note: SQLite doesn't support DROP COLUMN, so we skip reverting header_rels

  // Drop new tables
  await db.run(sql`DROP TABLE IF EXISTS \`header_nav_items_right\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`header_nav_items_left\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`header_social_links\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`header_locales\`;`)

  // Recreate old nav items table
  await db.run(sql`
    CREATE TABLE \`header_nav_items\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`link_type\` text DEFAULT 'reference',
      \`link_new_tab\` integer,
      \`link_url\` text,
      \`link_label\` text NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`header\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    );
  `)
  await db.run(sql`CREATE INDEX \`header_nav_items_order_idx\` ON \`header_nav_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`header_nav_items_parent_id_idx\` ON \`header_nav_items\` (\`_parent_id\`);`)
}
