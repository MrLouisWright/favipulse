/** Pure, DOM-free icon model + SVG serialiser. Safe in Node, workers and SSR. */

export type Style = 'grid' | 'dots' | 'rings';
export type Shape =
  | { t: 'r'; x: number; y: number; w: number; h: number; r: number; f: string }
  | { t: 'c'; x: number; y: number; r: number; f: string }
  | { t: 'a'; x: number; y: number; r: number; w: number; p: number; f: string; o?: number };

export interface IconOptions {
  /** Pattern style. Default `grid`. */
  style?: Style;
  /** Hue 0-360. Default: derived from the seed. */
  hue?: number;
  /** Foreground colour (overrides hue). */
  fg?: string;
  /** Background colour. Default: a dark tint of the hue. `transparent` for none. */
  bg?: string;
  /** Corner radius of the background, 0-32. Default 14. */
  radius?: number;
}

export interface Icon { seed: string; fg: string; bg: string; shapes: Shape[]; cells: number }

/** FNV-1a 32-bit hash. */
export const hash = (s: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x1000193);
  return h >>> 0;
};

/** mulberry32 PRNG: deterministic floats in [0, 1). */
export const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** HSL (0-360, 0-100, 0-100) to #rrggbb. */
export const hsl = (h: number, s: number, l: number): string => {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const c = (n: number) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
  return '#' + [c(0), c(8), c(4)].map((v) => v.toString(16).padStart(2, '0')).join('');
};

/**
 * Build a deterministic icon from a seed. Same seed + options → same shapes, everywhere.
 * Coordinates live in a 64×64 box. Shape order is the "draw order" used by self-drawing.
 */
export const icon = (seed: string, o: IconOptions = {}): Icon => {
  const h0 = hash(seed), r = rng(h0);
  const hue = o.hue ?? h0 % 360;
  const fg = o.fg || hsl(hue, 70, 58);
  const bg = o.bg || hsl(hue, 35, 12);
  const shapes: Shape[] = [];
  const style = o.style || 'grid';
  if (style == 'rings') {
    for (let i = 0; i < 4; i++)
      shapes.push({ t: 'a', x: 32, y: 32, r: 24 - i * 6, w: 4, p: 0.25 + r() * 0.75, o: r(), f: i % 2 ? fg : hsl(hue + 40, 70, 62) });
  } else {
    // 5×5 grid mirrored around the vertical axis (15 decisions), never empty
    for (let y = 0; y < 5; y++)
      for (let x = 0; x < 3; x++)
        if (r() > 0.5 || (y == 2 && x == 2 && !shapes.length))
          for (const cx of x == 2 ? [2] : [x, 4 - x])
            shapes.push(style == 'dots'
              ? { t: 'c', x: 12.8 + cx * 9.6, y: 12.8 + y * 9.6, r: 3.4 + ((cx * 3 + y * 7) % 5) * 0.3, f: fg }
              : { t: 'r', x: 8 + cx * 9.6, y: 8 + y * 9.6, w: 9.6, h: 9.6, r: 0, f: fg });
  }
  if (bg != 'transparent') shapes.unshift({ t: 'r', x: 0, y: 0, w: 64, h: 64, r: o.radius ?? 14, f: bg });
  return { seed, fg, bg, shapes, cells: shapes.length };
};

const n = (v: number) => +v.toFixed(2);

/** Serialise one shape to SVG. */
export const shapeSVG = (s: Shape): string =>
  s.t == 'r'
    ? `<rect x="${n(s.x)}" y="${n(s.y)}" width="${n(s.w)}" height="${n(s.h)}"${s.r ? ` rx="${s.r}"` : ''} fill="${s.f}"/>`
    : s.t == 'c'
      ? `<circle cx="${n(s.x)}" cy="${n(s.y)}" r="${n(s.r)}" fill="${s.f}"/>`
      : `<circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="none" stroke="${s.f}" stroke-width="${s.w}" pathLength="100" stroke-dasharray="${n(s.p * 100)} 100" stroke-linecap="round" transform="rotate(${n(-90 + (s.o || 0) * 360)} ${s.x} ${s.y})"/>`;

export interface Overlay {
  /** Badge content: a number (0 hides it; >99 shows "99+") or short text. */
  badge?: number | string | null;
  /** Badge colours. */
  badgeBg?: string; badgeFg?: string;
  /** Progress 0-1 drawn as a ring; null/undefined hides it. */
  progress?: number | null;
  /** Progress ring colour. Default: the icon foreground. */
  ringColor?: string;
  /** Pulse phase 0-1 (halo around badge/dot). */
  pulse?: number | null;
  /** Fraction of shapes drawn (self-drawing animation). Default 1. */
  reveal?: number;
  /** Environment stripe colour (bottom band). */
  stripe?: string;
}

export const badgeText = (b: number | string | null | undefined): string =>
  b == null || b === 0 || b === '' ? '' : typeof b == 'number' ? (b > 99 ? '99+' : '' + Math.max(0, Math.floor(b))) : ('' + b).slice(0, 3);

/** Full SVG document for an icon plus optional overlays. */
export const toSVG = (ic: Icon, ov: Overlay = {}): string => {
  const reveal = Math.max(0, Math.min(1, ov.reveal ?? 1));
  const bgShape = ic.bg != 'transparent' ? 1 : 0;
  const count = bgShape + Math.round((ic.shapes.length - bgShape) * reveal);
  let out = ic.shapes.slice(0, count).map(shapeSVG).join('');
  if (ov.stripe) out += `<rect x="8" y="57.5" width="48" height="4.5" rx="2.25" fill="${ov.stripe}"/>`;
  const p = ov.progress;
  if (p != null) {
    const rc = ov.ringColor || ic.fg;
    out += `<circle cx="32" cy="32" r="29" fill="none" stroke="${rc}" stroke-opacity=".25" stroke-width="6"/>` +
      shapeSVG({ t: 'a', x: 32, y: 32, r: 29, w: 6, p: Math.max(0, Math.min(1, p)), f: rc });
  }
  const t = badgeText(ov.badge);
  const pulse = ov.pulse;
  if (t || pulse != null) {
    const bw = t.length > 1 ? 14 + t.length * 7 : 28, bx = 64 - bw, bb = ov.badgeBg || '#ef4444';
    if (pulse != null) out += `<circle cx="${64 - bw / 2}" cy="14" r="${n(14 + pulse * 10)}" fill="${bb}" opacity="${n(0.6 * (1 - pulse))}"/>`;
    out += t
      ? `<rect x="${bx}" width="${bw}" height="28" rx="14" fill="${bb}"/><text x="${64 - bw / 2}" y="22" font-family="system-ui,sans-serif" font-size="${t.length > 2 ? 18 : 22}" font-weight="700" text-anchor="middle" fill="${ov.badgeFg || '#fff'}">${t.replace(/[<&]/g, '')}</text>`
      : `<circle cx="50" cy="14" r="10" fill="${bb}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${out}</svg>`;
};

/** SVG → data: URI suitable for `<link rel="icon">`. */
export const dataURI = (svg: string): string => 'data:image/svg+xml,' + encodeURIComponent(svg);
