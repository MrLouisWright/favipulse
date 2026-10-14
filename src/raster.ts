/** Node-side rasteriser: Icon → RGBA → PNG / ICO with zero dependencies (node:zlib). */
import { deflateSync } from 'node:zlib';
import type { Icon, Shape } from './core.js';

const rgb = (hex: string): [number, number, number] => {
  let h = hex.replace('#', '');
  if (h.length == 3) h = h.replace(/./g, '$&$&');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) || 0) as [number, number, number];
};

const inside = (s: Shape, x: number, y: number): boolean => {
  if (s.t == 'r') {
    const r = Math.min(s.r, s.w / 2, s.h / 2);
    if (x < s.x || y < s.y || x > s.x + s.w || y > s.y + s.h) return false;
    const dx = Math.max(s.x + r - x, 0, x - (s.x + s.w - r)), dy = Math.max(s.y + r - y, 0, y - (s.y + s.h - r));
    return dx * dx + dy * dy <= r * r + 1e-9;
  }
  const dx = x - s.x, dy = y - s.y, d = Math.hypot(dx, dy);
  if (s.t == 'c') return d <= s.r;
  if (Math.abs(d - s.r) > s.w / 2) return false;
  const start = (-90 + (s.o || 0) * 360) * Math.PI / 180, sweep = s.p * 2 * Math.PI;
  let a = Math.atan2(dy, dx) - start;
  a = ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  if (a <= sweep) return true;
  for (const e of [start, start + sweep]) // round caps
    if (Math.hypot(x - (s.x + s.r * Math.cos(e)), y - (s.y + s.r * Math.sin(e))) <= s.w / 2) return true;
  return false;
};

/** Rasterise to straight-alpha RGBA, `ss`×`ss` supersampling per pixel. */
export const rasterize = (ic: Icon, size: number, extra: Shape[] = [], ss = 4): Uint8Array => {
  const shapes = [...ic.shapes, ...extra].map((s) => ({ s, c: rgb(s.f) }));
  const px = new Uint8Array(size * size * 4), k = 64 / size;
  for (let py = 0; py < size; py++)
    for (let qx = 0; qx < size; qx++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < ss; sy++)
        for (let sx = 0; sx < ss; sx++) {
          const x = (qx + (sx + 0.5) / ss) * k, y = (py + (sy + 0.5) / ss) * k;
          for (let i = shapes.length - 1; i >= 0; i--)
            if (inside(shapes[i].s, x, y)) { const c = shapes[i].c; r += c[0]; g += c[1]; b += c[2]; a++; break; }
        }
      const o = (py * size + qx) * 4;
      if (a) { px[o] = r / a; px[o + 1] = g / a; px[o + 2] = b / a; px[o + 3] = Math.round((255 * a) / (ss * ss)); }
    }
  return px;
};

const CRC = new Int32Array(256).map((_, n) => { for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1; return n; });
const crc32 = (b: Uint8Array) => { let c = -1; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const chunk = (type: string, data: Uint8Array) => {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0); out.write(type, 4, 'latin1'); Buffer.from(data).copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
};

/** Encode RGBA pixels as PNG. */
export const encodePNG = (px: Uint8Array, w: number, h = w): Buffer => {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) Buffer.from(px.buffer, px.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', new Uint8Array())]);
};

/** Pack PNGs into a .ico (PNG-compressed entries, supported by all current browsers and Windows Vista+). */
export const encodeICO = (images: { size: number; png: Buffer }[]): Buffer => {
  const head = Buffer.alloc(6 + 16 * images.length);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(images.length, 4);
  let off = head.length;
  images.forEach(({ size, png }, i) => {
    const e = 6 + i * 16;
    head[e] = size >= 256 ? 0 : size; head[e + 1] = size >= 256 ? 0 : size;
    head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6);
    head.writeUInt32LE(png.length, e + 8); head.writeUInt32LE(off, e + 12);
    off += png.length;
  });
  return Buffer.concat([head, ...images.map((i) => i.png)]);
};
