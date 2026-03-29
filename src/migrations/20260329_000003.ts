import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Add cta_enabled and cta_button_* columns if they don't exist yet
  try {
    await db.run(sql`ALTER TABLE header ADD COLUMN cta_enabled integer DEFAULT 0`)
  } catch {
    // Column may already exist
  }
  try {
    await db.run(sql`ALTER TABLE header ADD COLUMN cta_button_type text DEFAULT 'reference'`)
    await db.run(sql`ALTER TABLE header ADD COLUMN cta_button_new_tab integer`)
    await db.run(sql`ALTER TABLE header ADD COLUMN cta_button_url text`)
    await db.run(sql`ALTER TABLE header ADD COLUMN cta_button_label text`)
  } catch {
    // Columns may already exist
  }

  // Remove logo_id column — SQLite requires full table rebuild when FK is involved
  await db.run(sql`PRAGMA foreign_keys=OFF`)
  await db.run(sql`
    CREATE TABLE "header_new" (
      id integer PRIMARY KEY NOT NULL,
      phone text,
      address text,
      cta_enabled integer DEFAULT false,
      cta_button_type text DEFAULT 'reference',
      cta_button_new_tab integer,
      cta_button_url text,
      cta_button_label text,
      updated_at text,
      created_at text
    )
  `)
  await db.run(sql`
    INSERT INTO header_new (id, phone, address, cta_enabled, cta_button_type, cta_button_new_tab, cta_button_url, cta_button_label, updated_at, created_at)
    SELECT id, phone, address, cta_enabled, cta_button_type, cta_button_new_tab, cta_button_url, cta_button_label, updated_at, created_at
    FROM header
  `)
  await db.run(sql`DROP TABLE header`)
  await db.run(sql`ALTER TABLE header_new RENAME TO header`)
  await db.run(sql`PRAGMA foreign_keys=ON`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Re-add logo_id column
  await db.run(sql`ALTER TABLE header ADD COLUMN logo_id integer`)
}
