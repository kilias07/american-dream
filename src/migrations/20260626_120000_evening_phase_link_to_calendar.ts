import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

// Adds `link_to_calendar` to the eveningPhases phase array (base + versions
// table). When set, the phase card shows the real calendar event for the
// selected weekday on the reservation page.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`pages_blocks_evening_phases_phases\` ADD \`link_to_calendar\` integer DEFAULT false;`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_evening_phases_phases\` ADD \`link_to_calendar\` integer DEFAULT false;`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`pages_blocks_evening_phases_phases\` DROP COLUMN \`link_to_calendar\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_evening_phases_phases\` DROP COLUMN \`link_to_calendar\`;`,
  )
}
