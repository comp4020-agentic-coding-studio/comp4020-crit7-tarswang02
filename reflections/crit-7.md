# Crit 7 reflection

**What was the breakthrough that moved the work forward?**

The plan I wrote up front called out a trap I would otherwise have walked
into blind: editing `schema.ts` to both add `deadlines` and drop `messages`
in one pass, then running `drizzle-kit generate` once. `drizzle-kit` diffs
against the last snapshot, and a rename-shaped diff like that makes it stop
and ask interactively whether it's a rename — which just hangs a
non-interactive agent shell with no way to answer. Splitting it into two
migrations (add, then drop) sidestepped the prompt entirely and left two
clean, reviewable `CREATE TABLE` / `DROP TABLE` files instead of one
ambiguous one. The second thing that mattered as much: choosing to store and
compare due dates as plain `YYYY-MM-DD` strings instead of full datetimes.
It meant "overdue" never needed a `Date` object, a timezone, or a comparison
that could disagree with itself depending on what machine ran it — the whole
class of bug just didn't exist to debug later.

**What did this work change about how I want to work?**

Writing the plan before touching any code — and specifically writing down
*why* each non-obvious choice was made, not just what to do — paid for
itself immediately during implementation: every decision (the two-step
migration, string-compared dates, two named SSE event types instead of one)
was already justified, so building was just execution, and the docs I wrote
afterward could point back at reasoning I'd already worked out rather than
reconstructing it after the fact. I want to keep front-loading that "why,"
including the deliberate non-goals (no accounts, no editing beyond a toggle),
because writing them down early is what stopped scope from creeping while
building.
