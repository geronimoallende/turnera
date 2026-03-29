---
name: explain-after-task
description: Use after completing ANY implementation task, code change, migration, or file modification in the turnera project. Triggers when work is done and the user needs to understand what changed and why. Must be invoked before moving to next task.
---

# Explain After Task

## Overview

After completing any task that modifies code or files, explain every change step by step with full code shown and file links.

## When to Use

- After ANY code change, migration, file creation, or modification
- Before moving to the next task
- Before asking "what's next?"

## Process

1. **List every file that was created or modified** — use `[filename](path)` links
2. **For each file**, show the relevant code and explain EVERY line:
   - What the line does
   - Why it's there
   - How it connects to the rest of the system
3. **Use simple language** — assume the reader is learning web development
4. **Connect concepts** — relate new code to things already explained in previous steps
5. **Wait for confirmation** — after explaining, ask if the user wants deeper explanation on anything before continuing

## Format

```
### File: [filename.ts](src/path/filename.ts)

[Show the code block]

**Line by line:**
- Line X: [explanation]
- Line Y: [explanation]
...

### File: [next-file.ts](src/path/next-file.ts)
...
```

## Rules

- NEVER skip a file
- NEVER skip a line of code that was added or changed
- ALWAYS use clickable file links `[name](path)`
- ALWAYS explain in simple terms, no jargon without definition
- If a concept is new (Promise, hook, component, etc.), define it inline
- Explain in dependency order: database → API routes → hooks → components → pages
