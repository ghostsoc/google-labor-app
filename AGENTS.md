# Agent notes — In The Wind AV

## Running locally (Base44 sandbox)
```bash
docker compose -f docker-compose.base44.yml up -d --build
```
- Single service `app`: `oven/bun:1-alpine`, repo bind-mounted at `/app`, deps installed into a
  named `node_modules` volume at startup with `bun install --frozen-lockfile`, then `bun run dev`
  (`tsx server.ts` → Express + Vite middleware on port 3000). No image rebuild is needed for code edits.
- `bun.lock` is the pinned lockfile. **Do not run `npm install`** without checking it resolves —
  see below.

## Gotchas
- **Dependency resolution is npm-fragile.** `vite@8` declares `peerOptional esbuild@^0.27||^0.28`,
  so the root `esbuild` devDependency must stay `^0.28.0`. With `^0.25.0` (the previous value)
  `npm install` fails with `ERESOLVE`, which broke the production `Dockerfile` build and therefore
  every deploy of `main`. Bun resolves this layout fine, which is why `bun install` looked healthy.
- **Two client trees exist.** `index.html` loads `/frontend/main.tsx`, so **`frontend/` is the live
  client**. `src/` is an older copy of the same tree that kept receiving commits (the audit tracker
  and the localStorage auth/persistence work landed only there) — editing `src/` has no effect on
  the running app. Check which tree you are editing.
- Server code that touches Postgres (`backend/db`, `src/db`) builds a lazy `pg` pool from `SQL_*`
  env vars. None are required to boot; the DB-backed `/api/users` routes simply fail without them.
- Vite runs in middleware mode, so there is no HMR websocket; refresh the preview after client edits.
  Server-side edits need `docker compose -f docker-compose.base44.yml restart app`.

## Verifying
- `curl -sf http://localhost:3000/api/health` → `{"status":"healthy",...}`
- `curl -s http://localhost:3000/ | grep main.tsx` → confirms the live Vite dev transform.
- Production image check: `docker build -f Dockerfile .` (this is what deployments run).
