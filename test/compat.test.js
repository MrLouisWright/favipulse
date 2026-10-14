import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dom, sleep } from './helpers.js';

test('Favico shim: badge, colours, reset', async () => {
  const w = dom(); globalThis.document = w.document;
  const { Favico } = await import('../dist/compat.mjs?favico');
  const f = new Favico({ animation: 'none', bgColor: '#5CB85C', textColor: '#ff0' });
  f.badge(7);
  assert.match(f.favipulse.svg, />7<\/text>/);
  f.badge(8, { bgColor: '#123456' });
  assert.match(f.favipulse.svg, /#123456/);
  f.reset();
  assert.doesNotMatch(f.favipulse.svg, /<text/);
  f.image(); f.video(); f.webcam();
  const a = new Favico({ animation: 'popFade' }); a.badge(1); await sleep(5);
  assert.match(a.favipulse.svg, /opacity=/);
  delete globalThis.document;
});

test('Tinycon shim: setBubble, options, abbreviate, title fallback', async () => {
  const w = dom(); w.document.title = 'Inbox'; globalThis.document = w.document;
  const { Tinycon } = await import('../dist/compat.mjs?tinycon');
  Tinycon.setOptions({ background: '#549A2F', colour: '#fff' }).setBubble(3);
  const l = w.document.querySelector('link[rel=icon]');
  assert.match(decodeURIComponent(l.href), />3<\/text>/);
  assert.match(decodeURIComponent(l.href), /#549A2F/);
  assert.equal(w.document.title, 'Inbox');
  Tinycon.setBubble(4200); assert.match(decodeURIComponent(l.href), />4k<\/text>/);
  Tinycon.setOptions({ fallback: 'force' }).setBubble(5);
  assert.equal(w.document.title, '(5) Inbox');
  Tinycon.setBubble(0); assert.equal(w.document.title, 'Inbox');
  Tinycon.reset(); Tinycon.setImage();
  assert.doesNotMatch(decodeURIComponent(l.href), /<text/);
  delete globalThis.document;
});
