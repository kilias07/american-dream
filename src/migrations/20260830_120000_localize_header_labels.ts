import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

/**
 * Etykiety nawigacji i przycisku CTA w nagłówku były JEDNĄ wspólną wartością dla
 * obu języków (pole `link.label` bez `localized`). Skutki widoczne dla klienta:
 * angielska wersja serwisu pokazywała polskie napisy menu i „ZAREZERWUJ", a
 * wpisanie angielskiej nazwy nadpisywało polską.
 *
 * Przenosimy je do tabel `_locales`. Istniejące wartości kopiujemy do OBU
 * języków, żeby nic nie zniknęło — tłumaczenia EN podmieniamy potem osobno.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // ── nawigacja ───────────────────────────────────────────────────────────
  await db.run(sql`CREATE TABLE \`header_nav_items_locales\` (
    \`link_label\` text,
    \`id\` integer PRIMARY KEY NOT NULL,
    \`_locale\` text NOT NULL,
    \`_parent_id\` text NOT NULL,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`header_nav_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(sql`CREATE UNIQUE INDEX \`header_nav_items_locales_locale_parent_id_unique\`
    ON \`header_nav_items_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`INSERT INTO \`header_nav_items_locales\` (\`link_label\`,\`_locale\`,\`_parent_id\`)
    SELECT \`link_label\`,'pl',\`id\` FROM \`header_nav_items\`;`)
  await db.run(sql`INSERT INTO \`header_nav_items_locales\` (\`link_label\`,\`_locale\`,\`_parent_id\`)
    SELECT \`link_label\`,'en',\`id\` FROM \`header_nav_items\`;`)
  await db.run(sql`ALTER TABLE \`header_nav_items\` DROP COLUMN \`link_label\`;`)

  // ── przycisk CTA („Zarezerwuj") — header_locales już istnieje ───────────
  await db.run(sql`ALTER TABLE \`header_locales\` ADD \`cta_button_label\` text;`)
  await db.run(sql`UPDATE \`header_locales\` SET \`cta_button_label\` =
    (SELECT \`cta_button_label\` FROM \`header\` WHERE \`header\`.\`id\` = \`header_locales\`.\`_parent_id\`);`)
  await db.run(sql`ALTER TABLE \`header\` DROP COLUMN \`cta_button_label\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`header\` ADD \`cta_button_label\` text;`)
  await db.run(sql`UPDATE \`header\` SET \`cta_button_label\` =
    (SELECT \`cta_button_label\` FROM \`header_locales\`
     WHERE \`header_locales\`.\`_parent_id\` = \`header\`.\`id\` AND \`_locale\`='pl');`)
  await db.run(sql`ALTER TABLE \`header_locales\` DROP COLUMN \`cta_button_label\`;`)

  await db.run(sql`ALTER TABLE \`header_nav_items\` ADD \`link_label\` text;`)
  await db.run(sql`UPDATE \`header_nav_items\` SET \`link_label\` =
    (SELECT \`link_label\` FROM \`header_nav_items_locales\`
     WHERE \`header_nav_items_locales\`.\`_parent_id\` = \`header_nav_items\`.\`id\` AND \`_locale\`='pl');`)
  await db.run(sql`DROP TABLE \`header_nav_items_locales\`;`)
}
