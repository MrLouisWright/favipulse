# Environments

Ever deployed from the staging tab thinking it was prod? favipulse gives each environment its own icon, derived from the same seed so they still look like one family.

| Env | Hue | Style | Stripe |
|---|---|---|---|
| `dev` | green (145) | dots | `#22c55e` |
| `staging` | amber (38) | grid | `#f59e0b` |
| `prod` | from the seed | grid | none |

## At runtime

```js
favipulse({ seed: 'acme', env: 'auto' });
```

`detectEnv()` rules:

- **dev**: `localhost`, `127.*`, `0.0.0.0`, `::1`, `*.local`, `*.test`, `*.localhost`
- **staging**: a hostname label `staging`, `stage`, `stg`, `preview`, `qa`, `uat` (e.g. `staging.acme.com`, `acme-staging.io`), or `*.vercel.app`, `*.netlify.app`, `*.pages.dev`
- **prod**: everything else

Or be explicit: `env: import.meta.env.MODE === 'development' ? 'dev' : 'prod'`.

## Static files

```bash
npx favipulse generate --seed acme --env dev,staging,prod --out public/favicons
```

Serve the right folder per deployment, or let the [Vite plugin](API#vite-favipulsevite) pick it from the build mode. In Next.js, `faviconMetadata()` reads `VERCEL_ENV` (production → prod, preview → staging).

## Custom environments

```js
import { ENVS } from 'favipulse';
ENVS.qa = { hue: 280, style: 'rings', stripe: '#a855f7' };
favipulse({ seed: 'acme', env: 'qa' });
```

Unknown names without a preset fall back to the seed's own colours.

## Overrides

Any option beats the preset: `favipulse({ seed: 'acme', env: 'dev', stripe: '#0ea5e9', style: 'grid' })`.
