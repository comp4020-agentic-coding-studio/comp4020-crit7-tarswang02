# Process overview

How this repo got from the guestbook starter to a cross-course deadline
tracker, and how I checked the result was actually right.

## What I built

A shared, no-login deadline tracker: add a title/course/due-date/weight%,
it's in SQLite for everyone with the link, live in every open tab over SSE,
and a per-row toggle marks it done. `README.md` has the fuller account of
what the app is and what good means here; this is how I got there.

## How I got here

I wrote the implementation plan before touching any code, specifically to
front-load the two decisions most likely to bite me mid-build: the
schema/migration sequencing, and how due dates would be stored and compared.
Both held up unchanged through implementation.

**Schema and migrations, in two steps, not one**
[`9e1c07a`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-tarswang02/commit/9e1c07a).
Adding `deadlines` and dropping `messages` in the same `schema.ts` edit would
make `drizzle-kit generate` diff against the old snapshot, read that as a
possible rename, and prompt interactively — which just hangs a
non-interactive shell. I generated it as two migrations instead: add
`deadlines` first (`drizzle/0001_add_deadlines.sql`, a clean `CREATE TABLE`),
then delete `messages` from the schema and generate again
(`drizzle/0002_drop_messages.sql`, a clean `DROP TABLE`). Both SQL files came
out exactly as expected on inspection, no manual editing needed.

Due dates are stored as plain `YYYY-MM-DD` text and compared lexically
against today's ISO date (`isOverdue` in `src/lib/db.ts`) rather than parsed
as a `Date` — the Fly machine and I don't share a timezone, and a
datetime-based comparison would misjudge "overdue" by up to half a day right
around a deadline. Lexical order matches chronological order for ISO dates,
so this needed no library and has no timezone-dependent branch at all.

**Routes and the live SSE stream**
[`9e1c07a`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-tarswang02/commit/9e1c07a).
`src/pages/api/deadlines.ts` and `src/pages/api/deadlines/[id]/toggle.ts`
keep the starter's no-JS POST+303-redirect shape. `src/pages/api/events.ts`
now emits two named SSE event kinds, `deadline-added` and `deadline-toggled`,
instead of one unnamed `message` type, because the client needs to tell an
insert from an update apart to decide whether to prepend a new row or patch
an existing one in place.

**Verification, in order**: `pnpm typecheck` and `pnpm test` (build + the
full vitest suite, including axe accessibility checks against the built
server) both green after every substantive change, not just at the end. Then
by hand against `pnpm dev`, with two tabs open side by side: adding a
deadline in one tab appeared in the other with no reload; toggling a row in
one tab flipped the other's row (strikethrough, button label) live; a
past-dated deadline rendered with the `overdue` styling; a hard reload in
either tab still showed everything, matching what the persistence tests
assert over HTTP. `spec/guestbook.test.ts` was deleted per its own file
header, once the guestbook it described no longer existed; its replacement,
`spec/deadlines.test.ts`, asserts the same three platform claims translated
to the new domain — added deadline persists across a reload, a toggle
persists across a reload, and the SSE stream carries a named
`event: deadline-added` frame.

**Docs**
[`719c24e`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-tarswang02/commit/719c24e).
`CLAUDE.md` and `README.md` were written last, after the implementation
commits existed, so they describe what actually shipped rather than what was
planned. `CLAUDE.md` states what's fixed (schema only via `schema.ts` +
`db:generate`, one bus/one machine, dates never parsed) and this app's actual
promise plus explicit non-goals (no accounts, no editing beyond the toggle,
no calendar sync). `README.md` marks which parts of "good" are spec-enforced
versus judgement calls, most notably the overdue-styling timezone trade-off.

Full range for this deliverable, starter to submission:
[`e59ab79...719c24e`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-tarswang02/compare/e59ab79...719c24e).

## Before you ship

`pnpm check:evidence` verifies that this comment is gone, that your citations
resolve to real commits, that a crit week's reflection entry is in
`reflections/`, and that your `CLAUDE.md` is there. It checks that your account
is traceable, not that it is good: that is the marker's call.

Images aren't checked: unlike a citation whose SHA doesn't resolve, a broken
image is visible the moment this file is rendered on GitHub.
