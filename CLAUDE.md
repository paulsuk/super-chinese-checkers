# Super Chinese Checkers

House-rules ("super" variant) Chinese checkers as an offline-first PWA for two players
pass-and-play on iPhone/iPad. Deploys to `https://paulsuk.github.io/super-chinese-checkers/`.

**Status:** live at `https://paulsuk.github.io/super-chinese-checkers/` (installable PWA).
Repo `paulsuk/super-chinese-checkers` (public); `origin` remote; GitHub Pages source =
GitHub Actions; **auto-deploys on every push to `master`** (`.github/workflows/deploy.yml`
runs tests + build + deploy). Paul controls all pushes.

## Rules of the game (summary)

6 armies of 10 on the standard 121-cell star; each player owns 3 adjacent corners, each
color targets its opposite corner. One move per turn with any owned color. Per-color
movement is forward + sideways only (never backward), enforced per hop. Symmetric "super"
jumps (over a piece N away, land N beyond, gaps empty) with free chaining. Win = first
player with all 30 pieces home; the loser then finishes out alone and the extra turns
taken = margin of victory. App enforces rules but shows no hints. Full detail in
`work\archive\2026-07-10-super-chinese-checkers-design.md`.

## Conventions

- Stack: Vite + React + TS + Tailwind; pure-TS rules engine in `src/engine/` (no React
  imports), state/persistence in `src/state/`, components in `src/ui/`.
- Engine changes require Vitest coverage; UI verified on-device before deploy. Pure logic
  extracted from UI (e.g. `src/ui/setupDraft.ts`) is unit-tested; there is no DOM test env.
- Per-game display lives in `GameMeta { palette[6], players[2] }` (`src/state/meta.ts`, own
  IndexedDB key) — the engine stays display-agnostic (`ColorId` 0-5 = corner identity).
- Stats are name-based (`winnerName`/`loserName`); roster + stats-exempt `Guest` pseudo-player;
  named-vs-Guest records for the real player (W/L), Guest excluded from standings; both-Guest
  not recorded. Setup screen drafts colors via pointer drag-and-drop (touch-safe).
- Session ritual, doc placement, `work\` rules: see `..\POLICIES.md`.
