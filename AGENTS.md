# In The Wind AV — repo notes for automated agents

## Run it
`docker compose -f docker-compose.base44.yml up -d --build` → app on host port 3000.

- One Node process serves everything: `tsx server.ts` mounts the Express `/api` router and,
  when `NODE_ENV` is not `production`, Vite in middleware mode (SPA) — so source edits are
  served live on port 3000 with no build step. **Do not set `NODE_ENV=production`** in the
  sandbox compose; that branch serves a prebuilt `dist/` and edits stop showing.
- `Dockerfile.base44` installs only dependencies (bun + frozen `bun.lock`); the repo is
  bind-mounted at `/app`, and `app_node_modules` is a named volume that Compose re-syncs on
  startup. `bun.lock` uses lockfile format 2 — bun 1.2.x cannot parse it, 1.4.x can.

## Layout gotchas
- The browser entry is `index.html` → `/frontend/main.tsx`. The top-level `src/` tree is a
  stale duplicate of `frontend/` (plus a few abandoned files) and is **not** served — edit
  `frontend/`.
- The React app never calls `/api`; its data lives in Firestore with a `localStorage` cache
  (`itw_*` keys). With no Firebase credentials it renders from that cache, and the modules
  show empty lists on a fresh browser.
- PostgreSQL only backs `/api/users`. Schema is pushed by the one-shot `db-init` service using
  `backend/db/drizzle.config.ts`, whose schema path (`./src/db/schema.ts`) is resolved from the
  repo root — run `drizzle-kit` from the repo root, not from `backend/`.

## External services
- Firebase config lives in `firebase-applet-config.json` with a **redacted `apiKey`**. A real
  key is injected as `VITE_FIREBASE_API_KEY` (compose `env_file: /run/base44/app.env`) and
  `frontend/firebase.ts` prefers it. Google sign-in additionally requires the preview host to
  be an authorized domain in the Firebase project.

## Verify
- `curl -fsS http://localhost:3000/api/health` → JSON `status: healthy`.
- `curl -fsS http://localhost:3000/` must contain `/@vite/client` and `/@react-refresh`
  (proves the dev server, not a prebuilt bundle).
- Vite's dev host check rejects unknown hosts; Compose forwards the platform-provided
  `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` (a `.e2b.app` wildcard) for the preview proxy.
- `docker compose -f docker-compose.base44.yml ps` should show `app` healthy and `db` healthy.
