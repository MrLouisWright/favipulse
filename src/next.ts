/** Next.js helpers (App Router). */
import { envSVG, detectEnv, type Env, type EnvPreset } from './env.js';
import { dataURI } from './core.js';

/** Environment from VERCEL_ENV / NEXT_PUBLIC_APP_ENV / NODE_ENV. */
export const nextEnv = (e: Record<string, string | undefined> = typeof process != 'undefined' ? process.env : {}): Env => {
  const v = e.NEXT_PUBLIC_APP_ENV || e.APP_ENV || e.VERCEL_ENV;
  if (v) return v == 'production' ? 'prod' : v == 'preview' ? 'staging' : v == 'development' ? 'dev' : v;
  return e.NODE_ENV == 'production' ? 'prod' : 'dev';
};

/** `export const metadata = { icons: faviconMetadata({ seed: 'acme' }) }` */
export const faviconMetadata = (o: EnvPreset & { seed: string; env?: Env }) => ({
  icon: [{ url: dataURI(envSVG(o.seed, o.env || nextEnv(), o)), type: 'image/svg+xml' }],
});

/** Route handler for `app/icon.svg/route.ts`: `export const GET = iconRoute({ seed: 'acme' })` */
export const iconRoute = (o: EnvPreset & { seed: string; env?: Env }) => () =>
  new Response(envSVG(o.seed, o.env || nextEnv(), o), { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' } });

export { detectEnv };
