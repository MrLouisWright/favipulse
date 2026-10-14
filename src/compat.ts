/**
 * Drop-in shims for favico.js and tinycon so you can migrate first and refactor later.
 * Only the commonly used surface is covered; see the migration guide.
 */
import { favipulse, type Favipulse, type FavipulseOptions } from './index.js';

export interface FavicoOptions { bgColor?: string; textColor?: string; animation?: string; type?: string; position?: string }

/** favico.js-compatible class: `new Favico({ animation: 'pop' }).badge(3)`. */
export class Favico {
  private f: Favipulse;
  constructor(o: FavicoOptions & FavipulseOptions = {}) {
    this.f = favipulse({ ...o, badgeBg: o.bgColor, badgeFg: o.textColor, seed: o.seed });
    if (o.animation && o.animation != 'none') this.anim = true;
  }
  private anim = false;
  badge(n: number | string, o?: FavicoOptions) {
    this.f.badge(n, { badgeBg: o?.bgColor, badgeFg: o?.textColor });
    if (this.anim && n) { this.f.pulse(true); setTimeout(() => this.f.pulse(false), 600); }
  }
  reset() { this.f.reset(); }
  /** favico.js drew external images/video; favipulse only accepts an SVG seed icon. No-op kept for compatibility. */
  image() {}
  video() {}
  webcam() {}
  get favipulse() { return this.f; }
}

export interface TinyconOptions { colour?: string; color?: string; background?: string; fallback?: boolean | 'force'; abbreviate?: boolean }

let tc: Favipulse | null = null, topt: TinyconOptions = {};
const t = () => (tc ||= favipulse());

/** tinycon-compatible singleton: `Tinycon.setBubble(5)`. */
export const Tinycon = {
  setOptions(o: TinyconOptions) { topt = { ...topt, ...o }; return Tinycon; },
  setBubble(n: number | string | null) {
    const v = typeof n == 'number' && n > 999 && topt.abbreviate !== false ? Math.round(n / 1000) + 'k' : n;
    t().badge(v, { badgeBg: topt.background, badgeFg: topt.colour || topt.color });
    if (topt.fallback == 'force' && typeof document != 'undefined') {
      const base = document.title.replace(/^\(\S+\)\s/, '');
      document.title = n ? `(${v}) ${base}` : base;
    }
    return Tinycon;
  },
  setImage() { return Tinycon; },
  reset() { t().reset(); return Tinycon; },
};

export default Tinycon;
