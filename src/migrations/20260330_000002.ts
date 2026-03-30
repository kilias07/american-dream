import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Drop old tables
  await db.run(sql`DROP TABLE IF EXISTS \`footer_nav_items\``)
  await db.run(sql`DROP TABLE IF EXISTS \`footer_locales\``)
  await db.run(sql`DELETE FROM \`footer_rels\` WHERE \`path\` = 'navItems'`)

  // ── footer_nav_columns ────────────────────────────────────────────────────
  await db.run(sql`
    CREATE TABLE \`footer_nav_columns\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`heading\` text NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`footer\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    );
  `)
  await db.run(sql`CREATE INDEX \`footer_nav_columns_order_idx\` ON \`footer_nav_columns\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`footer_nav_columns_parent_id_idx\` ON \`footer_nav_columns\` (\`_parent_id\`);`)

  // ── footer_nav_columns_links ──────────────────────────────────────────────
  await db.run(sql`
    CREATE TABLE \`footer_nav_columns_links\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`label\` text NOT NULL,
      \`url\` text NOT NULL,
      \`new_tab\` integer DEFAULT false,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`footer_nav_columns\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    );
  `)
  await db.run(sql`CREATE INDEX \`footer_nav_columns_links_order_idx\` ON \`footer_nav_columns_links\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`footer_nav_columns_links_parent_id_idx\` ON \`footer_nav_columns_links\` (\`_parent_id\`);`)

  // ── footer_bottom_bar_links ───────────────────────────────────────────────
  await db.run(sql`
    CREATE TABLE \`footer_bottom_bar_links\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`label\` text NOT NULL,
      \`url\` text NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`footer\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    );
  `)
  await db.run(sql`CREATE INDEX \`footer_bottom_bar_links_order_idx\` ON \`footer_bottom_bar_links\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`footer_bottom_bar_links_parent_id_idx\` ON \`footer_bottom_bar_links\` (\`_parent_id\`);`)

  // ── footer_social_links ───────────────────────────────────────────────────
  await db.run(sql`
    CREATE TABLE \`footer_social_links\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`platform\` text NOT NULL,
      \`url\` text NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`footer\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    );
  `)
  await db.run(sql`CREATE INDEX \`footer_social_links_order_idx\` ON \`footer_social_links\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`footer_social_links_parent_id_idx\` ON \`footer_social_links\` (\`_parent_id\`);`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`footer_social_links\``)
  await db.run(sql`DROP TABLE IF EXISTS \`footer_bottom_bar_links\``)
  await db.run(sql`DROP TABLE IF EXISTS \`footer_nav_columns_links\``)
  await db.run(sql`DROP TABLE IF EXISTS \`footer_nav_columns\``)
}
