import { test } from 'node:test';
import assert from 'node:assert/strict';
import favipulseVite, { modeToEnv } from '../dist/vite.mjs';
import { nextEnv, faviconMetadata, iconRoute } from '../dist/next.mjs';
import { envSVG } from '../dist/index.mjs';

test('vite: modeToEnv', () => {
  assert.equal(modeToEnv('development'), 'dev');
  assert.equal(modeToEnv('staging'), 'staging');
  assert.equal(modeToEnv('production'), 'prod');
});

test('vite: injects head tags, replaces old icon links, emits assets', () => {
  const p = favipulseVite({ seed: 'acme', small: true, dir: 'icons' });
  p.configResolved({ mode: 'staging', base: '/app/' });
  const html = p.transformIndexHtml('<html><head><link rel="icon" href="/vite.svg"></head></html>');
  assert.doesNotMatch(html, /vite\.svg/);
  assert.match(html, /href="\/app\/icons\/favicon.svg"/);
  const emitted = [];
  p.generateBundle.call({ emitFile: (f) => emitted.push(f) });
  assert.ok(emitted.some((f) => f.fileName == 'icons/favicon.ico'));
  assert.ok(!emitted.some((f) => f.fileName.endsWith('head.html')));
  assert.match(String(emitted.find((f) => f.fileName == 'icons/favicon.svg').source), /#f59e0b/);
});

test('vite: env function and dev server middleware', () => {
  const p = favipulseVite({ seed: 'acme', small: true, env: () => 'prod' });
  p.configResolved({ mode: 'development', base: '/' });
  let mw; p.configureServer({ middlewares: { use: (f) => (mw = f) } });
  const res = { h: {}, setHeader(k, v) { this.h[k] = v; }, end(b) { this.body = b; } };
  let nexted = false;
  mw({ url: '/favicon.svg?v=1' }, res, () => (nexted = true));
  assert.equal(res.h['Content-Type'], 'image/svg+xml');
  assert.equal(String(res.body), envSVG('acme', 'prod'));
  mw({ url: '/main.js' }, res, () => (nexted = true));
  assert.ok(nexted);
});

test('next: nextEnv mapping', () => {
  assert.equal(nextEnv({ VERCEL_ENV: 'production' }), 'prod');
  assert.equal(nextEnv({ VERCEL_ENV: 'preview' }), 'staging');
  assert.equal(nextEnv({ NEXT_PUBLIC_APP_ENV: 'qa' }), 'qa');
  assert.equal(nextEnv({ NODE_ENV: 'production' }), 'prod');
  assert.equal(nextEnv({ NODE_ENV: 'development' }), 'dev');
});

test('next: faviconMetadata and iconRoute', async () => {
  const m = faviconMetadata({ seed: 'acme', env: 'dev' });
  assert.equal(decodeURIComponent(m.icon[0].url.slice(19)), envSVG('acme', 'dev'));
  const r = iconRoute({ seed: 'acme', env: 'prod' })();
  assert.equal(r.headers.get('content-type'), 'image/svg+xml');
  assert.equal(await r.text(), envSVG('acme', 'prod'));
});
