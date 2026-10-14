/** Node API: static favicon sets per environment (used by the CLI, Vite plugin and Next.js helper). */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { envIcon, envSVG, ENVS, type Env, type EnvPreset } from './env.js';
import { rasterize, encodePNG, encodeICO } from './raster.js';
import type { Shape } from './core.js';

export * from './raster.js';
export * from './env.js';
export * from './core.js';

export const PNG_SIZES = { 'favicon-16x16.png': 16, 'favicon-32x32.png': 32, 'favicon-48x48.png': 48, 'apple-touch-icon.png': 180, 'icon-192.png': 192, 'icon-512.png': 512 } as const;

export interface GenerateOptions extends EnvPreset {
  seed: string;
  env?: Env;
  /** App name for the manifest snippet. Default: the seed. */
  name?: string;
  /** URL prefix used in the HTML/manifest snippets. Default `/`. */
  base?: string;
  /** Skip the big PNGs (192/512/180) for speed. */
  small?: boolean;
}

/** Build every file of a favicon set in memory. Keys are file names. */
export const generate = (o: GenerateOptions): Record<string, string | Buffer> => {
  const env = o.env || 'prod', base = (o.base ?? '/').replace(/\/?$/, '/');
  const { icon, stripe } = envIcon(o.seed, env, o);
  const extra: Shape[] = stripe ? [{ t: 'r', x: 8, y: 57.5, w: 48, h: 4.5, r: 2.25, f: stripe }] : [];
  const png = (n: number) => encodePNG(rasterize(icon, n, extra, n > 64 ? 2 : 4), n);
  const files: Record<string, string | Buffer> = { 'favicon.svg': envSVG(o.seed, env, o) };
  const cache: Record<number, Buffer> = {};
  for (const [f, n] of Object.entries(PNG_SIZES)) if (!o.small || n <= 48) files[f] = cache[n] = png(n);
  files['favicon.ico'] = encodeICO([16, 32, 48].map((size) => ({ size, png: cache[size] })));
  const name = o.name || o.seed + (env == 'prod' ? '' : ` (${env})`);
  files['manifest.webmanifest'] = JSON.stringify({
    name, short_name: name.slice(0, 12), theme_color: icon.fg, background_color: icon.bg == 'transparent' ? '#ffffff' : icon.bg, display: 'standalone',
    icons: [
      { src: base + 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
      ...(o.small ? [] : [192, 512].map((n) => ({ src: `${base}icon-${n}.png`, sizes: `${n}x${n}`, type: 'image/png' }))),
    ],
  }, null, 2) + '\n';
  files['head.html'] = [
    `<link rel="icon" href="${base}favicon.ico" sizes="48x48">`,
    `<link rel="icon" href="${base}favicon.svg" type="image/svg+xml">`,
    o.small ? '' : `<link rel="apple-touch-icon" href="${base}apple-touch-icon.png">`,
    `<link rel="manifest" href="${base}manifest.webmanifest">`,
    `<meta name="theme-color" content="${icon.fg}">`,
  ].filter(Boolean).join('\n') + '\n';
  return files;
};

/** Write a set to disk. Returns the written paths. */
export const writeSet = (dir: string, files: Record<string, string | Buffer>): string[] => {
  mkdirSync(dir, { recursive: true });
  return Object.entries(files).map(([f, c]) => (writeFileSync(join(dir, f), c), join(dir, f)));
};

export const DEFAULT_ENVS = Object.keys(ENVS) as Env[];
