# Getting Started

## Install

```bash
npm i favipulse
```

No bundler? `<script src="https://unpkg.com/favipulse"></script>` exposes `window.favipulse`.

## 1. A generated favicon

```js
import { favipulse } from 'favipulse';
const fav = favipulse({ seed: 'acme' });
```

favipulse finds your `<link rel="icon">` (or creates one) and points it at an SVG data URI. The same seed always produces the same icon, in every browser and in Node.

## 2. Make it draw itself

```js
await fav.draw(1200); // ms; instant when the user prefers reduced motion
```

## 3. Show something

```js
fav.badge(5);        // unread count
fav.progress(0.6);   // progress ring
fav.pulse();         // attention halo
fav.reset();         // back to plain
```

## 4. Tell environments apart

```js
favipulse({ seed: 'acme', env: 'auto' }); // localhost → dev, staging.* → staging, else prod
```

## 5. Ship static files too

```bash
npx favipulse generate --seed acme --out public/favicons
```

Then paste `public/favicons/prod/head.html` into your `<head>` (or use the [Vite plugin / Next.js helper](API#framework-helpers)).

## TypeScript

Types ship in the package. `import type { Favipulse, FavipulseOptions } from 'favipulse'`.

## CommonJS

```js
const { favipulse } = require('favipulse');
```
