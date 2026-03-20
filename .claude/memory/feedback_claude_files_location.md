---
name: claude files location preference
description: User wants all Claude-related files stored inside the project directory
type: feedback
---

Keep all Claude-related files inside the project directory, not in external locations.

**Why:** User's explicit preference for keeping project context co-located with the project.

**How to apply:**
- `CLAUDE.md` → project root (already correct)
- Any additional Claude context files (notes, guides, prompts, checklists) → create inside the project directory, e.g. `.claude/` subfolder
- The system memory path (`~/.claude/projects/...`) is managed by Claude Code infrastructure and cannot be changed — this is the only exception
