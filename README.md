# Deadline tracker

A cross-course deadline tracker: the ANU system I actually wanted was one
place to see COMP4020's crit dates next to every other course's assignment
due dates and weights, instead of holding them in my head across five
different course pages. This is one shared, no-login list — add a title,
course, due date and optional weight %, and it's there for everyone with the
link, live in every open tab, persisted across reloads and redeploys.

## What good looks like here

- **Adding a deadline persists.** It's written to SQLite before the page
  redirects back, so a hard reload — or coming back after the machine
  restarts — still shows it. Enforced by `spec/deadlines.test.ts`.
- **Toggling done persists** the same way, and is enforced by the same test.
- **A deadline that's overdue and not done is visually flagged.** This is a
  judgement call, not a spec-checked contract: "overdue" is computed by
  comparing the stored `YYYY-MM-DD` due date against today's date as plain
  strings, not by parsing either as a `Date`. That was a deliberate choice —
  the deployed machine and I don't share a timezone, and a `datetime`-based
  comparison would misjudge "overdue" by up to half a day right around a
  deadline. The cost is that "today" is resolved in whatever timezone the
  server process sees, so the overdue flag can be off by one calendar day
  right at midnight — a trade-off I'm making deliberately, not an oversight.
- **Every open tab stays live**, over one SSE stream (`/api/events`) fed by
  one in-process event bus — the same idiom the starter shipped, applied to
  two event kinds (`deadline-added`, `deadline-toggled`) instead of one. This
  is why the app runs on exactly one machine (see `fly.toml`, `CLAUDE.md`).

What's out of scope, on purpose: no accounts (it's one shared list, not a
per-user one), no editing a deadline once added beyond the done toggle, and
no calendar sync or reminders. `CLAUDE.md` has the fuller rule list; the
checks that protect the enforced parts live in `spec/`.
