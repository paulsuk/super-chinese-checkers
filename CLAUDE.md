# Super Chinese Checkers

House-rules ("super" variant) Chinese checkers as an offline-first PWA for two players
pass-and-play on iPhone/iPad. Deploys to `https://paulsuk.github.io/super-chinese-checkers/`.

**Status:** design approved, no code yet. Design spec:
`work\specs\2026-07-10-super-chinese-checkers-design.md`.

## Rules of the game (summary)

6 armies of 10 on the standard 121-cell star; each player owns 3 adjacent corners, each
color targets its opposite corner. One move per turn with any owned color. Per-color
movement is forward + sideways only (never backward), enforced per hop. Symmetric "super"
jumps (over a piece N away, land N beyond, gaps empty) with free chaining. Win = first
player with all 30 pieces home; the loser then finishes out alone and the extra turns
taken = margin of victory. App enforces rules but shows no hints. Full detail in the spec.

## Conventions

- Stack: Vite + React + TS + Tailwind; pure-TS rules engine in `src/engine/` (no React
  imports), state/persistence in `src/state/`, components in `src/ui/`.
- Engine changes require Vitest coverage; UI verified on-device over LAN before deploy.
- Session ritual, doc placement, `work\` rules: see `..\POLICIES.md`.
