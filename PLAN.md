# favipulse — plan

**Goal:** a tiny (< 3 KB gzip core), zero-dependency, typed ESM+CJS favicon library and CLI by Louis Wright, positioned as the maintained replacement for favico.js (~43k/wk, last real release 2015) and tinycon (~11k/wk, 2017).

## Modelled on
workflow-sentinel, csp-forge, header-sentinel: shields badge row + one-line pitch, Install, Usage, API, comparison table, Support, License; `docs/` site on the shared "Louis Wright tools — shared theme v2" stylesheet with support/author/more-tools sections; SHA-pinned least-privilege CI (Node 18/20/22) + release (npm provenance + GitHub Packages `@mrlouiswright/favipulse`).
Differences: Pages are deployed **via Actions** (others use legacy `main:/docs`), and favipulse has a wiki.

## Competitor check
GitHub/npm search: favico.js (8.7k★, last push 2017), tinycon (5.1k★, 2023 push, last release 2017), Notificon (2021), piecon (119/wk), favicon-badge (35/wk), svelte-favicon-badge (framework-specific). Nobody combines identicon + badge + progress + per-environment icons + static generator. npm name `favipulse` free.

## Architecture
- `src/core.ts` – FNV-1a hash, mulberry32 PRNG, `icon(seed)` → primitive list (rects/circles/arcs), `toSVG()`; pure, SSR-safe.
- `src/env.ts` – `detectEnv(host)`, env presets (dev/staging/prod: palette + label).
- `src/index.ts` – browser controller `favipulse()` with `badge`, `progress`, `pulse`, `draw` (self-drawing), `setSeed`, `reset`, `destroy`; SVG data-URI by default, optional canvas PNG with automatic SVG fallback; honours `prefers-reduced-motion`.
- `src/compat.ts` – `Favico` / `Tinycon` drop-in shims for migration.
- `src/raster.ts` + `src/ico.ts` (Node only) – supersampled rasterizer → PNG (zlib) and ICO; used by CLI and plugins.
- `src/vite.ts`, `src/next.ts` – Vite plugin (emit + inject per mode) and Next.js metadata helper.
- `bin/favipulse.js` – `favipulse generate` → per env: favicon.svg/.ico, 16/32/48/180/192/512 PNG, manifest + HTML snippet.

## Quality
node:test + jsdom (no canvas → SVG fallback), reduced-motion, determinism, PNG/ICO byte checks, size budget test (core min+gz < 3072 B), ESM/CJS smoke in CI, workflow-sentinel `--fail-on medium` clean.

## Ship
Public repo, Pages via Actions with interactive demo, wiki (7 pages), CI green → v1.0.0 via `tools/publish-nofallback.sh` (npm job gated off: npm E429 for new names; queued at top of `tools/npm-pending.txt`).
