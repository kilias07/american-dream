import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

/**
 * Two additions:
 *
 * 1. `header_nav_items_sub_items` — a navigation entry can now open a list of
 *    sub-pages (the events dropdown the client asked for). Labels are localized,
 *    like the parent entries, so they live in a `_locales` side table. Document
 *    references reuse the existing `header_rels`, which keys rows by `path`.
 *
 * 2. `signups` — newsletter sign-ups, "notify me" requests for a recurring
 *    series, and contact-form messages. Until now `/api/contact` only wrote them
 *    to the worker log, so every enquiry was lost unless someone was watching
 *    the logs at that moment.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`header_nav_items_sub_items\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` text NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`link_type\` text DEFAULT 'reference',
    \`link_new_tab\` integer,
    \`link_url\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`header_nav_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(
    sql`CREATE INDEX \`header_nav_items_sub_items_order_idx\` ON \`header_nav_items_sub_items\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`header_nav_items_sub_items_parent_id_idx\` ON \`header_nav_items_sub_items\` (\`_parent_id\`);`,
  )

  await db.run(sql`CREATE TABLE \`header_nav_items_sub_items_locales\` (
    \`link_label\` text,
    \`id\` integer PRIMARY KEY NOT NULL,
    \`_locale\` text NOT NULL,
    \`_parent_id\` text NOT NULL,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`header_nav_items_sub_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(sql`CREATE UNIQUE INDEX \`header_nav_items_sub_items_locales_locale_parent_id_unique\`
    ON \`header_nav_items_sub_items_locales\` (\`_locale\`,\`_parent_id\`);`)

  await db.run(sql`CREATE TABLE \`signups\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`kind\` text DEFAULT 'newsletter' NOT NULL,
    \`email\` text NOT NULL,
    \`name\` text,
    \`phone\` text,
    \`message\` text,
    \`series_id\` integer,
    \`locale\` text,
    \`handled\` integer DEFAULT false,
    \`notified_at\` text,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    FOREIGN KEY (\`series_id\`) REFERENCES \`recurring_series\`(\`id\`) ON UPDATE no action ON DELETE set null
  );`)
  await db.run(sql`CREATE INDEX \`signups_email_idx\` ON \`signups\` (\`email\`);`)
  await db.run(sql`CREATE INDEX \`signups_series_idx\` ON \`signups\` (\`series_id\`);`)
  await db.run(sql`CREATE INDEX \`signups_updated_at_idx\` ON \`signups\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`signups_created_at_idx\` ON \`signups\` (\`created_at\`);`)

  // Payload's document-locking table carries one column per collection; without
  // it every edit in the admin panel fails on the lock check, not just edits to
  // the new collection.
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`signups_id\` integer REFERENCES signups(id);`)
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_signups_id_idx\` ON \`payload_locked_documents_rels\` (\`signups_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`payload_locked_documents_rels_signups_id_idx\`;`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` DROP COLUMN \`signups_id\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`signups\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`header_nav_items_sub_items_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`header_nav_items_sub_items\`;`)
}
