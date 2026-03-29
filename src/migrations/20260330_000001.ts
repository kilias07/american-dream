import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // ── BentoSection block ────────────────────────────────────────────────────
  // Localized fields are stored directly on the block row (one row per locale),
  // matching how Payload's D1 SQLite adapter handles localized block fields.

  // Block table (all fields including localized ones stored per-locale row)
  await db.run(sql`
    CREATE TABLE \`pages_blocks_bento_section\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`_path\` text NOT NULL,
      \`_locale\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`subheading\` text,
      \`heading\` text,
      \`description\` text,
      \`block_name\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_bento_section_order_idx\` ON \`pages_blocks_bento_section\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_bento_section_parent_id_idx\` ON \`pages_blocks_bento_section\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_bento_section_path_idx\` ON \`pages_blocks_bento_section\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_bento_section_locale_idx\` ON \`pages_blocks_bento_section\` (\`_locale\`);`)

  // Items array (localized label, title, cta_label stored directly on item row)
  await db.run(sql`
    CREATE TABLE \`pages_blocks_bento_section_items\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`image_id\` integer REFERENCES \`media\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION,
      \`col_span\` text DEFAULT 'half',
      \`cta_url\` text,
      \`label\` text,
      \`title\` text NOT NULL,
      \`cta_label\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_bento_section\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_bento_section_items_order_idx\` ON \`pages_blocks_bento_section_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_bento_section_items_parent_id_idx\` ON \`pages_blocks_bento_section_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_bento_section_items_image_idx\` ON \`pages_blocks_bento_section_items\` (\`image_id\`);`)

  // ── Versioned tables ───────────────────────────────────────────────────────

  await db.run(sql`
    CREATE TABLE \`_pages_v_blocks_bento_section\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`_path\` text NOT NULL,
      \`_locale\` text NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`subheading\` text,
      \`heading\` text,
      \`description\` text,
      \`_uuid\` text,
      \`block_name\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_bento_section_order_idx\` ON \`_pages_v_blocks_bento_section\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_bento_section_parent_id_idx\` ON \`_pages_v_blocks_bento_section\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_bento_section_path_idx\` ON \`_pages_v_blocks_bento_section\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_bento_section_locale_idx\` ON \`_pages_v_blocks_bento_section\` (\`_locale\`);`)

  await db.run(sql`
    CREATE TABLE \`_pages_v_blocks_bento_section_items\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`image_id\` integer REFERENCES \`media\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION,
      \`col_span\` text DEFAULT 'half',
      \`cta_url\` text,
      \`label\` text,
      \`title\` text,
      \`cta_label\` text,
      \`_uuid\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_bento_section\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_bento_section_items_order_idx\` ON \`_pages_v_blocks_bento_section_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_bento_section_items_parent_id_idx\` ON \`_pages_v_blocks_bento_section_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_bento_section_items_image_idx\` ON \`_pages_v_blocks_bento_section_items\` (\`image_id\`);`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`_pages_v_blocks_bento_section_items\``)
  await db.run(sql`DROP TABLE IF EXISTS \`_pages_v_blocks_bento_section\``)
  await db.run(sql`DROP TABLE IF EXISTS \`pages_blocks_bento_section_items\``)
  await db.run(sql`DROP TABLE IF EXISTS \`pages_blocks_bento_section\``)
}
