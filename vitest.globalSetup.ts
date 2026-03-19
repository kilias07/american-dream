import fs from 'fs'
import path from 'path'

export default async function globalSetup() {
  // Wipe the local wrangler D1 state so Payload's pushDevSchema can
  // initialise a clean schema. Without this, running migrations first
  // causes "index already exists" conflicts on the second test run.
  const d1StatePath = path.resolve('.wrangler/state/v3/d1')
  if (fs.existsSync(d1StatePath)) {
    fs.rmSync(d1StatePath, { recursive: true })
  }
}
