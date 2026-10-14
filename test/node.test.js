import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import { rasterize, encodePNG, encodeICO, generate, writeSet, icon, PNG_SIZES } from '../dist/node.mjs';
import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const decode = (png) => {
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  const w = png.readUInt32BE(16), h = png.readUInt32BE(20);
  let off = 8, idat = [];
  while (off < png.length) { const len = png.readUInt32BE(off), type = png.toString('latin1', off + 4, off + 8); if (type == 'IDAT') idat.push(png.subarray(off + 8, off + 8 + len)); off += 12 + len; }
  const raw = inflateSync(Buffer.concat(idat));
  return { w, h, px: (x, y) => [...raw.subarray(y * (w * 4 + 1) + 1 + x * 4, y * (w * 4 + 1) + 5 + x * 4)] };
};
const hex = (c) => '#' + c.slice(0, 3).map((v) => v.toString(16).padStart(2, '0')).join('');

test('rasterize: background colour, transparent rounded corners', () => {
  const ic = icon('x', { fg: '#ff0000', bg: '#0000ff' });
  const { px } = decode(encodePNG(rasterize(ic, 64), 64));
  assert.deepEqual(px(0, 0)[3], 0); // rounded corner
  assert.equal(hex(px(2, 32)), '#0000ff');
  assert.equal(px(2, 32)[3], 255);
});

test('rasterize matches the SVG model: grid cells are foreground', () => {
  const ic = icon('raster', { fg: '#ff0000', bg: '#000000' });
  const { px } = decode(encodePNG(rasterize(ic, 64), 64));
  for (const s of ic.shapes.slice(1)) assert.equal(hex(px(Math.floor(s.x + s.w / 2), Math.floor(s.y + s.h / 2))), '#ff0000');
});

test('rasterize circles and arcs', () => {
  const dots = icon('d', { style: 'dots', fg: '#00ff00', bg: '#000000' });
  const c = dots.shapes[1];
  assert.equal(hex(decode(encodePNG(rasterize(dots, 64), 64)).px(Math.floor(c.x), Math.floor(c.y))), '#00ff00');
  const ring = { seed: 'r', fg: '#fff', bg: 'transparent', cells: 1, shapes: [{ t: 'a', x: 32, y: 32, r: 20, w: 6, p: 0.25, o: 0, f: '#ffffff' }] };
  const d = decode(encodePNG(rasterize(ring, 64), 64));
  assert.equal(d.px(32 + 14, 32 - 14)[3] > 0, true); // 12-3 o'clock quadrant drawn
  assert.equal(d.px(32 - 14, 32 + 14)[3], 0); // opposite quadrant empty
  assert.equal(d.px(32, 32)[3], 0);
});

test('encodePNG writes correct IHDR', () => {
  const png = encodePNG(new Uint8Array(3 * 2 * 4), 3, 2);
  assert.equal(png.readUInt32BE(16), 3); assert.equal(png.readUInt32BE(20), 2);
  assert.equal(png[24], 8); assert.equal(png[25], 6);
});

test('encodeICO directory', () => {
  const a = encodePNG(rasterize(icon('i'), 16), 16), b = encodePNG(rasterize(icon('i'), 256), 256);
  const ico = encodeICO([{ size: 16, png: a }, { size: 256, png: b }]);
  assert.equal(ico.readUInt16LE(2), 1); assert.equal(ico.readUInt16LE(4), 2);
  assert.equal(ico[6], 16); assert.equal(ico[22], 0);
  assert.equal(ico.readUInt32LE(6 + 12), 38);
  assert.equal(ico.readUInt32LE(22 + 12), 38 + a.length);
  assert.deepEqual(ico.subarray(38, 46), a.subarray(0, 8));
});

test('generate: full set with correct sizes, manifest and head snippet', () => {
  const files = generate({ seed: 'acme', env: 'staging', base: '/static' });
  for (const f of ['favicon.svg', 'favicon.ico', 'manifest.webmanifest', 'head.html', ...Object.keys(PNG_SIZES)]) assert.ok(files[f], f);
  for (const [f, n] of Object.entries(PNG_SIZES)) assert.equal(decode(files[f]).w, n, f);
  const m = JSON.parse(files['manifest.webmanifest']);
  assert.equal(m.name, 'acme (staging)');
  assert.deepEqual(m.icons.map((i) => i.src), ['/static/favicon.svg', '/static/icon-192.png', '/static/icon-512.png']);
  assert.match(files['head.html'], /href="\/static\/favicon.svg" type="image\/svg\+xml"/);
  assert.match(files['favicon.svg'], /#f59e0b/);
});

test('generate is deterministic and differs per env', () => {
  assert.deepEqual(generate({ seed: 'a', small: true }), generate({ seed: 'a', small: true }));
  assert.notDeepEqual(generate({ seed: 'a', env: 'dev', small: true })['favicon-32x32.png'], generate({ seed: 'a', env: 'prod', small: true })['favicon-32x32.png']);
});

test('generate small skips big PNGs', () => {
  const f = generate({ seed: 'a', small: true });
  assert.equal(f['icon-512.png'], undefined);
  assert.doesNotMatch(f['head.html'], /apple-touch/);
});

test('writeSet writes files', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fp-'));
  writeSet(join(dir, 'x'), generate({ seed: 'a', small: true }));
  assert.ok(readdirSync(join(dir, 'x')).includes('favicon.ico'));
  assert.match(readFileSync(join(dir, 'x', 'favicon.svg'), 'utf8'), /^<svg/);
});
