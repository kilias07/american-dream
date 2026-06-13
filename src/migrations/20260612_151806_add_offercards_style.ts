import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_offer_cards\` ADD \`style\` text DEFAULT 'photo';`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_offer_cards\` ADD \`style\` text DEFAULT 'photo';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_offer_cards\` DROP COLUMN \`style\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_offer_cards\` DROP COLUMN \`style\`;`)
}
