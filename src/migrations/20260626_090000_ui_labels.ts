import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

// Adds the `ui-labels` global (all-localized interface microcopy) and a
// `meta_description` localized field on `site-settings`. Pure additions — no
// existing data touched.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`ui_labels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE TABLE \`ui_labels_locales\` (
  	\`common_read_more\` text,
  	\`common_opening_hours\` text,
  	\`common_closed\` text,
  	\`common_newsletter\` text,
  	\`common_no_news\` text,
  	\`common_write_to_us\` text,
  	\`common_call_us\` text,
  	\`days_monday\` text,
  	\`days_tuesday\` text,
  	\`days_wednesday\` text,
  	\`days_thursday\` text,
  	\`days_friday\` text,
  	\`days_saturday\` text,
  	\`days_sunday\` text,
  	\`forms_name\` text,
  	\`forms_phone\` text,
  	\`forms_email\` text,
  	\`forms_message\` text,
  	\`forms_consent\` text,
  	\`forms_submit\` text,
  	\`forms_sending\` text,
  	\`forms_success\` text,
  	\`forms_error\` text,
  	\`forms_contact_heading\` text,
  	\`menu_full_menu_pdf\` text,
  	\`menu_legend_pair\` text,
  	\`menu_legend_veg\` text,
  	\`menu_legend_vegan\` text,
  	\`event_reserve_table\` text,
  	\`event_special_event\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`ui_labels\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX \`ui_labels_locales_locale_parent_id_unique\` ON \`ui_labels_locales\` (\`_locale\`,\`_parent_id\`);`,
  )
  await db.run(sql`ALTER TABLE \`site_settings_locales\` ADD \`meta_description\` text;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`site_settings_locales\` DROP COLUMN \`meta_description\`;`)
  await db.run(sql`DROP TABLE \`ui_labels_locales\`;`)
  await db.run(sql`DROP TABLE \`ui_labels\`;`)
}
