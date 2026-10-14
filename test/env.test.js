import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectEnv, envIcon, envSVG, ENVS } from '../dist/index.mjs';

test('detectEnv: dev hosts', () => {
  for (const h of ['localhost', '127.0.0.1', '0.0.0.0', 'app.local', 'site.test', 'foo.localhost', '::1']) assert.equal(detectEnv(h), 'dev', h);
});
test('detectEnv: staging hosts', () => {
  for (const h of ['staging.acme.com', 'acme-staging.example.org', 'stg.acme.io', 'preview.acme.dev', 'acme-git-x.vercel.app', 'x.netlify.app', 'x.pages.dev', 'uat.acme.com', 'qa-1.acme.com'])
    assert.equal(detectEnv(h), 'staging', h);
});
test('detectEnv: prod hosts', () => {
  for (const h of ['acme.com', 'www.acme.co.uk', 'stagecoach.com', 'quality.com']) assert.equal(detectEnv(h), 'prod', h);
});
test('detectEnv without a location defaults to prod', () => assert.equal(detectEnv(), 'prod'));

test('each environment gets its own deterministic icon', () => {
  const s = ['dev', 'staging', 'prod'].map((e) => envSVG('acme', e));
  assert.equal(new Set(s).size, 3);
  assert.equal(envSVG('acme', 'dev'), envSVG('acme', 'dev'));
});
test('presets: dev/staging stripe, prod none; overrides win', () => {
  assert.equal(envIcon('a', 'dev').stripe, ENVS.dev.stripe);
  assert.equal(envIcon('a', 'staging').stripe, ENVS.staging.stripe);
  assert.equal(envIcon('a', 'prod').stripe, undefined);
  assert.equal(envIcon('a', 'dev', { stripe: '#000' }).stripe, '#000');
  assert.equal(envIcon('a', 'dev', { hue: 0 }).icon.fg, envIcon('b', 'prod', { hue: 0 }).icon.fg);
});
test('unknown environment names still work (custom envs)', () => {
  assert.match(envSVG('a', 'qa'), /^<svg/);
  ENVS.qa = { hue: 280, stripe: '#a855f7' };
  assert.match(envSVG('a', 'qa'), /#a855f7/);
  delete ENVS.qa;
});
