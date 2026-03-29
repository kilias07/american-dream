import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // ── Events collection ──────────────────────────────────────────────────

  // Main events table (non-localized scalar fields)
  await db.run(sql`
    CREATE TABLE \`events\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`image_id\` integer REFERENCES \`media\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION,
      \`date\` text NOT NULL,
      \`end_time\` text,
      \`price\` numeric,
      \`ticket_url\` text,
      \`featured\` integer DEFAULT false,
      \`is_recurring\` integer DEFAULT false,
      \`repeat_type\` text,
      \`repeat_until\` text,
      \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
    );
  `)
  await db.run(sql`CREATE INDEX \`events_image_idx\` ON \`events\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`events_date_idx\` ON \`events\` (\`date\`);`)
  await db.run(sql`CREATE INDEX \`events_updated_at_idx\` ON \`events\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`events_created_at_idx\` ON \`events\` (\`created_at\`);`)

  // Localized fields (title, description)
  await db.run(sql`
    CREATE TABLE \`events_locales\` (
      \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      \`title\` text NOT NULL,
      \`description\` text,
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`events\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`events_locales_locale_parent_id_unique\` ON \`events_locales\` (\`_locale\`, \`_parent_id\`);`)

  // HasMany select — repeatDays
  await db.run(sql`
    CREATE TABLE \`events_repeat_days\` (
      \`order\` integer NOT NULL,
      \`parent_id\` integer NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`value\` text,
      FOREIGN KEY (\`parent_id\`) REFERENCES \`events\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    );
  `)
  await db.run(sql`CREATE INDEX \`events_repeat_days_order_idx\` ON \`events_repeat_days\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`events_repeat_days_parent_idx\` ON \`events_repeat_days\` (\`parent_id\`);`)

  // payload_locked_documents_rels — register events collection
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`events_id\` integer REFERENCES \`events\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_events_id_idx\` ON \`payload_locked_documents_rels\` (\`events_id\`);`)

  // ── EventsCalendar block ───────────────────────────────────────────────

  // Block table for pages layout (localized fields stored directly on row; one row per locale)
  await db.run(sql`
    CREATE TABLE \`pages_blocks_events_calendar\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`_path\` text NOT NULL,
      \`_locale\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`variant\` text DEFAULT 'teaser',
      \`color_scheme\` text DEFAULT 'gold',
      \`heading\` text,
      \`cta_label\` text,
      \`cta_url\` text,
      \`events_source\` text DEFAULT 'auto',
      \`auto_count\` numeric DEFAULT 6,
      \`block_name\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_events_calendar_order_idx\` ON \`pages_blocks_events_calendar\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_events_calendar_parent_id_idx\` ON \`pages_blocks_events_calendar\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_events_calendar_path_idx\` ON \`pages_blocks_events_calendar\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_events_calendar_locale_idx\` ON \`pages_blocks_events_calendar\` (\`_locale\`);`)

  // Add events_id to pages_rels for manualEvents relationship
  await db.run(sql`ALTER TABLE \`pages_rels\` ADD \`events_id\` integer REFERENCES \`events\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION;`)
  await db.run(sql`CREATE INDEX \`pages_rels_events_id_idx\` ON \`pages_rels\` (\`events_id\`);`)

  // Versioned block table (localized fields stored directly on row)
  await db.run(sql`
    CREATE TABLE \`_pages_v_blocks_events_calendar\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`_path\` text NOT NULL,
      \`_locale\` text NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`variant\` text DEFAULT 'teaser',
      \`color_scheme\` text DEFAULT 'gold',
      \`heading\` text,
      \`cta_label\` text,
      \`cta_url\` text,
      \`events_source\` text DEFAULT 'auto',
      \`auto_count\` numeric DEFAULT 6,
      \`_uuid\` text,
      \`block_name\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_events_calendar_order_idx\` ON \`_pages_v_blocks_events_calendar\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_events_calendar_parent_id_idx\` ON \`_pages_v_blocks_events_calendar\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_events_calendar_path_idx\` ON \`_pages_v_blocks_events_calendar\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_events_calendar_locale_idx\` ON \`_pages_v_blocks_events_calendar\` (\`_locale\`);`)

  // Add events_id to _pages_v_rels
  await db.run(sql`ALTER TABLE \`_pages_v_rels\` ADD \`events_id\` integer REFERENCES \`events\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION;`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_events_id_idx\` ON \`_pages_v_rels\` (\`events_id\`);`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`_pages_v_blocks_events_calendar\``)
  await db.run(sql`DROP TABLE IF EXISTS \`pages_blocks_events_calendar\``)
  await db.run(sql`DROP TABLE IF EXISTS \`events_repeat_days\``)
  await db.run(sql`DROP TABLE IF EXISTS \`events_locales\``)
  await db.run(sql`DROP TABLE IF EXISTS \`events\``)
}
