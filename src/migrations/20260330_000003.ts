import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Move heading out of footer_nav_columns into a locales table
  await db.run(sql`DROP INDEX IF EXISTS \`footer_nav_columns_order_idx\``)
  await db.run(sql`DROP INDEX IF EXISTS \`footer_nav_columns_parent_id_idx\``)
  await db.run(sql`ALTER TABLE \`footer_nav_columns\` RENAME TO \`footer_nav_columns_old\``)

  await db.run(sql`
    CREATE TABLE \`footer_nav_columns\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`footer\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    );
  `)
  await db.run(sql`CREATE INDEX \`footer_nav_columns_order_idx\` ON \`footer_nav_columns\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`footer_nav_columns_parent_id_idx\` ON \`footer_nav_columns\` (\`_parent_id\`);`)

  // Copy rows (without heading)
  await db.run(sql`INSERT INTO \`footer_nav_columns\` (_order, _parent_id, id) SELECT _order, _parent_id, id FROM \`footer_nav_columns_old\``)
  await db.run(sql`DROP TABLE \`footer_nav_columns_old\``)

  // Locales table for footer_nav_columns (heading localized)
  await db.run(sql`
    CREATE TABLE \`footer_nav_columns_locales\` (
      \`heading\` text NOT NULL,
      \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`footer_nav_columns\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`footer_nav_columns_locales_locale_parent_id_unique\` ON \`footer_nav_columns_locales\` (\`_locale\`, \`_parent_id\`);`)

  // Locales table for footer_nav_columns_links (label localized)
  await db.run(sql`
    CREATE TABLE \`footer_nav_columns_links_locales\` (
      \`label\` text NOT NULL,
      \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`footer_nav_columns_links\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`footer_nav_columns_links_locales_locale_parent_id_unique\` ON \`footer_nav_columns_links_locales\` (\`_locale\`, \`_parent_id\`);`)

  // Remove label from footer_nav_columns_links (move to locales)
  await db.run(sql`DROP INDEX IF EXISTS \`footer_nav_columns_links_order_idx\``)
  await db.run(sql`DROP INDEX IF EXISTS \`footer_nav_columns_links_parent_id_idx\``)
  await db.run(sql`ALTER TABLE \`footer_nav_columns_links\` RENAME TO \`footer_nav_columns_links_old\``)
  await db.run(sql`
    CREATE TABLE \`footer_nav_columns_links\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`url\` text NOT NULL,
      \`new_tab\` integer DEFAULT false,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`footer_nav_columns\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    );
  `)
  await db.run(sql`CREATE INDEX \`footer_nav_columns_links_order_idx\` ON \`footer_nav_columns_links\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`footer_nav_columns_links_parent_id_idx\` ON \`footer_nav_columns_links\` (\`_parent_id\`);`)
  await db.run(sql`INSERT INTO \`footer_nav_columns_links\` (_order, _parent_id, id, url, new_tab) SELECT _order, _parent_id, id, url, new_tab FROM \`footer_nav_columns_links_old\``)
  await db.run(sql`DROP TABLE \`footer_nav_columns_links_old\``)

  // Locales table for footer_bottom_bar_links (label localized)
  await db.run(sql`DROP INDEX IF EXISTS \`footer_bottom_bar_links_order_idx\``)
  await db.run(sql`DROP INDEX IF EXISTS \`footer_bottom_bar_links_parent_id_idx\``)
  await db.run(sql`ALTER TABLE \`footer_bottom_bar_links\` RENAME TO \`footer_bottom_bar_links_old\``)
  await db.run(sql`
    CREATE TABLE \`footer_bottom_bar_links\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`url\` text NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`footer\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    );
  `)
  await db.run(sql`CREATE INDEX \`footer_bottom_bar_links_order_idx\` ON \`footer_bottom_bar_links\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`footer_bottom_bar_links_parent_id_idx\` ON \`footer_bottom_bar_links\` (\`_parent_id\`);`)
  await db.run(sql`INSERT INTO \`footer_bottom_bar_links\` (_order, _parent_id, id, url) SELECT _order, _parent_id, id, url FROM \`footer_bottom_bar_links_old\``)
  await db.run(sql`DROP TABLE \`footer_bottom_bar_links_old\``)

  await db.run(sql`
    CREATE TABLE \`footer_bottom_bar_links_locales\` (
      \`label\` text NOT NULL,
      \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`footer_bottom_bar_links\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`footer_bottom_bar_links_locales_locale_parent_id_unique\` ON \`footer_bottom_bar_links_locales\` (\`_locale\`, \`_parent_id\`);`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`footer_bottom_bar_links_locales\``)
  await db.run(sql`DROP TABLE IF EXISTS \`footer_nav_columns_links_locales\``)
  await db.run(sql`DROP TABLE IF EXISTS \`footer_nav_columns_locales\``)
}
