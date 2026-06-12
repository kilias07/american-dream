import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

// NOTE: `migrate:create` regenerated the full reservations DDL (already created
// by 20260608_132940_reservations) because it diffed against a pre-step-1 base.
// This migration is hand-trimmed to the genuine delta: the `reservation-settings`
// global tables only. The cumulative .json snapshot is correct and unchanged.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`reservation_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`default_capacity\` numeric DEFAULT 60,
  	\`notification_email\` text DEFAULT 'rezerwacja@americandreamclub.pl',
  	\`contact_email\` text DEFAULT 'rezerwacja@americandreamclub.pl',
  	\`contact_phone\` text DEFAULT '+48 500 210 333',
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE TABLE \`reservation_settings_locales\` (
  	\`texts_opening_info\` text,
  	\`texts_concert_info\` text,
  	\`texts_club_info\` text,
  	\`texts_free_pending_message\` text,
  	\`texts_paid_accepted_message\` text,
  	\`texts_close_warning\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reservation_settings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`reservation_settings_locales_locale_parent_id_unique\` ON \`reservation_settings_locales\` (\`_locale\`,\`_parent_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`reservation_settings_locales\`;`)
  await db.run(sql`DROP TABLE \`reservation_settings\`;`)
}
