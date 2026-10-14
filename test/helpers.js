import { JSDOM, VirtualConsole } from 'jsdom';

/** A jsdom window. jsdom has no canvas implementation: getContext() returns null. */
export const dom = ({ html = '<!doctype html><head></head><body></body>', url = 'https://acme.com/', reduced = false } = {}) => {
  const vc = new VirtualConsole(); // silence "not implemented: getContext"
  const { window } = new JSDOM(html, { url, virtualConsole: vc, pretendToBeVisual: true });
  window.matchMedia = (q) => ({ matches: reduced && /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {} });
  return window;
};

/** Fake a working canvas + Image so the PNG path can run. */
export const fakeCanvas = (window, { fail = false } = {}) => {
  window.HTMLCanvasElement.prototype.getContext = function () { return { drawImage() { if (fail) throw new Error('tainted'); } }; };
  window.HTMLCanvasElement.prototype.toDataURL = function () { return `data:image/png;base64,FAKE${this.width}`; };
  window.Image = class { set src(v) { this._s = v; setTimeout(() => this.onload && this.onload(), 1); } get src() { return this._s; } };
};

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const svgOf = (href) => decodeURIComponent(href.replace('data:image/svg+xml,', ''));
