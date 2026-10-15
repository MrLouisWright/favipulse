import { icon, toSVG, dataURI, type Icon, type IconOptions, type Overlay } from './core.js';
import { ENVS, detectEnv, type Env } from './env.js';

export * from './core.js';
export * from './env.js';

export interface FavipulseOptions extends IconOptions, Omit<Overlay, 'pulse' | 'reveal'> {
  /** Start pulsing immediately. */
  pulse?: boolean;
  /** Seed for the generated icon. Default: `location.host`. */
  seed?: string;
  /** Environment preset (`dev`, `staging`, `prod`), `auto` to detect from the hostname, or omit. */
  env?: Env | 'auto';
  /** Render as `svg` (default), `png` (canvas, falls back to SVG when unavailable) or `auto`. */
  format?: 'svg' | 'png' | 'auto';
  /** PNG size when rendering through canvas. Default 64. */
  size?: number;
  /** Respect `prefers-reduced-motion: reduce` (no self-draw, no pulse animation). Default true. */
  reducedMotion?: boolean;
  /** Frames per second for animations (favicons don't need 60). Default 12. */
  fps?: number;
  /** Document to operate on (tests, iframes). Default: global `document`. */
  document?: Document;
  /**
   * When true, append a small unobtrusive credit link ("Built with favipulse").
   * Off by default — MIT needs no attribution. No network calls or tracking.
   * The link uses class `favipulse-credit` (no inline styles; CSP-safe).
   */
  credit?: boolean;
  /** Element or CSS selector to append the credit link into. Default: `document.body`. */
  creditTarget?: HTMLElement | string;
}

export interface Favipulse {
  /** Current SVG markup. */
  readonly svg: string;
  /** The managed `<link rel="icon">`. */
  readonly link: HTMLLinkElement | null;
  /** Show a count or short text; 0 / null / '' hides it. */
  badge(v: number | string | null, o?: Pick<Overlay, 'badgeBg' | 'badgeFg'>): Favipulse;
  /** Show progress 0-1 (or 0-100); null hides the ring. */
  progress(v: number | null): Favipulse;
  /** Start (true) or stop (false) a pulsing halo, e.g. for "needs attention". */
  pulse(on?: boolean): Favipulse;
  /** Self-drawing animation of the icon. Resolves when done. */
  draw(ms?: number): Promise<Favipulse>;
  /** Change the seed / options and re-render. */
  set(o: FavipulseOptions): Favipulse;
  /** Clear badge, progress and pulse. */
  reset(): Favipulse;
  /** Stop animations and restore the original favicon. */
  destroy(): void;
}

const reduced = (w: any) => !!(w && w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches);

/** Rasterise SVG to a PNG data URI via canvas. Resolves null when canvas/Image are unavailable. */
export const svgToPNG = (svg: string, size = 64, doc: Document = document): Promise<string | null> =>
  new Promise((done) => {
    try {
      const c = doc.createElement('canvas'), g = c.getContext && c.getContext('2d'), I = (doc.defaultView as any)?.Image;
      if (!g || !I) return done(null);
      c.width = c.height = size;
      const img = new I();
      img.onload = () => { try { g.drawImage(img, 0, 0, size, size); done(c.toDataURL('image/png')); } catch { done(null); } };
      img.onerror = () => done(null);
      img.src = dataURI(svg);
    } catch { done(null); }
  });

/** Create a live favicon controller. Safe to call during SSR (does nothing without a document). */
export const favipulse = (opts: FavipulseOptions = {}): Favipulse => {
  const d: Document | undefined = opts.document || (typeof document != 'undefined' ? document : undefined);
  const w: any = d && d.defaultView;
  let o: FavipulseOptions = {}, ic: Icon, svg = '', timer: any = 0, pulseOn = false, phase: number | null = null, reveal = 1, token = 0;
  let stripe: string | undefined;
  let link: HTMLLinkElement | null = null, prev: string | null = null, owned = false;
  let creditEl: HTMLAnchorElement | null = null;
  const syncCredit = () => {
    if (!d) return;
    if (!o.credit) { creditEl?.remove(); creditEl = null; return; }
    if (!creditEl) {
      creditEl = d.createElement('a');
      creditEl.className = 'favipulse-credit';
      creditEl.href = 'https://louiswright.co.uk';
      creditEl.rel = 'noopener';
      creditEl.textContent = 'Built with favipulse';
    }
    const t = o.creditTarget, target = !t ? d.body : typeof t == 'string' ? d.querySelector(t) : t;
    if (target && creditEl.parentNode != target) target.appendChild(creditEl);
  };
  if (d) {
    link = d.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    if (link) prev = link.getAttribute('href'), link.removeAttribute('sizes');
    else { link = d.createElement('link'); link.rel = 'icon'; d.head.appendChild(link); owned = true; }
  }
  const still = () => opts.reducedMotion !== false && reduced(w);
  const build = () => {
    const env = o.env == 'auto' ? detectEnv(w?.location?.hostname || '') : o.env;
    const pre = (env && ENVS[env]) || {};
    ic = icon(o.seed ?? (w?.location?.host || 'favipulse'), { ...pre, ...o, hue: o.hue ?? pre.hue });
    stripe = o.stripe ?? pre.stripe;
  };
  const render = () => {
    svg = toSVG(ic, { ...o, stripe, pulse: phase, reveal } as Overlay);
    if (!link) return;
    const fmt = o.format || 'svg', s = svg, t = ++token;
    link.type = 'image/svg+xml';
    const ua = w?.navigator?.userAgent || '';
    link.href = dataURI(s); // SVG first; upgraded to PNG when asked for and canvas works
    if (fmt == 'svg' || (fmt == 'auto' && !(/Safari/.test(ua) && !/Chrom|Edg/.test(ua)))) return;
    svgToPNG(s, o.size || 64, d).then((png) => { if (png && t == token && link) { link.type = 'image/png'; link.href = png; } });
  };
  const loop = () => {
    clearInterval(timer); timer = 0;
    if (!pulseOn || still()) { phase = pulseOn ? 0 : null; return render(); }
    const t0 = Date.now();
    phase = 0; render();
    timer = setInterval(() => { phase = ((Date.now() - t0) % 1200) / 1200; render(); }, 1000 / (o.fps || 12));
  };
  const api: Favipulse = {
    get svg() { return svg; },
    get link() { return link; },
    badge(v, b) { o.badge = v; Object.assign(o, b); render(); return api; },
    progress(v) { o.progress = v == null ? null : v > 1 ? v / 100 : v; render(); return api; },
    pulse(on = true) { pulseOn = on; loop(); return api; },
    draw(ms = 900) {
      return new Promise((done) => {
        if (still() || !d) { reveal = 1; render(); return done(api); }
        const t0 = Date.now(), fin = () => { reveal = 1; render(); done(api); };
        reveal = 0; render();
        const id = setInterval(() => { reveal = Math.min(1, (Date.now() - t0) / ms); render(); if (reveal >= 1) { clearInterval(id); fin(); } }, 1000 / (o.fps || 12));
      });
    },
    set(n) { o = { ...o, ...n }; build(); render(); syncCredit(); return api; },
    reset() { o.badge = o.progress = null; pulseOn = false; loop(); return api; },
    destroy() {
      clearInterval(timer); pulseOn = false;
      creditEl?.remove(); creditEl = null;
      if (!link) return;
      if (owned) link.remove(); else if (prev != null) link.href = prev;
      link = null;
    },
  };
  api.set(opts);
  if (opts.pulse) api.pulse(true);
  return api;
};

export default favipulse;
