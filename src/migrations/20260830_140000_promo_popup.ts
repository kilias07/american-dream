import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

/**
 * Global „Pop-up promocyjny" — narzędzie do ogłaszania akcji promocyjnych na
 * stronie głównej. Pisana ręcznie, bo `migrate:create` potrafi zawiesić się na D1.
 *
 * Podział pól odwzorowuje inne globale: wartości wspólne dla języków siedzą w
 * `promo_popup`, teksty w `promo_popup_locales`.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`promo_popup\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`enabled\` integer DEFAULT false,
    \`start_date\` text,
    \`end_date\` text,
    \`image_id\` integer,
    \`cta_url\` text,
    \`frequency\` text DEFAULT 'session',
    \`delay_seconds\` numeric DEFAULT 3,
    \`updated_at\` text,
    \`created_at\` text,
    FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );`)

  await db.run(sql`CREATE TABLE \`promo_popup_locales\` (
    \`eyebrow\` text,
    \`heading\` text,
    \`body\` text,
    \`cta_label\` text,
    \`id\` integer PRIMARY KEY NOT NULL,
    \`_locale\` text NOT NULL,
    \`_parent_id\` integer NOT NULL,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`promo_popup\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)

  await db.run(sql`CREATE UNIQUE INDEX \`promo_popup_locales_locale_parent_id_unique\`
    ON \`promo_popup_locales\` (\`_locale\`,\`_parent_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`promo_popup_locales\`;`)
  await db.run(sql`DROP TABLE \`promo_popup\`;`)
}
