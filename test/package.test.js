import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));

test('core bundle stays under 3 KB min+gzip', () => {
  const gz = gzipSync(readFileSync(new URL('../dist/index.mjs', import.meta.url)), { level: 9 }).length;
  assert.ok(gz < 3072, `${gz} B`);
});

test('zero runtime dependencies', () => assert.equal(Object.keys(pkg.dependencies || {}).length, 0));

test('CJS require works for every entry', () => {
  assert.equal(typeof require('favipulse').favipulse, 'function');
  assert.equal(typeof require('favipulse').default, 'function');
  assert.equal(typeof require('favipulse/compat').Tinycon.setBubble, 'function');
  assert.equal(typeof require('favipulse/node').generate, 'function');
  assert.equal(typeof require('favipulse/vite').default, 'function');
  assert.equal(typeof require('favipulse/next').iconRoute, 'function');
});

test('ESM import works for every entry', async () => {
  for (const e of ['favipulse', 'favipulse/compat', 'favipulse/node', 'favipulse/vite', 'favipulse/next']) assert.ok(Object.keys(await import(e)).length, e);
});

test('every export target exists (incl. .d.ts and .d.cts)', () => {
  const walk = (v) => (typeof v == 'string' ? [v] : Object.values(v).flatMap(walk));
  for (const f of walk(pkg.exports)) assert.ok(existsSync(new URL('../' + f, import.meta.url)), f);
});

test('IIFE global build exposes window.favipulse', () => {
  const ctx = { window: {} }; ctx.self = ctx.window;
  vm.runInNewContext(readFileSync(new URL('../dist/favipulse.global.js', import.meta.url), 'utf8') + ';window.f=favipulse', ctx);
  assert.equal(typeof ctx.window.f, 'function');
  assert.equal(typeof ctx.window.f.icon, 'function');
  assert.match(ctx.window.f.toSVG(ctx.window.f.icon('a')), /^<svg/);
});
