# Your harness

This is a cross-course deadline tracker: one shared, no-auth list of
assignment and crit due dates, built on the starter's guestbook idioms
(SQLite via Drizzle, migrations auto-applied at boot, one in-process
`EventEmitter` feeding an SSE stream so open tabs update live). These are the
rules I'm holding the agent to; they're mine, not the template's.

## What's fixed

- **Schema changes go through `src/lib/schema.ts` + `pnpm db:generate` only.**
  Never hand-edit a file under `drizzle/` or the SQLite file itself — the
  migration trail is what keeps the deployed volume's old rows compatible
  with new code. If a schema edit needs both an addition and a removal (e.g.
  a new table replacing an old one), generate it as two separate migrations,
  not one — `drizzle-kit` will otherwise try to guess a rename and prompt
  interactively, which hangs in a non-interactive shell.
- **One process, one bus, one machine.** `src/lib/events.ts`'s `EventEmitter`
  only reaches SSE clients connected to the same process, so `fly.toml` stays
  at `min_machines_running = 0` / no scaling past one machine. A second
  machine would have its own bus and silently miss half the events.
- **Due dates are plain `YYYY-MM-DD` text, compared lexically, never
  parsed as a `Date`.** The Fly machine and the person using it don't share a
  timezone; storing and comparing an ISO date string sidesteps that entirely
  because lexical order matches chronological order for `YYYY-MM-DD`. Don't
  reintroduce `new Date(dueAt)` comparisons — see `src/lib/db.ts`'s
  `isOverdue` for why.

## What this app promises

- A deadline (title, course, due date, optional weight %) added by anyone
  persists in SQLite and appears for everyone who opens the page — no
  accounts, no per-user lists.
- Adding a deadline and toggling one done both survive a hard reload.
- A deadline that's overdue and not done is visually flagged (`.overdue` in
  `src/styles.css`).
- Every open tab reflects an add or a toggle from any other tab without a
  reload, over the `/api/events` SSE stream.

## Non-goals

- No accounts, no login, no per-user data — it's one shared list, by design.
- No editing a deadline's title/course/date/weight once added — only the
  done toggle. Wrong entries get worked around by adding a corrected one,
  not edited in place.
- No calendar sync, no notifications/reminders, no recurring deadlines.

Everything else about the starter — what the repo ships, what CI checks —
is explained where it lives: `fly.toml`, the `Dockerfile`, the CI workflow,
and `spec/README.md`. The
[course website](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/)
publishes this deliverable's brief and spec.
