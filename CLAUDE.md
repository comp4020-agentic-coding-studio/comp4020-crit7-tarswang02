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

## Deliberate experiment: the 3D hourglass by the title

The small rotating hourglass next to the `<h1>` on the index page
(`src/pages/index.astro`, built with `three` via npm) is a one-off,
explicitly-requested experiment in Opus's current 3D frontend capability —
not the start of a "make the site 3D" direction. It's a client-only
enhancement layered onto the server-rendered page, same idiom as the
existing SSE `<script>` block below it.

- **It is decorative only, never semantic.** Its container div carries
  `aria-hidden="true"`, which removes the whole WebGL canvas subtree from
  the accessibility tree — screen readers never see it, and it can't
  compete with or duplicate the real content the way an `<img>` with bad
  alt text could. That's also why `spec/invariants.test.ts`'s axe check
  stays green: axe skips aria-hidden subtrees.
- **It can't break the real flow.** It's mounted lazily by a plain
  `<script>` (no `client:*` Astro directive, no hydration of the actual
  page), wrapped in try/catch, and degrades to an empty box if WebGL is
  unavailable. The add/toggle forms are untouched, plain HTML `<form>`
  POSTs as before.
- **It respects `prefers-reduced-motion`.** When that media query matches,
  it renders one static frame instead of looping `requestAnimationFrame`,
  and the loop pauses on `visibilitychange` regardless, so a backgrounded
  tab doesn't keep spinning it.
- **Known cost, accepted deliberately:** `three` adds roughly 130 KB
  gzipped to the page's client JS. That's the expected floor for using a
  real WebGL library rather than a CSS/SVG trick, and it's a fixed
  one-time load — this isn't a mistake to "optimize away" later unless a
  future decision explicitly revisits whether the experiment stays.

If a future me is tempted to extend this into more 3D chrome elsewhere on
the page: don't, without a fresh explicit ask — this was scoped as a
single decorative accent, not a redesign.

## Visual design: ink-and-parchment editorial system

The starter's bare `system-ui` styling was deliberately replaced with a
real typographic and color system, not just a palette swap:

- **Fraunces** (a warm, characterful display serif) for `h1`/`h2`, paired
  with **Work Sans** for body/UI text — loaded via `@import` at the top of
  `src/styles.css` so both pages pick it up from one place, with a system
  serif/sans fallback stack if the Google Fonts request is blocked.
- **Palette is warm parchment + near-black ink + a gold accent**
  (`--paper`, `--ink`, `--accent` in `src/styles.css`), chosen to tie
  directly into the hourglass's existing sand (`0xdcb35c`) and brass frame
  (`0xb8860b`) colors from the Three.js experiment above, so the two
  additions read as one considered product rather than two unrelated
  layers. The hourglass itself was repositioned into a rounded "display
  case" frame (`.hourglass-frame`) in the hero instead of sitting bare
  next to the `h1`.
- **Cards + a colored left-bar status indicator** replace the old flat
  list: `.card` for the add-form and `#deadlines li`, with the bar color
  keyed off `.overdue`/`.done` (see the `#deadlines li::before` rules).
  Contrast was eyeballed by hand at both ~1920px and ~390px — `color-contrast`
  is disabled in `spec/invariants.test.ts`'s jsdom-based axe run, so nothing
  automated catches a bad ratio here.
- Every id/class the specs or the SSE row-builder script in `index.astro`
  depend on (`#deadlines`, `data-id`, `.deadline-title`/`-course`/`-due`/
  `-weight`, `.overdue`/`.done`) was kept exactly; only the surrounding
  wrapper markup and CSS changed.

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
