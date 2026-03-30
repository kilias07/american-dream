import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // ── pages_blocks_testimonials ─────────────────────────────────────────────
  await db.run(sql`
    CREATE TABLE \`pages_blocks_testimonials\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`_path\` text NOT NULL,
      \`_locale\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`heading\` text,
      \`review_summary\` text,
      \`block_name\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    )
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_testimonials_order_idx\` ON \`pages_blocks_testimonials\` (\`_order\`)`)
  await db.run(sql`CREATE INDEX \`pages_blocks_testimonials_parent_id_idx\` ON \`pages_blocks_testimonials\` (\`_parent_id\`)`)
  await db.run(sql`CREATE INDEX \`pages_blocks_testimonials_path_idx\` ON \`pages_blocks_testimonials\` (\`_path\`)`)

  // ── pages_blocks_testimonials_items ──────────────────────────────────────
  await db.run(sql`
    CREATE TABLE \`pages_blocks_testimonials_items\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`name\` text,
      \`stars\` numeric DEFAULT 5,
      \`text\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_testimonials\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    )
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_testimonials_items_order_idx\` ON \`pages_blocks_testimonials_items\` (\`_order\`)`)
  await db.run(sql`CREATE INDEX \`pages_blocks_testimonials_items_parent_id_idx\` ON \`pages_blocks_testimonials_items\` (\`_parent_id\`)`)

  // ── _pages_v_blocks_testimonials ──────────────────────────────────────────
  await db.run(sql`
    CREATE TABLE \`_pages_v_blocks_testimonials\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`_path\` text NOT NULL,
      \`_locale\` text NOT NULL,
      \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      \`_uuid\` text,
      \`heading\` text,
      \`review_summary\` text,
      \`block_name\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    )
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_testimonials_order_idx\` ON \`_pages_v_blocks_testimonials\` (\`_order\`)`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_testimonials_parent_id_idx\` ON \`_pages_v_blocks_testimonials\` (\`_parent_id\`)`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_testimonials_path_idx\` ON \`_pages_v_blocks_testimonials\` (\`_path\`)`)

  // ── _pages_v_blocks_testimonials_items ────────────────────────────────────
  await db.run(sql`
    CREATE TABLE \`_pages_v_blocks_testimonials_items\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      \`name\` text,
      \`stars\` numeric DEFAULT 5,
      \`text\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_testimonials\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    )
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_testimonials_items_order_idx\` ON \`_pages_v_blocks_testimonials_items\` (\`_order\`)`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_testimonials_items_parent_id_idx\` ON \`_pages_v_blocks_testimonials_items\` (\`_parent_id\`)`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`_pages_v_blocks_testimonials_items\``)
  await db.run(sql`DROP TABLE IF EXISTS \`_pages_v_blocks_testimonials\``)
  await db.run(sql`DROP TABLE IF EXISTS \`pages_blocks_testimonials_items\``)
  await db.run(sql`DROP TABLE IF EXISTS \`pages_blocks_testimonials\``)
}
