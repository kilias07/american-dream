import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

// Hand-trimmed to the genuine delta (migrate:create regenerates the full schema
// here — see 20260608_133322). New localized block text fields:
//   setMenu.subtitle, promoBand.subtitle, musiciansGrid.intro
// applied to both the live block tables and their version (`_pages_v_`) tables.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_set_menu\` ADD \`subtitle\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_promo_band\` ADD \`subtitle\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_musicians_grid\` ADD \`intro\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_set_menu\` ADD \`subtitle\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_promo_band\` ADD \`subtitle\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_musicians_grid\` ADD \`intro\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_set_menu\` DROP COLUMN \`subtitle\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_promo_band\` DROP COLUMN \`subtitle\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_musicians_grid\` DROP COLUMN \`intro\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_set_menu\` DROP COLUMN \`subtitle\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_promo_band\` DROP COLUMN \`subtitle\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_musicians_grid\` DROP COLUMN \`intro\`;`)
}
