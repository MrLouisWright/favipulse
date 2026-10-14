import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import esbuild from 'esbuild';

fs.rmSync('dist', { recursive: true, force: true });
const entries = ['index', 'compat', 'node', 'vite', 'next'];
const common = { bundle: true, target: 'es2019', minify: true, legalComments: 'none' };
for (const e of entries) {
  const platform = e == 'node' || e == 'vite' ? 'node' : 'neutral';
  for (const [format, ext] of [['esm', 'mjs'], ['cjs', 'cjs']])
    await esbuild.build({ ...common, entryPoints: [`src/${e}.ts`], outfile: `dist/${e}.${ext}`, format, platform, mainFields: ['module', 'main'] });
}
await esbuild.build({ ...common, entryPoints: ['src/index.ts'], outfile: 'dist/favipulse.global.js', format: 'iife', globalName: 'favipulse', footer: { js: 'favipulse=Object.assign(favipulse.default,favipulse);' } });
await esbuild.build({ ...common, entryPoints: ['src/compat.ts'], outfile: 'dist/favipulse-compat.global.js', format: 'iife', globalName: 'favipulseCompat' });
execSync('npx tsc -p tsconfig.json', { stdio: 'inherit' });
for (const f of fs.readdirSync('dist').filter((f) => f.endsWith('.d.ts'))) fs.writeFileSync(`dist/${f.replace('.d.ts', '.d.cts')}`, fs.readFileSync(`dist/${f}`, 'utf8').replace(/from '\.\/(\w+)\.js'/g, "from './$1.cjs'"));
const gz = gzipSync(fs.readFileSync('dist/index.mjs'), { level: 9 }).length;
console.log(`build: dist/ ok — core ${fs.statSync('dist/index.mjs').size} B min, ${gz} B min+gz`);
