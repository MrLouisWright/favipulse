// Generates docs/hero.svg (animated README banner) from the real library output.
import { writeFileSync } from 'node:fs';
import { icon, toSVG, envSVG } from '../dist/index.mjs';

const inner = (svg) => svg.replace(/^<svg[^>]*>|<\/svg>$/g, '');
const cell = (svg, x, y, s = 96, extra = '') => `<g transform="translate(${x} ${y}) scale(${s / 64})">${inner(svg)}${extra}</g>`;
const ic = icon('favipulse');
const ring = `<circle cx="32" cy="32" r="29" fill="none" stroke="${ic.fg}" stroke-opacity=".25" stroke-width="6"/><circle cx="32" cy="32" r="29" fill="none" stroke="${ic.fg}" stroke-width="6" pathLength="100" stroke-dasharray="0 100" stroke-linecap="round" transform="rotate(-90 32 32)"><animate attributeName="stroke-dasharray" values="0 100;100 100;100 100" keyTimes="0;.85;1" dur="3s" repeatCount="indefinite"/></circle>`;
const pulse = `<circle cx="50" cy="14" r="14" fill="#ef4444"><animate attributeName="r" values="12;22" dur="1.2s" repeatCount="indefinite"/><animate attributeName="opacity" values=".6;0" dur="1.2s" repeatCount="indefinite"/></circle><circle cx="50" cy="14" r="10" fill="#ef4444"/>`;
const label = (x, t) => `<text x="${x + 48}" y="150" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="13" fill="#8a8f98" text-anchor="middle">${t}</text>`;
const items = [
  [toSVG(ic), 'seed', ''], [toSVG(ic, { badge: 7 }), 'badge(7)', ''], [toSVG(ic), 'progress()', ring], [toSVG(ic), 'pulse()', pulse],
  [envSVG('acme', 'dev'), 'dev', ''], [envSVG('acme', 'staging'), 'staging', ''], [envSVG('acme', 'prod'), 'prod', ''],
];
const W = 40 + items.length * 120;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 176" width="${W}" height="176"><rect width="${W}" height="176" rx="18" fill="#0a0b0d"/>` +
  items.map(([s, t, e], i) => cell(s, 32 + i * 120, 30, 96, e) + label(32 + i * 120, t)).join('') + '</svg>\n';
writeFileSync('docs/hero.svg', svg);
console.log('docs/hero.svg', svg.length, 'bytes');
