import { test } from 'node:test';
import assert from 'node:assert/strict';
import { favipulse, svgToPNG, envSVG, icon, toSVG } from '../dist/index.mjs';
import { dom, fakeCanvas, sleep, svgOf } from './helpers.js';

test('creates a <link rel=icon> with an SVG data URI when none exists', () => {
  const w = dom();
  const f = favipulse({ document: w.document, seed: 'acme' });
  const l = w.document.querySelector('link[rel=icon]');
  assert.ok(l); assert.equal(f.link, l);
  assert.equal(l.type, 'image/svg+xml');
  assert.equal(svgOf(l.href), toSVG(icon('acme')));
  f.destroy();
  assert.equal(w.document.querySelector('link[rel=icon]'), null);
});

test('reuses an existing favicon link and restores it on destroy', () => {
  const w = dom({ html: '<head><link rel="shortcut icon" href="/old.ico" sizes="16x16"></head>' });
  const f = favipulse({ document: w.document, seed: 'acme' }).badge(3);
  const l = w.document.querySelector('link[rel~=icon]');
  assert.match(l.href, /^data:image\/svg/);
  assert.equal(l.hasAttribute('sizes'), false);
  assert.equal(w.document.querySelectorAll('link[rel~=icon]').length, 1);
  f.destroy();
  assert.equal(l.getAttribute('href'), '/old.ico');
});

test('default seed is location.host', () => {
  const w = dom({ url: 'https://shop.acme.com/x' });
  assert.equal(favipulse({ document: w.document }).svg, toSVG(icon('shop.acme.com')));
});

test('badge / progress / reset update the icon', () => {
  const w = dom();
  const f = favipulse({ document: w.document, seed: 's' });
  f.badge(4); assert.match(svgOf(f.link.href), />4<\/text>/);
  f.badge(0); assert.doesNotMatch(f.svg, /<text/);
  f.progress(0.25); assert.match(f.svg, /dasharray="25 100"/);
  f.progress(60); assert.match(f.svg, /dasharray="60 100"/);
  f.progress(null); assert.doesNotMatch(f.svg, /dasharray/);
  f.badge('!').progress(0.5).reset();
  assert.equal(f.svg, toSVG(icon('s')));
});

test('set() changes seed and env without a new link', () => {
  const w = dom();
  const f = favipulse({ document: w.document, seed: 'a' });
  f.set({ seed: 'b' }); assert.equal(f.svg, toSVG(icon('b')));
  f.set({ env: 'staging' }); assert.equal(f.svg, envSVG('b', 'staging'));
  f.set({ env: 'prod' }); assert.equal(f.svg, envSVG('b', 'prod'));
  assert.equal(w.document.querySelectorAll('link[rel~=icon]').length, 1);
});

test('env: "auto" detects from the hostname', () => {
  assert.equal(favipulse({ document: dom({ url: 'http://localhost:5173/' }).document, seed: 'a', env: 'auto' }).svg, envSVG('a', 'dev'));
  assert.equal(favipulse({ document: dom({ url: 'https://staging.acme.com/' }).document, seed: 'a', env: 'auto' }).svg, envSVG('a', 'staging'));
  assert.equal(favipulse({ document: dom({ url: 'https://acme.com/' }).document, seed: 'a', env: 'auto' }).svg, envSVG('a', 'prod'));
});

test('format png falls back to SVG when canvas is unavailable (jsdom)', async () => {
  const w = dom();
  const f = favipulse({ document: w.document, seed: 'a', format: 'png' });
  await sleep(10);
  assert.equal(f.link.type, 'image/svg+xml');
  assert.match(f.link.href, /^data:image\/svg\+xml,/);
});

test('svgToPNG resolves null without canvas, data URI with canvas, null when drawing throws', async () => {
  const w = dom();
  assert.equal(await svgToPNG('<svg/>', 32, w.document), null);
  fakeCanvas(w);
  assert.equal(await svgToPNG('<svg/>', 32, w.document), 'data:image/png;base64,FAKE32');
  const w2 = dom(); fakeCanvas(w2, { fail: true });
  assert.equal(await svgToPNG('<svg/>', 32, w2.document), null);
});

test('format png upgrades to PNG when canvas works; stale renders are discarded', async () => {
  const w = dom(); fakeCanvas(w);
  const f = favipulse({ document: w.document, seed: 'a', format: 'png', size: 48 });
  f.badge(1).badge(2);
  await sleep(20);
  assert.equal(f.link.type, 'image/png');
  assert.equal(f.link.href, 'data:image/png;base64,FAKE48');
});

test('format auto keeps SVG on Chrome, uses PNG on Safari', async () => {
  const mk = (ua) => { const w = dom(); fakeCanvas(w); Object.defineProperty(w.navigator, 'userAgent', { value: ua }); return w; };
  const c = favipulse({ document: mk('Mozilla/5.0 Chrome/130 Safari/537').document, format: 'auto' });
  const s = favipulse({ document: mk('Mozilla/5.0 Version/17 Safari/605').document, format: 'auto' });
  await sleep(20);
  assert.equal(c.link.type, 'image/svg+xml');
  assert.equal(s.link.type, 'image/png');
});

test('draw() animates through partial frames then resolves fully drawn', async () => {
  const w = dom();
  const f = favipulse({ document: w.document, seed: 'animate', fps: 60 });
  const frames = new Set();
  const obs = new w.MutationObserver(() => frames.add(f.svg));
  obs.observe(f.link, { attributes: true });
  await f.draw(150);
  await sleep(5);
  assert.ok(frames.size >= 3, `frames ${frames.size}`);
  assert.equal(f.svg, toSVG(icon('animate')));
});

test('pulse() animates a halo and stops cleanly', async () => {
  const w = dom();
  const f = favipulse({ document: w.document, seed: 'a', fps: 60 }).pulse();
  const seen = new Set();
  for (let i = 0; i < 6; i++) { await sleep(25); seen.add(f.svg); }
  assert.ok(seen.size >= 2);
  f.pulse(false);
  const s = f.svg; await sleep(60);
  assert.equal(f.svg, s);
  assert.equal(s, toSVG(icon('a')));
  f.destroy();
});

test('prefers-reduced-motion: draw() is instant and pulse is static', async () => {
  const w = dom({ reduced: true });
  const f = favipulse({ document: w.document, seed: 'a', fps: 60 });
  let changes = 0;
  new w.MutationObserver(() => changes++).observe(f.link, { attributes: true });
  await f.draw(500);
  assert.equal(f.svg, toSVG(icon('a')));
  f.pulse();
  const s = f.svg; await sleep(80);
  assert.equal(f.svg, s);
  assert.match(s, /opacity="0.6"/); // static halo at phase 0
  assert.ok(changes <= 3);
});

test('reducedMotion: false ignores the media query', async () => {
  const w = dom({ reduced: true });
  const f = favipulse({ document: w.document, seed: 'a', fps: 60, reducedMotion: false }).pulse();
  const seen = new Set();
  for (let i = 0; i < 5; i++) { await sleep(25); seen.add(f.svg); }
  assert.ok(seen.size >= 2);
  f.destroy();
});

test('pulse option starts pulsing immediately', async () => {
  const w = dom({ reduced: true });
  assert.match(favipulse({ document: w.document, seed: 'a', pulse: true }).svg, /opacity=/);
});

test('works without matchMedia', async () => {
  const w = dom(); delete w.matchMedia;
  const f = favipulse({ document: w.document, seed: 'a' });
  await f.draw(30);
  assert.equal(f.svg, toSVG(icon('a')));
});

test('SSR: no document → no-op controller that still renders SVG', async () => {
  const f = favipulse({ seed: 'ssr' });
  assert.equal(f.link, null);
  assert.equal(f.svg, toSVG(icon('ssr')));
  f.badge(2).progress(0.3).pulse(false).reset();
  await f.draw();
  f.destroy();
});
