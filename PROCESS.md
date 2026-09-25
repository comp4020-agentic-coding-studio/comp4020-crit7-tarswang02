# Process overview

A shared, no-login deadline tracker built on the guestbook starter:
add/toggle over SQLite, live across tabs via SSE. `README.md` covers what
the app promises; this is the week's account of getting there.

**Migration sequencing**
[`9e1c07a`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-tarswang02/commit/9e1c07a).
Adding `deadlines` and dropping `messages` in one `schema.ts` edit would make
`drizzle-kit generate` read the diff as a possible rename and prompt
interactively, which just hangs a non-interactive shell. Generating it as two
migrations — add `deadlines` first, then drop `messages` — kept both as
clean, unambiguous SQL with no manual editing.

**The hourglass, twice**
[`9b64517`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-tarswang02/commit/9b64517),
[`79ed7a8`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-tarswang02/commit/79ed7a8),
[`39e7767`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-tarswang02/commit/39e7767).
After the decorative Three.js hourglass and the ink-and-parchment redesign
landed, a follow-up pass to improve the hourglass's look hit a genuine API
error partway through, with no working changes yet made; rather than patch a
half-broken session, I restarted the attempt cleanly from the prior good
commit. The real fix wasn't lighting or color — it was geometry: the bulb
was built from a cone-plus-cylinder-plus-cone stack, whose seams read as
lumpy and cartoonish. Replacing it with one lathed silhouette (a continuous
pinch-to-flare profile) is what actually fixed it; retinting the glass warm
and giving the frame distinct wood/brass materials only mattered once the
underlying shape was right.

**Verification**: `pnpm typecheck` and `pnpm test` (build + vitest,
including axe checks) after each substantive change, plus manual two-tab
checks in `pnpm dev` for live add/toggle and overdue styling.

Full range, starter to this submission:
[`e59ab79...39e7767`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-tarswang02/compare/e59ab79...39e7767).

## Before you ship

`pnpm check:evidence` verifies that this comment is gone, that your citations
resolve to real commits, that a crit week's reflection entry is in
`reflections/`, and that your `CLAUDE.md` is there. It checks that your account
is traceable, not that it is good: that is the marker's call.

Images aren't checked: unlike a citation whose SHA doesn't resolve, a broken
image is visible the moment this file is rendered on GitHub.
