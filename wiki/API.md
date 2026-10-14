# API

## `favipulse(options?)`

Creates a live favicon controller. Safe to call during SSR: without a `document` it returns a controller that still renders `svg` but touches nothing.

| Option | Type | Default | Notes |
|---|---|---|---|
| `seed` | `string` | `location.host` | Same seed, same icon |
| `env` | `'dev' \| 'staging' \| 'prod' \| string \| 'auto'` | none | See [[Environments]] |
| `style` | `'grid' \| 'dots' \| 'rings'` | `'grid'` | Env presets set their own style |
| `hue` | `number` | from seed | 0-360 |
| `fg`, `bg` | `string` | from hue | `bg: 'transparent'` drops the tile |
| `radius` | `number` | `14` | Tile corner radius (0-32) |
| `badge` | `number \| string` | none | 0 / `''` / `null` hides; >99 → `99+`; text is cut to 3 chars |
| `badgeBg`, `badgeFg` | `string` | `#ef4444`, `#fff` | |
| `progress` | `number \| null` | none | 0-1 |
| `ringColor` | `string` | icon `fg` | |
| `stripe` | `string` | env preset | Bottom bar colour |
| `pulse` | `boolean` | `false` | Start pulsing |
| `format` | `'svg' \| 'png' \| 'auto'` | `'svg'` | `png` rasterises through canvas and keeps SVG if canvas is unavailable; `auto` = PNG on Safari only |
| `size` | `number` | `64` | Canvas PNG size |
| `reducedMotion` | `boolean` | `true` | Respect `prefers-reduced-motion: reduce` |
| `fps` | `number` | `12` | Animation frame rate |
| `document` | `Document` | global | |

### Controller

| Member | Description |
|---|---|
| `badge(v, { badgeBg, badgeFg }?)` | Set/clear the badge |
| `progress(v)` | 0-1 or 0-100; `null` hides |
| `pulse(on = true)` | Start/stop the halo animation |
| `draw(ms = 900)` | Self-drawing animation; returns a Promise |
| `set(options)` | Merge options (seed, env, style...) and re-render |
| `reset()` | Clear badge, progress and pulse |
| `destroy()` | Stop timers, restore the previous favicon (or remove the link favipulse created) |
| `svg` | Current SVG markup |
| `link` | The managed `HTMLLinkElement` |

All methods except `draw` and `destroy` return the controller, so calls chain.

## Pure helpers

```js
import { icon, toSVG, dataURI, envSVG, detectEnv } from 'favipulse';
const svg = toSVG(icon('acme', { style: 'dots' }), { badge: 3, progress: 0.5 });
```

| Export | Signature |
|---|---|
| `icon` | `(seed, { style, hue, fg, bg, radius }?) → Icon` |
| `toSVG` | `(icon, { badge, badgeBg, badgeFg, progress, ringColor, pulse, reveal, stripe }?) → string` |
| `dataURI` | `(svg) → string` |
| `envIcon` / `envSVG` | `(seed, env, overrides?)` |
| `ENVS` | Preset table; add keys for custom environments |
| `detectEnv` | `(hostname = location.hostname) → env` |
| `svgToPNG` | `(svg, size, document) → Promise<string \| null>` |
| `hash`, `rng`, `hsl`, `badgeText` | Low-level building blocks |

## `favipulse/node`

```js
import { generate, writeSet } from 'favipulse/node';
writeSet('public/favicons', generate({ seed: 'acme', env: 'prod', base: '/favicons/' }));
```

`generate(options)` returns `{ 'favicon.svg', 'favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'favicon-48x48.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'manifest.webmanifest', 'head.html' }`. Options: everything from `icon()` plus `seed`, `env`, `name`, `base`, `small`. Also exports `rasterize`, `encodePNG`, `encodeICO`.

## CLI

```
favipulse generate --seed <text> [--env dev,staging,prod] [--out favicons] [--flat] [--style grid|dots|rings]
                   [--hue n] [--fg c] [--bg c] [--radius n] [--name text] [--base url] [--small] [--json]
favipulse svg --seed <text> [--env prod]
```

Exit codes: `0` ok, `1` no command, `2` bad arguments.

## Framework helpers

### Vite: `favipulse/vite`

```js
import favipulse from 'favipulse/vite';
plugins: [favipulse({ seed: 'acme', dir: 'icons', env: (mode) => (mode === 'qa' ? 'staging' : undefined) })]
```

### Next.js: `favipulse/next`

- `faviconMetadata({ seed, env? })` → `metadata.icons`
- `iconRoute({ seed, env? })` → route handler for `app/icon.svg/route.ts`
- `nextEnv(env = process.env)` → maps `NEXT_PUBLIC_APP_ENV`, `APP_ENV`, `VERCEL_ENV`, `NODE_ENV`

## `favipulse/compat`

`Favico` and `Tinycon` shims, see [[Migrating from favico.js and tinycon|Migrating-from-favico.js-and-tinycon]].
