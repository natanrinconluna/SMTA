# Service Member Transition Assistant (SMTA) – PERN Skeleton

A minimal **PERN** stack for the Service Member Transition Assistant (SMTA).  
This repo gives a secure, production-style baseline with one-command local run, JWT auth, and a modern React client.

## Stack

- **PostgreSQL** (Docker) + **Prisma** (ORM & migrations)
- **Express v5** (Node 20) API with hardening (Helmet, rate limiting, logging)
- **React + Vite + TypeScript** (Tailwind **v4** workflow; no config by default)
- **State/Data**: Zustand (auth token), React Query (data fetching)
- **Auth**: `/auth/register`, `/auth/login` issuing JWTs
- **Single-port serve**: Express serves the built React app from `client/dist` and keeps `/api/*` and `/auth/*` routes

---

## Repo Layout

```
smta-pern/
├─ docker-compose.yml        # Postgres + pgAdmin
├─ package.json              # root scripts (one-command run/build)
├─ client/                   # React + Vite + TS + Tailwind v4
│  ├─ src/
│  └─ dist/                  # built SPA (created by `npm run build`)
└─ server/                   # Express API + Prisma
   ├─ src/
   ├─ prisma/
   │  ├─ schema.prisma
   │  └─ migrations/
   ├─ .env                   # server env vars (create this)
   └─ dist/                  # compiled API (created by `npm run build`)
```

---

## Prerequisites

- **Node.js 20+** and **npm** (Homebrew: `brew install node@20`)
- **Docker Desktop** (or **Colima**) running
- **Git**
- macOS or Linux (Windows works via WSL2)

> If Homebrew installs `node@20` as keg-only, add to your shell:  
> `echo 'export PATH="/usr/local/opt/node@20/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc`

---

## 1) Configuration

Create `server/.env`:

```env
# server/.env
PORT=4000
DATABASE_URL="postgresql://smta:smta_dev@localhost:5432/smta?schema=public"

# JWT signing key (change this in real environments)
JWT_SECRET=change_me_please

# Optional (if you later split client & API across hosts)
# ALLOWED_ORIGIN=http://localhost:5173

# Optional (for future AI features)
# OPENAI_API_KEY=sk-...
```

(Optional) Create `.env.sample` (same keys, no secrets) to help other devs.

---

## 2) One-Command Local Run

From the **repo root**:

```bash
npm run up
```

What it does:

1. Starts Postgres (Docker Compose)
2. Applies Prisma migrations & generates Prisma Client
3. Builds the **client** then the **server**
4. Starts the server which **serves the SPA and API** on one port

**Open:** <http://localhost:4000>  
**Health:** <http://localhost:4000/api/health>

> Stop the Node server with **Ctrl+C**.  
> Stop DB containers/volumes: `npm run db:down`.

---

## 3) Logging In (quick smoke test)

Create a user and log in from the terminal:

```bash
# Register (409 if email already exists; that's okay)
curl -X POST http://localhost:4000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"vet@example.com","password":"secret123"}'

# Login (returns { "token": "..." })
curl -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"vet@example.com","password":"secret123"}'
```

Or just use the form at **/** (the SPA). On success your token is stored in the client store (and optionally in `localStorage` depending on your implementation).

> (Optional) If you added `/api/me`, you can verify the token:
>
> ```bash
> curl http://localhost:4000/api/me -H "Authorization: Bearer <PASTE_TOKEN>"
> ```

---

## 4) Dev Workflow

**Start only the DB** (in one terminal):

```bash
npm run db:up
```

**Run client + server in watch mode** (another terminal, repo root):

```bash
npm run dev
```

**Optional: Prisma Studio** (DB browser UI):

```bash
npm run studio    # opens http://localhost:5555
```

> Studio is a dev tool—don’t run it in production.

---

## 5) Production-Style Build & Run

From the repo root:

```bash
npm run build        # builds client -> server
npm run start:prod   # runs compiled server which serves SPA
```

Open <http://localhost:4000>.

---

## 6) Database & Prisma

Common commands (run in `server/` or via root scripts):

```bash
# Create a migration when you edit schema.prisma
npx prisma migrate dev --name your_change

# Apply all pending migrations (what `npm run up` uses)
npm run prisma:deploy

# Regenerate Prisma Client (after schema changes)
npx prisma generate
```

> Source of truth for schema is **Prisma migrations**. Avoid making schema changes directly with pgAdmin.

---

## 7) pgAdmin (optional)

`docker-compose.yml` exposes pgAdmin on **<http://localhost:5050>**.

Default login (from compose file):

- **Email:** `admin@example.com` (or whatever you configured)
- **Password:** `admin`

Add a server connection in pgAdmin:

- **Name:** local
- **Host:** `db` (Docker service name, so the pgAdmin container can reach Postgres)
- **Port:** `5432`
- **Username:** `smta`
- **Password:** `smta_dev`

> If you use `admin@smta.local`, ensure pgAdmin allows special domains:  
> `PGADMIN_CONFIG_ALLOW_SPECIAL_EMAIL_DOMAINS='["local"]'` in `docker-compose.yml`.

---

## 8) Security & Hardening

The server enables quick protections:

- `helmet` security headers
- `express-rate-limit` (basic throttling)
- `morgan` structured logs
- `express.json({ limit: '1mb' })`

**Change `JWT_SECRET`** before sharing or deploying.  
If you host client and API on different origins, set `ALLOWED_ORIGIN` and rebuild the client with `VITE_API_URL` pointed at the API.

---

## 9) Troubleshooting

- **Docker not running** → start Docker Desktop / Colima.
- **Cannot open pgAdmin (5050)** → ensure port is free and env email is valid.
- **404 on `/auth/login`** → router not mounted; check `server/src/index.ts` has:
  ```ts
  import authRouter from "./routes/auth";
  app.use("/auth", authRouter);
  ```
- **Express v5 wildcard error** → use the provided SPA fallback (no `app.get('*')`).
- **CORS errors** → when serving SPA + API from one origin, you usually don’t need strict CORS; if split, configure `ALLOWED_ORIGIN`.
- **DB connection refused** → containers not up or wrong `DATABASE_URL`.

---

## 10) Scripts Reference

### Root

- `npm run up` — start DB → migrate → build client+server → run server
- `npm run db:up` / `npm run db:down` — start/stop DB containers
- `npm run build` — build client then server
- `npm run start:prod` — run compiled server
- `npm run dev` — dev servers (client + API) with live reload
- `npm run studio` — open Prisma Studio (via server workspace)
- `npm run format` — Prettier write

### Server

- `npm run dev` — watch mode (tsx or ts-node-dev)
- `npm run build` — TypeScript compile
- `npm run prisma:deploy` — `prisma migrate deploy && prisma generate`
- `npm run studio` — `prisma studio --port 5555`
