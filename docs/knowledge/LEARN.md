# LEARN — Correction & Mistake Log

> Written whenever: (1) the user explicitly corrects the AI, or (2) the AI recognizes it deviated from what was asked or from best practice. Format is compact but lossless.

**Template:** `[YYYY-MM-DD] - [problem] - [solution] - [lesson]`

---

<!-- Entries below, newest first -->

[2026-06-09] - proxy.ts was placed at src/proxy.ts but Next.js 16 resolves it from the project root as [project]/proxy.ts; the previous commit message was wrong about src/ being required - Moved proxy.ts to the project root and updated imports from ./i18n/... to ./src/i18n/... etc. - proxy.ts must always live at the project root (same level as next.config.ts), not inside src/

[2026-06-09] - master/page.tsx and bank/page.tsx used useGameStore() for auth guard; on refresh, Zustand persist hydration is async so initial state is null and the useEffect redirected to / before the store loaded - Converted both pages to server components that read the auth_token cookie directly with verifyJwt (same pattern as join/page.tsx) - For any page whose access control depends on persisted client state, always do the auth check server-side via cookies; never rely on Zustand hydration timing for redirects

[2026-06-09] - Told user auth guard redirects unauthenticated users to login, but in reality: (1) auth guard was not actually blocking access — users could reach bank pages without a token; (2) sign-out redirected to `/login` (no locale) causing 404 instead of `/{locale}/login` - Must verify actual runtime behavior, not just read the code - Never claim a feature works based solely on reading the code; test the real flow or acknowledge uncertainty

[2026-06-09] - Assumed modifying proxy.ts was enough to redirect `/` → `/{locale}`, but the middleware manifest was empty and the proxy wasn't intercepting `/`; user still got 404 - Added `src/app/page.tsx` with an explicit redirect as the guaranteed fallback - When middleware state is uncertain (empty manifest, Turbopack dev), always add an App Router page-level redirect as the source of truth; don't rely solely on proxy for root redirects

[2026-06-09] - `userCode` referenced in PlayerList and old join pages was never a real field on RoomUserVO — those pages were effectively broken - Replaced the pick-from-list join flow with JWT-based user detection; PinEntry now uses User.id from JWT - Always verify referenced properties exist in the VO type before building UI around them

[2026-06-06] - Pushed commits to `master` without first checking the repo's default branch (`main`), creating diverged histories - Merged `master` → `main` with `--allow-unrelated-histories`, pushed to `origin/main` - Always check the default branch before the first push; never assume it is `master`

[2026-06-08] - Spent too long investigating i18n root-layout issues instead of just fixing the 404 - User explicitly said to remove i18n; over-analysis of i18n details caused frustration - When the user says to remove something, remove it immediately; don't get bogged down in preserving complexity they don't want
