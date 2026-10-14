# Migrating from favico.js and tinycon

favico.js (~43k downloads/week) hasn't had a release since 2015 and tinycon (~11k/week) since 2017. Neither ships types or ESM, and both need canvas. favipulse covers their badge use case in a similar size and adds progress, pulse, generated and per-environment icons.

## Step 1: drop-in shim

```bash
npm rm favico.js tinycon && npm i favipulse
```

### favico.js

```diff
- import Favico from 'favico.js';
+ import { Favico } from 'favipulse/compat';
  const favicon = new Favico({ animation: 'popFade', bgColor: '#5CB85C', textColor: '#fff' });
  favicon.badge(12);
  favicon.reset();
```

### tinycon

```diff
- import Tinycon from 'tinycon';
+ import { Tinycon } from 'favipulse/compat';
  Tinycon.setOptions({ background: '#549A2F', colour: '#ffffff', fallback: true });
  Tinycon.setBubble(6);
```

Script tag users: `<script src="https://unpkg.com/favipulse/dist/favipulse-compat.global.js"></script>`, then `favipulseCompat.Favico` / `favipulseCompat.Tinycon`.

## Step 2: move to the native API

### favico.js mapping

| favico.js | favipulse |
|---|---|
| `new Favico({ bgColor, textColor })` | `favipulse({ badgeBg, badgeFg })` |
| `favicon.badge(n)` | `fav.badge(n)` |
| `favicon.badge(n, { bgColor })` | `fav.badge(n, { badgeBg })` |
| `favicon.reset()` | `fav.reset()` |
| `animation: 'slide' \| 'fade' \| 'pop' \| 'popFade'` | `fav.pulse()` (shim pulses briefly on each badge) |
| `type: 'circle' \| 'rectangle'`, `position` | not configurable; pill top-right |
| `fontFamily`, `fontStyle` | system font |
| `favicon.image(img)` / `video()` / `webcam()` | not supported: favipulse draws generated icons. Keep favico.js if you need these |
| `elementId`, `dataUrl` callback | `favipulse({ document })`, `fav.svg` / `dataURI(fav.svg)` |

### tinycon mapping

| tinycon | favipulse |
|---|---|
| `Tinycon.setBubble(n)` | `fav.badge(n)` |
| `Tinycon.setOptions({ background, colour })` | `favipulse({ badgeBg, badgeFg })` |
| `width`, `height`, `font` | not needed (vector) |
| `abbreviate: true` (1000 → 1k) | shim: yes; native: `>99` → `99+`, or pass text |
| `fallback: true` (title when no canvas) | not needed: SVG works without canvas |
| `fallback: 'force'` | shim prefixes `document.title` with `(n)` |
| `Tinycon.setImage(url)` | `favipulse({ seed })` |
| `Tinycon.reset()` | `fav.reset()` |

## What you gain

- `fav.progress(0.4)` progress ring, `fav.pulse()`, `fav.draw()`
- `env: 'auto'` per-environment icons
- Static `favicon.ico`/PNG/SVG + manifest via `npx favipulse generate`
- TypeScript types, ESM + CJS, SSR safety, `prefers-reduced-motion`

## Behaviour differences

- favipulse replaces the favicon with its own generated icon. To badge your existing logo, use favico.js for now; badging arbitrary images is on the roadmap.
- Default output is SVG. Safari doesn't render SVG favicons: use `format: 'auto'` and keep a static `favicon.ico`.
