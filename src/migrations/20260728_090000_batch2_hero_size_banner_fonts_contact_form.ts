import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

// Uwagi klienta 2026-07 (partia 2) — czyste addycje:
//  1. heroBanner.headingSize — wielkość nagłówka hero na home wybierana w CMS
//     (dłuższy tytuł → mniejszy font).
//  2. specialMenu.headingFont / headingColor / bodyColor — personalizacja
//     banera „Lunch Time & Café" (dowolny Google Font + kolory).
//  3. Global `contact-form` („Formularz kontaktowy", grupa admina „Formularze
//     (Forms)") — teksty formularza kontaktowego w widocznym miejscu.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // 1. heroBanner — wielkość nagłówka
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_banner\` ADD \`heading_size\` text DEFAULT 'xl';`)
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_hero_banner\` ADD \`heading_size\` text DEFAULT 'xl';`,
  )

  // 2. specialMenu — font + kolory banera
  await db.run(sql`ALTER TABLE \`pages_blocks_special_menu\` ADD \`heading_font\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_special_menu\` ADD \`heading_color\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_special_menu\` ADD \`body_color\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_special_menu\` ADD \`heading_font\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_special_menu\` ADD \`heading_color\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_special_menu\` ADD \`body_color\` text;`)

  // 3. Global contact-form (struktura 1:1 z innymi globalami localized)
  await db.run(sql`CREATE TABLE \`contact_form\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`updated_at\` text,
    \`created_at\` text
  );`)
  await db.run(sql`CREATE TABLE \`contact_form_locales\` (
    \`heading\` text,
    \`name\` text,
    \`phone\` text,
    \`email\` text,
    \`message\` text,
    \`consent\` text,
    \`submit\` text,
    \`sending\` text,
    \`success\` text,
    \`error\` text,
    \`id\` integer PRIMARY KEY NOT NULL,
    \`_locale\` text NOT NULL,
    \`_parent_id\` integer NOT NULL,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`contact_form\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(
    sql`CREATE UNIQUE INDEX \`contact_form_locales_locale_parent_id_unique\` ON \`contact_form_locales\` (\`_locale\`,\`_parent_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_banner\` DROP COLUMN \`heading_size\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_banner\` DROP COLUMN \`heading_size\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_special_menu\` DROP COLUMN \`heading_font\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_special_menu\` DROP COLUMN \`heading_color\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_special_menu\` DROP COLUMN \`body_color\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_special_menu\` DROP COLUMN \`heading_font\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_special_menu\` DROP COLUMN \`heading_color\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_special_menu\` DROP COLUMN \`body_color\`;`)
  await db.run(sql`DROP TABLE \`contact_form_locales\`;`)
  await db.run(sql`DROP TABLE \`contact_form\`;`)
}
