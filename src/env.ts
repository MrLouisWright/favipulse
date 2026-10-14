import { icon, toSVG, type Icon, type IconOptions } from './core.js';

export type Env = 'dev' | 'staging' | 'prod' | (string & {});
export interface EnvPreset extends IconOptions { stripe?: string }

/** Built-in environment presets. prod uses the seed's own colours and no stripe. */
export const ENVS: Record<string, EnvPreset> = {
  dev: { hue: 145, stripe: '#22c55e', style: 'dots' },
  staging: { hue: 38, stripe: '#f59e0b', style: 'grid' },
  prod: {},
};

/** Guess the environment from a hostname. */
export const detectEnv = (host: string = typeof location != 'undefined' ? location.hostname : ''): Env =>
  /^(localhost|127\.|0\.0\.0\.0|\[?::1\]?$)|\.(local|test|localhost)$/.test(host) ? 'dev'
    : /(^|[.-])(staging|stage|stg|preview|qa|uat)([.-]|$)|\.vercel\.app$|\.netlify\.app$|\.pages\.dev$/.test(host) ? 'staging'
      : 'prod';

/** Deterministic icon for an environment: same seed keeps the family resemblance, the preset changes colour, style and stripe. */
export const envIcon = (seed: string, env: Env, o: EnvPreset = {}): { icon: Icon; stripe?: string } => {
  const pre = ENVS[env] || {};
  return { icon: icon(seed, { ...pre, ...o, hue: o.hue ?? pre.hue }), stripe: o.stripe ?? pre.stripe };
};

/** SVG string for an environment icon. */
export const envSVG = (seed: string, env: Env, o: EnvPreset = {}): string => {
  const e = envIcon(seed, env, o);
  return toSVG(e.icon, { stripe: e.stripe });
};
