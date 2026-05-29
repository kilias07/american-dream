// Stub for `drizzle-kit/api`, aliased only in the Next/Turbopack build (see
// next.config.ts `turbopack.resolveAlias`). @payloadcms/drizzle requires
// drizzle-kit/api solely for schema push / migration generation, which never
// runs inside the Cloudflare Worker (we use `push: false` + committed migrations
// applied via the Payload CLI, which imports the config directly in Node and is
// NOT affected by this alias). Bundling the real drizzle-kit into the Worker
// fails to resolve, so we swap in these no-ops. If any are ever called at
// runtime, throwing makes the misuse obvious.
const notSupported = (name) => () => {
  throw new Error(
    `drizzle-kit/api ("${name}") is unavailable in the Cloudflare Worker runtime. ` +
      `Run schema push/migrations via the Payload CLI (e.g. \`pnpm payload migrate\`).`,
  )
}

module.exports = {
  generateDrizzleJson: notSupported('generateDrizzleJson'),
  generateMigration: notSupported('generateMigration'),
  pushSchema: notSupported('pushSchema'),
  upPgSnapshot: notSupported('upPgSnapshot'),
  generateSQLiteDrizzleJson: notSupported('generateSQLiteDrizzleJson'),
  generateSQLiteMigration: notSupported('generateSQLiteMigration'),
  pushSQLiteSchema: notSupported('pushSQLiteSchema'),
}
