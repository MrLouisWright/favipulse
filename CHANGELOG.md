# Changelog

## 1.1.0 (2026-10-15)

### Added
- Optional `credit` / `creditTarget` on `favipulse()`: when `credit: true`, appends a small CSP-safe link (`class="favipulse-credit"`, no inline styles) to `document.body` or a chosen container. Off by default; no network or tracking. `destroy()` removes it.


## 1.0.0 (2026-10-14)

First release.

- `favipulse()` live controller: deterministic generative favicon from a seed, `draw()` self-drawing animation, `badge()`, `progress()` ring, `pulse()`, `reset()`, `destroy()`.
- Environment presets (dev / staging / prod, plus custom) with `env: 'auto'` hostname detection.
- SVG by default; optional canvas PNG with automatic SVG fallback; honours `prefers-reduced-motion`; SSR-safe.
- `favipulse` CLI: per-environment `favicon.svg`, `favicon.ico`, 16/32/48/180/192/512 PNGs, `manifest.webmanifest`, `head.html`.
- `favipulse/vite` plugin, `favipulse/next` helpers, `favipulse/compat` (favico.js and tinycon shims), `favipulse/node` API.
- 2.9 KB min+gzip core, zero dependencies, TypeScript types, ESM + CJS + IIFE.
