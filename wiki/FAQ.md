# FAQ

**Does the same seed really give the same icon everywhere?**
Yes. The pattern comes from an FNV-1a hash of the seed and a mulberry32 PRNG, with no `Math.random`, dates or locale. Browser, Node and the CLI produce identical SVG, and the CLI's PNGs are rasterised from the same shape list.

**How many distinct icons are there?**
The 5×5 mirrored grid has 15 on/off cells (32,768 patterns) times 360 hues and three styles. Collisions between a handful of apps are very unlikely.

**Which browsers support it?**
SVG favicons work in Chrome, Edge, Firefox and Opera. Safari ignores SVG favicons: use `format: 'auto'` (canvas PNG on Safari) and ship the CLI's `favicon.ico`.

**What if canvas is unavailable?**
favipulse doesn't need canvas. The default path is pure SVG. With `format: 'png'` and no canvas (jsdom, strict CSPs, some privacy modes) it keeps the SVG.

**Does it work with a strict Content-Security-Policy?**
favipulse sets `href` to a `data:` URI, so allow `img-src data:`. No inline scripts or styles are injected.

**SSR / Next.js / Remix?**
Importing is side-effect free and `favipulse()` without a document is a no-op. Call it in `useEffect` / `onMounted`, or use the pure `toSVG()` / `envSVG()` helpers on the server.

**Why are my animations slow in background tabs?**
Browsers throttle timers in hidden tabs. Badge and progress changes still land; the pulse just runs at a lower rate.

**Does it respect reduced motion?**
Yes, by default. `draw()` shows the final frame and `pulse()` a static halo when `prefers-reduced-motion: reduce` is set.

**Can I use my own logo instead of a generated icon?**
Not yet. favipulse draws generated icons. Badging arbitrary images is on the roadmap.

**How big is it?**
Core 2.9 KB min+gzip (2.7 KB brotli), no dependencies. The Node-only rasteriser, CLI and plugins aren't in the browser bundle.

**Is it maintained?**
Yes. CI runs on Node 18/20/22, releases are published with npm provenance, and issues are welcome at <https://github.com/MrLouisWright/favipulse/issues>.
