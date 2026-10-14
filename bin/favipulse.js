#!/usr/bin/env node
// favipulse CLI: static favicon sets per environment.
import { generate, writeSet, DEFAULT_ENVS } from '../dist/node.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf('--' + n); return i < 0 ? d : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true; };
const help = `favipulse ${JSON.parse(readFileSync(new URL('../package.json', import.meta.url))).version}

Usage:
  favipulse generate --seed <text> [--env dev,staging,prod] [--out favicons] [options]
  favipulse svg --seed <text> [--env prod]        print one SVG to stdout

Options:
  --seed <text>     Seed for the deterministic icon (e.g. your app name)  (required)
  --env <list>      Comma-separated environments (default: dev,staging,prod)
  --out <dir>       Output directory; one sub-folder per environment (default: favicons)
  --flat            With a single --env, write straight into --out
  --style <s>       grid | dots | rings (default: per environment preset)
  --hue <0-360>     Force the hue
  --fg / --bg <c>   Force colours (#rrggbb; --bg transparent)
  --radius <n>      Background corner radius 0-32 (default 14)
  --name <text>     App name for the manifest
  --base <url>      URL prefix in head.html/manifest (default /<env>/ or / with --flat)
  --small           Only 16/32/48 PNGs + ico + svg
  --json            Machine-readable summary
  -h, --help        Show this help
`;
const cmd = argv[0];
if (!cmd || cmd == '-h' || cmd == '--help' || flag('help')) { process.stdout.write(help); process.exit(cmd ? 0 : 1); }
const seed = flag('seed');
if (typeof seed != 'string') { console.error('favipulse: --seed <text> is required\n\n' + help); process.exit(2); }
const opts = { seed };
for (const k of ['style', 'fg', 'bg', 'name']) if (typeof flag(k) == 'string') opts[k] = flag(k);
for (const k of ['hue', 'radius']) if (typeof flag(k) == 'string') opts[k] = Number(flag(k));
if (opts.style && !['grid', 'dots', 'rings'].includes(opts.style)) { console.error(`favipulse: unknown --style ${opts.style}`); process.exit(2); }
const envs = typeof flag('env') == 'string' ? flag('env').split(',').map((s) => s.trim()).filter(Boolean) : DEFAULT_ENVS;

if (cmd == 'svg') { process.stdout.write(generate({ ...opts, env: envs[0] || 'prod', small: true })['favicon.svg'] + '\n'); process.exit(0); }
if (cmd != 'generate') { console.error(`favipulse: unknown command "${cmd}"\n\n${help}`); process.exit(2); }

const out = typeof flag('out') == 'string' ? flag('out') : 'favicons';
const flat = flag('flat') === true && envs.length == 1;
const summary = [];
for (const env of envs) {
  const dir = flat ? out : join(out, env);
  const base = typeof flag('base') == 'string' ? flag('base') : flat ? '/' : `/${env}/`;
  const files = writeSet(dir, generate({ ...opts, env, base, small: flag('small') === true }));
  summary.push({ env, dir, files });
}
if (flag('json') === true) console.log(JSON.stringify(summary, null, 2));
else for (const s of summary) console.log(`✔ ${s.env.padEnd(8)} ${s.files.length} files → ${s.dir}/  (paste ${join(s.dir, 'head.html')} into <head>)`);
