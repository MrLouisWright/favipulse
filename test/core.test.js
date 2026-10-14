import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hash, rng, hsl, icon, toSVG, dataURI, badgeText, shapeSVG } from '../dist/index.mjs';

test('hash is FNV-1a 32-bit and stable', () => {
  assert.equal(hash(''), 0x811c9dc5);
  assert.equal(hash('a'), 0xe40c292c);
  assert.equal(hash('favipulse'), hash('favipulse'));
  assert.notEqual(hash('a'), hash('b'));
});

test('rng is deterministic and in [0,1)', () => {
  const a = rng(42), b = rng(42);
  for (let i = 0; i < 1000; i++) { const x = a(); assert.equal(x, b()); assert.ok(x >= 0 && x < 1); }
});

test('hsl converts to hex', () => {
  assert.equal(hsl(0, 100, 50), '#ff0000');
  assert.equal(hsl(120, 100, 50), '#00ff00');
  assert.equal(hsl(240, 100, 50), '#0000ff');
  assert.equal(hsl(0, 0, 100), '#ffffff');
});

test('icon is deterministic per seed', () => {
  assert.deepEqual(icon('acme'), icon('acme'));
  assert.equal(toSVG(icon('acme')), toSVG(icon('acme')));
  assert.notEqual(toSVG(icon('acme')), toSVG(icon('acme2')));
});

test('100 seeds give (almost) all distinct icons and never an empty one', () => {
  const set = new Set();
  for (let i = 0; i < 100; i++) { const ic = icon('seed-' + i); assert.ok(ic.shapes.length > 1); set.add(toSVG(ic)); }
  assert.ok(set.size >= 99);
});

test('grid icons are mirror-symmetric', () => {
  const ic = icon('symmetry');
  const cells = ic.shapes.slice(1).map((s) => `${Math.round((s.x - 8) / 9.6)},${Math.round((s.y - 8) / 9.6)}`);
  for (const c of cells) { const [x, y] = c.split(',').map(Number); assert.ok(cells.includes(`${4 - x},${y}`), c); }
});

test('dots style keeps the grid pattern and uses circles', () => {
  const g = icon('x'), d = icon('x', { style: 'dots' });
  assert.equal(g.shapes.length, d.shapes.length);
  assert.ok(d.shapes.slice(1).every((s) => s.t == 'c'));
});

test('rings style draws arcs', () => {
  const ic = icon('x', { style: 'rings' });
  assert.equal(ic.shapes.filter((s) => s.t == 'a').length, 4);
  assert.match(toSVG(ic), /stroke-dasharray/);
});

test('options: hue, fg, bg, transparent, radius', () => {
  assert.equal(icon('x', { fg: '#123456' }).fg, '#123456');
  assert.equal(icon('x', { hue: 0 }).fg, hsl(0, 70, 58));
  assert.equal(icon('x', { bg: 'transparent' }).shapes[0].t != 'r' || icon('x', { bg: 'transparent' }).shapes[0].w != 64, true);
  assert.match(toSVG(icon('x', { radius: 32 })), /rx="32"/);
});

test('badgeText rules', () => {
  assert.equal(badgeText(0), '');
  assert.equal(badgeText(null), '');
  assert.equal(badgeText(7), '7');
  assert.equal(badgeText(3.9), '3');
  assert.equal(badgeText(100), '99+');
  assert.equal(badgeText('new!'), 'new');
});

test('toSVG overlays: badge, progress, pulse, stripe', () => {
  const ic = icon('x');
  assert.doesNotMatch(toSVG(ic, { badge: 0 }), /<text/);
  assert.match(toSVG(ic, { badge: 5 }), />5<\/text>/);
  assert.match(toSVG(ic, { badge: 120 }), />99\+<\/text>/);
  assert.match(toSVG(ic, { badge: 1, badgeBg: '#00f', badgeFg: '#ff0' }), /fill="#00f".*fill="#ff0"/);
  assert.match(toSVG(ic, { progress: 0.5 }), /stroke-dasharray="50 100"/);
  assert.match(toSVG(ic, { progress: 7 }), /stroke-dasharray="100 100"/);
  assert.match(toSVG(ic, { progress: -1 }), /stroke-dasharray="0 100"/);
  assert.doesNotMatch(toSVG(ic, { progress: null }), /dasharray/);
  assert.match(toSVG(ic, { pulse: 0.5 }), /opacity="0.3"/);
  assert.match(toSVG(ic, { stripe: '#f00' }), /fill="#f00"/);
});

test('badge text cannot inject markup', () => {
  assert.doesNotMatch(toSVG(icon('x'), { badge: '<a&' }), /<a&/);
});

test('reveal draws a fraction of shapes, background always', () => {
  const ic = icon('x'), full = (toSVG(ic).match(/<rect/g) || []).length;
  assert.equal((toSVG(ic, { reveal: 0 }).match(/<rect/g) || []).length, 1);
  const half = (toSVG(ic, { reveal: 0.5 }).match(/<rect/g) || []).length;
  assert.ok(half > 1 && half < full);
});

test('dataURI encodes SVG', () => {
  const u = dataURI('<svg a="#"/>');
  assert.ok(u.startsWith('data:image/svg+xml,'));
  assert.equal(decodeURIComponent(u.slice(19)), '<svg a="#"/>');
});

test('shapeSVG emits valid elements', () => {
  assert.equal(shapeSVG({ t: 'c', x: 1, y: 2, r: 3, f: '#000' }), '<circle cx="1" cy="2" r="3" fill="#000"/>');
});
