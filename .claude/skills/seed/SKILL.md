---
name: seed
description: Seed the local D1 development database with sample data (header, events, homepage)
disable-model-invocation: true
---

Run the seed script to restore the local development database:

1. Use Bash to run: `./scripts/seed.sh`
2. If it fails because the SQLite file doesn't exist, tell the user to start the dev server first and then run `/seed` again.
3. Show the output to the user.
