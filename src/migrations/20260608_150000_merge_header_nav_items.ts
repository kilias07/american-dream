import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

/**
 * Merge the header's two navigation arrays (`navItemsLeft` / `navItemsRight`)
 * into a single `navItems` array. The split dated from when the logo sat in the
 * centre; now the logo is on the left, so a single list is enough.
 *
 * Data is preserved: left rows keep their order, right rows are appended after
 * (offset by the last left `_order` per header), matching how the frontend used
 * to concatenate the two lists.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`header_nav_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`link_type\` text DEFAULT 'reference',
  	\`link_new_tab\` integer,
  	\`link_url\` text,
  	\`link_label\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`header\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`header_nav_items_order_idx\` ON \`header_nav_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`header_nav_items_parent_id_idx\` ON \`header_nav_items\` (\`_parent_id\`);`)

  // Left items first, preserving their order.
  await db.run(sql`INSERT INTO \`header_nav_items\` (\`_order\`, \`_parent_id\`, \`id\`, \`link_type\`, \`link_new_tab\`, \`link_url\`, \`link_label\`)
    SELECT \`_order\`, \`_parent_id\`, \`id\`, \`link_type\`, \`link_new_tab\`, \`link_url\`, \`link_label\`
    FROM \`header_nav_items_left\`;`)

  // Right items appended after the left ones, per header.
  await db.run(sql`INSERT INTO \`header_nav_items\` (\`_order\`, \`_parent_id\`, \`id\`, \`link_type\`, \`link_new_tab\`, \`link_url\`, \`link_label\`)
    SELECT r.\`_order\` + COALESCE((SELECT MAX(l.\`_order\`) FROM \`header_nav_items_left\` l WHERE l.\`_parent_id\` = r.\`_parent_id\`), 0),
           r.\`_parent_id\`, r.\`id\`, r.\`link_type\`, r.\`link_new_tab\`, r.\`link_url\`, r.\`link_label\`
    FROM \`header_nav_items_right\` r;`)

  await db.run(sql`DROP TABLE \`header_nav_items_left\`;`)
  await db.run(sql`DROP TABLE \`header_nav_items_right\`;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`header_nav_items_left\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`link_type\` text DEFAULT 'reference',
  	\`link_new_tab\` integer,
  	\`link_url\` text,
  	\`link_label\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`header\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`header_nav_items_left_order_idx\` ON \`header_nav_items_left\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`header_nav_items_left_parent_id_idx\` ON \`header_nav_items_left\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`header_nav_items_right\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`link_type\` text DEFAULT 'reference',
  	\`link_new_tab\` integer,
  	\`link_url\` text,
  	\`link_label\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`header\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`header_nav_items_right_order_idx\` ON \`header_nav_items_right\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`header_nav_items_right_parent_id_idx\` ON \`header_nav_items_right\` (\`_parent_id\`);`)

  // The original left/right boundary is not recoverable, so restore every item
  // into the left list (right stays empty). No data is lost.
  await db.run(sql`INSERT INTO \`header_nav_items_left\` (\`_order\`, \`_parent_id\`, \`id\`, \`link_type\`, \`link_new_tab\`, \`link_url\`, \`link_label\`)
    SELECT \`_order\`, \`_parent_id\`, \`id\`, \`link_type\`, \`link_new_tab\`, \`link_url\`, \`link_label\`
    FROM \`header_nav_items\`;`)

  await db.run(sql`DROP TABLE \`header_nav_items\`;`)
}
