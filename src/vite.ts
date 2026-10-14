/** Vite plugin: emits the favicon set for the current mode and injects the <link> tags. */
import { generate, type GenerateOptions } from './node.js';
import type { Env } from './env.js';

export interface VitePluginOptions extends Omit<GenerateOptions, 'env'> {
  /** Environment, or a function of Vite's `mode`. Default: development→dev, staging→staging, else prod. */
  env?: Env | ((mode: string) => Env);
  /** Output sub-folder inside the build. Default '' (root). */
  dir?: string;
}

export const modeToEnv = (mode: string): Env => (mode == 'development' ? 'dev' : mode == 'staging' ? 'staging' : 'prod');

export default function favipulseVite(o: VitePluginOptions): any {
  let mode = 'production', base = '/';
  const set = () => {
    const env = typeof o.env == 'function' ? o.env(mode) : o.env || modeToEnv(mode);
    const dir = o.dir ? o.dir.replace(/^\/|\/$/g, '') + '/' : '';
    return { dir, files: generate({ ...o, env, base: base + dir }) };
  };
  return {
    name: 'favipulse',
    configResolved(c: any) { mode = c.mode; base = c.base || '/'; },
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const { dir, files } = set(), f = (req.url || '').split('?')[0].slice(base.length).replace(dir, '');
        const body = files[f];
        if (!body || f == 'head.html') return next();
        res.setHeader('Content-Type', f.endsWith('.svg') ? 'image/svg+xml' : f.endsWith('.png') ? 'image/png' : f.endsWith('.ico') ? 'image/x-icon' : 'application/manifest+json');
        res.end(body);
      });
    },
    generateBundle(this: any) {
      const { dir, files } = set();
      for (const [f, source] of Object.entries(files)) if (f != 'head.html') this.emitFile({ type: 'asset', fileName: dir + f, source });
    },
    transformIndexHtml(html: string) {
      const head = set().files['head.html'] as string;
      return html.replace(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*>\s*/gi, '').replace(/<\/head>/i, head + '</head>');
    },
  };
}
export { favipulseVite as favipulse };
