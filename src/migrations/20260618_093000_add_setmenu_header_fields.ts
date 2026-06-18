import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_set_menu\` ADD \`heading_script\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_set_menu\` ADD \`body\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_set_menu\` ADD \`cta_label\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_set_menu\` ADD \`cta_url\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_set_menu\` ADD \`heading_script\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_set_menu\` ADD \`body\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_set_menu\` ADD \`cta_label\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_set_menu\` ADD \`cta_url\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_set_menu\` DROP COLUMN \`heading_script\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_set_menu\` DROP COLUMN \`body\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_set_menu\` DROP COLUMN \`cta_label\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_set_menu\` DROP COLUMN \`cta_url\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_set_menu\` DROP COLUMN \`heading_script\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_set_menu\` DROP COLUMN \`body\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_set_menu\` DROP COLUMN \`cta_label\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_set_menu\` DROP COLUMN \`cta_url\`;`)
}
