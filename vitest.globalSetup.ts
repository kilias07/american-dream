import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

export default async function globalSetup() {
  // Wipe the local wrangler D1 state so a fresh schema is created by migrations.
  const d1StatePath = path.resolve('.wrangler/state/v3/d1')
  if (fs.existsSync(d1StatePath)) {
    fs.rmSync(d1StatePath, { recursive: true })
  }

  // Run migrations to create the schema in the fresh DB.
  execSync('pnpm run payload migrate', { stdio: 'inherit' })
}
