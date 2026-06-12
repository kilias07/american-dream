import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`reservations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`reservation_number\` text,
  	\`event_id\` integer,
  	\`date\` text,
  	\`option\` text,
  	\`slot_start\` text,
  	\`slot_end\` text,
  	\`guests\` numeric DEFAULT 1,
  	\`first_name\` text,
  	\`last_name\` text,
  	\`phone\` text,
  	\`email\` text,
  	\`locale\` text DEFAULT 'pl',
  	\`consent_terms\` integer DEFAULT false,
  	\`consent_newsletter\` integer DEFAULT false,
  	\`status\` text DEFAULT 'awaiting_approval',
  	\`payment_status\` text DEFAULT 'none',
  	\`amount\` numeric DEFAULT 0,
  	\`payu_order_id\` text,
  	\`payu_refund_id\` text,
  	\`admin_note\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`event_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`reservations_reservation_number_idx\` ON \`reservations\` (\`reservation_number\`);`)
  await db.run(sql`CREATE INDEX \`reservations_event_idx\` ON \`reservations\` (\`event_id\`);`)
  await db.run(sql`CREATE INDEX \`reservations_updated_at_idx\` ON \`reservations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`reservations_created_at_idx\` ON \`reservations\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`reservations_enabled\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`capacity\` numeric;`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`option_opening_enabled\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`option_opening_start_time\` text;`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`option_opening_end_time\` text;`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`option_concert_enabled\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`option_concert_start_time\` text;`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`option_concert_end_time\` text;`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`option_concert_price_per_person\` numeric;`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`option_club_enabled\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`option_club_start_time\` text;`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`option_club_end_time\` text;`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`reservations_id\` integer REFERENCES reservations(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_reservations_id_idx\` ON \`payload_locked_documents_rels\` (\`reservations_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`reservations\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	\`pages_id\` integer,
  	\`posts_id\` integer,
  	\`categories_id\` integer,
  	\`events_id\` integer,
  	\`musicians_id\` integer,
  	\`recurring_series_id\` integer,
  	\`menu_categories_id\` integer,
  	\`menu_items_id\` integer,
  	\`rooms_id\` integer,
  	\`team_members_id\` integer,
  	\`testimonials_id\` integer,
  	\`artist_applications_id\` integer,
  	\`redirects_id\` integer,
  	\`forms_id\` integer,
  	\`form_submissions_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`categories_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`events_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`musicians_id\`) REFERENCES \`musicians\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`recurring_series_id\`) REFERENCES \`recurring_series\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`menu_categories_id\`) REFERENCES \`menu_categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`menu_items_id\`) REFERENCES \`menu_items\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`rooms_id\`) REFERENCES \`rooms\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`team_members_id\`) REFERENCES \`team_members\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`testimonials_id\`) REFERENCES \`testimonials\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`artist_applications_id\`) REFERENCES \`artist_applications\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`redirects_id\`) REFERENCES \`redirects\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`forms_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`form_submissions_id\`) REFERENCES \`form_submissions\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "pages_id", "posts_id", "categories_id", "events_id", "musicians_id", "recurring_series_id", "menu_categories_id", "menu_items_id", "rooms_id", "team_members_id", "testimonials_id", "artist_applications_id", "redirects_id", "forms_id", "form_submissions_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "pages_id", "posts_id", "categories_id", "events_id", "musicians_id", "recurring_series_id", "menu_categories_id", "menu_items_id", "rooms_id", "team_members_id", "testimonials_id", "artist_applications_id", "redirects_id", "forms_id", "form_submissions_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_posts_id_idx\` ON \`payload_locked_documents_rels\` (\`posts_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_categories_id_idx\` ON \`payload_locked_documents_rels\` (\`categories_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_events_id_idx\` ON \`payload_locked_documents_rels\` (\`events_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_musicians_id_idx\` ON \`payload_locked_documents_rels\` (\`musicians_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_recurring_series_id_idx\` ON \`payload_locked_documents_rels\` (\`recurring_series_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_menu_categories_id_idx\` ON \`payload_locked_documents_rels\` (\`menu_categories_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_menu_items_id_idx\` ON \`payload_locked_documents_rels\` (\`menu_items_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_rooms_id_idx\` ON \`payload_locked_documents_rels\` (\`rooms_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_team_members_id_idx\` ON \`payload_locked_documents_rels\` (\`team_members_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_testimonials_id_idx\` ON \`payload_locked_documents_rels\` (\`testimonials_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_artist_applications_id_idx\` ON \`payload_locked_documents_rels\` (\`artist_applications_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_redirects_id_idx\` ON \`payload_locked_documents_rels\` (\`redirects_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_forms_id_idx\` ON \`payload_locked_documents_rels\` (\`forms_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_form_submissions_id_idx\` ON \`payload_locked_documents_rels\` (\`form_submissions_id\`);`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`reservations_enabled\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`capacity\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`option_opening_enabled\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`option_opening_start_time\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`option_opening_end_time\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`option_concert_enabled\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`option_concert_start_time\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`option_concert_end_time\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`option_concert_price_per_person\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`option_club_enabled\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`option_club_start_time\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`option_club_end_time\`;`)
}
