import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Add ctaIcon column to hero banner block tables
  await db.run(sql`ALTER TABLE pages_blocks_hero_banner ADD COLUMN cta_icon text DEFAULT 'ticket'`)
  await db.run(sql`ALTER TABLE _pages_v_blocks_hero_banner ADD COLUMN cta_icon text DEFAULT 'ticket'`)

  // Rename old link_* to keep for backwards compat, add cta_link_* aliases
  // (Payload will now use ctaLink group → cta_link_* columns)
  await db.run(sql`ALTER TABLE pages_blocks_hero_banner ADD COLUMN cta_link_type text DEFAULT 'reference'`)
  await db.run(sql`ALTER TABLE pages_blocks_hero_banner ADD COLUMN cta_link_new_tab integer`)
  await db.run(sql`ALTER TABLE pages_blocks_hero_banner ADD COLUMN cta_link_url text`)
  await db.run(sql`ALTER TABLE pages_blocks_hero_banner ADD COLUMN cta_link_label text`)
  await db.run(sql`ALTER TABLE _pages_v_blocks_hero_banner ADD COLUMN cta_link_type text DEFAULT 'reference'`)
  await db.run(sql`ALTER TABLE _pages_v_blocks_hero_banner ADD COLUMN cta_link_new_tab integer`)
  await db.run(sql`ALTER TABLE _pages_v_blocks_hero_banner ADD COLUMN cta_link_url text`)
  await db.run(sql`ALTER TABLE _pages_v_blocks_hero_banner ADD COLUMN cta_link_label text`)

  // Create secondary links table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS pages_blocks_hero_banner_secondary_links (
      _order integer NOT NULL,
      _parent_id text NOT NULL,
      id text PRIMARY KEY NOT NULL,
      link_type text DEFAULT 'reference',
      link_new_tab integer,
      link_url text,
      link_label text,
      icon text DEFAULT 'none',
      FOREIGN KEY (_parent_id) REFERENCES pages_blocks_hero_banner(id) ON UPDATE no action ON DELETE cascade
    )
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS pages_blocks_hero_banner_secondary_links_order_idx ON pages_blocks_hero_banner_secondary_links (_order)`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS pages_blocks_hero_banner_secondary_links_parent_idx ON pages_blocks_hero_banner_secondary_links (_parent_id)`)

  // Versions table secondary links
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS _pages_v_blocks_hero_banner_secondary_links (
      _order integer NOT NULL,
      _parent_id text NOT NULL,
      id text PRIMARY KEY NOT NULL,
      link_type text DEFAULT 'reference',
      link_new_tab integer,
      link_url text,
      link_label text,
      icon text DEFAULT 'none',
      FOREIGN KEY (_parent_id) REFERENCES _pages_v_blocks_hero_banner(id) ON UPDATE no action ON DELETE cascade
    )
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS _pages_v_blocks_hero_banner_secondary_links_order_idx ON _pages_v_blocks_hero_banner_secondary_links (_order)`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS _pages_v_blocks_hero_banner_secondary_links_parent_idx ON _pages_v_blocks_hero_banner_secondary_links (_parent_id)`)

  // Add rels for secondary links
  await db.run(sql`ALTER TABLE pages_blocks_hero_banner_secondary_links ADD COLUMN link_reference_id integer`)
  await db.run(sql`ALTER TABLE _pages_v_blocks_hero_banner_secondary_links ADD COLUMN link_reference_id integer`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS pages_blocks_hero_banner_secondary_links`)
  await db.run(sql`DROP TABLE IF EXISTS _pages_v_blocks_hero_banner_secondary_links`)
}
