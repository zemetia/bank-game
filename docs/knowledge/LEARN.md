# LEARN — Correction & Mistake Log

> Written whenever: (1) the user explicitly corrects the AI, or (2) the AI recognizes it deviated from what was asked or from best practice. Format is compact but lossless.

**Template:** `[YYYY-MM-DD] - [problem] - [solution] - [lesson]`

---

<!-- Entries below, newest first -->

[2026-06-09] - Assumed modifying proxy.ts was enough to redirect `/` → `/{locale}`, but the middleware manifest was empty and the proxy wasn't intercepting `/`; user still got 404 - Added `src/app/page.tsx` with an explicit redirect as the guaranteed fallback - When middleware state is uncertain (empty manifest, Turbopack dev), always add an App Router page-level redirect as the source of truth; don't rely solely on proxy for root redirects

[2026-06-09] - `userCode` referenced in PlayerList and old join pages was never a real field on RoomUserVO — those pages were effectively broken - Replaced the pick-from-list join flow with JWT-based user detection; PinEntry now uses User.id from JWT - Always verify referenced properties exist in the VO type before building UI around them

[2026-06-06] - Pushed commits to `master` without first checking the repo's default branch (`main`), creating diverged histories - Merged `master` → `main` with `--allow-unrelated-histories`, pushed to `origin/main` - Always check the default branch before the first push; never assume it is `master`

[2026-06-08] - Spent too long investigating i18n root-layout issues instead of just fixing the 404 - User explicitly said to remove i18n; over-analysis of i18n details caused frustration - When the user says to remove something, remove it immediately; don't get bogged down in preserving complexity they don't want
