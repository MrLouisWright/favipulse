import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const bin = new URL('../bin/favipulse.js', import.meta.url).pathname;
const run = (...a) => spawnSync(process.execPath, [bin, ...a], { encoding: 'utf8' });

test('help', () => {
  const r = run('--help'); assert.equal(r.status, 0); assert.match(r.stdout, /favipulse generate/);
  assert.equal(run().status, 1);
});
test('generate one folder per environment', () => {
  const out = mkdtempSync(join(tmpdir(), 'fpcli-'));
  const r = run('generate', '--seed', 'acme', '--out', out);
  assert.equal(r.status, 0, r.stderr);
  for (const e of ['dev', 'staging', 'prod']) {
    assert.match(r.stdout, new RegExp(`✔ ${e}`));
    assert.equal(readdirSync(join(out, e)).length, 10);
  }
});
test('--flat, --small, --style, --hue, --json', () => {
  const out = mkdtempSync(join(tmpdir(), 'fpcli-'));
  const r = run('generate', '--seed', 'acme', '--env', 'prod', '--flat', '--small', '--style', 'rings', '--hue', '200', '--json', '--out', out);
  assert.equal(r.status, 0, r.stderr);
  const j = JSON.parse(r.stdout);
  assert.equal(j[0].env, 'prod'); assert.equal(j[0].dir, out);
  assert.ok(existsSync(join(out, 'favicon.ico')));
  assert.ok(!existsSync(join(out, 'icon-512.png')));
});
test('svg command prints an SVG', () => {
  const r = run('svg', '--seed', 'acme', '--env', 'dev');
  assert.equal(r.status, 0); assert.match(r.stdout, /^<svg[\s\S]*#22c55e/);
});
test('errors: missing seed, bad style, unknown command', () => {
  assert.equal(run('generate').status, 2);
  assert.equal(run('generate', '--seed', 'a', '--style', 'nope').status, 2);
  assert.equal(run('frobnicate', '--seed', 'a').status, 2);
});
