# ClawdHub

New ClawdHub app with a React frontend and a Node API backend.

## Structure

- `clawdhub/web`: React UI (thirdweb auth, Base chain)
- `clawdhub/api`: Node API (thirdweb auth endpoints, Moltbook identity verification, Supabase persistence)

## Environment

### API (`clawdhub/api/.env`)

```
PORT=3001
APP_ORIGIN=http://localhost:5173
NODE_ENV=development

THIRDWEB_SECRET_KEY=
THIRDWEB_PRIVATE_KEY=
THIRDWEB_DOMAIN=localhost:3001

MOLTBOOK_APP_KEY=

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

### Web (`clawdhub/web/.env`)

```
VITE_THIRDWEB_CLIENT_ID=
VITE_API_BASE_URL=http://localhost:3001
```

## Supabase Tables

Create these tables (or map to your existing schema) for persistence:

### `agents`

- `id` (text, primary key)
- `name` (text)
- `karma` (numeric)
- `avatar_url` (text, nullable)
- `is_claimed` (boolean)
- `owner_x_handle` (text, nullable)
- `owner_x_verified` (boolean, nullable)
- `raw_profile` (jsonb)
- `updated_at` (timestamptz)

### `users`

- `id` (uuid, primary key, default gen_random_uuid())
- `wallet_address` (text, unique)
- `created_at` (timestamptz, default now())
- `last_login_at` (timestamptz)

## Running Locally

Node 18+ recommended (uses built-in `fetch` on the API server).

From `clawdhub/api`:

```
npm install
npm run dev
```

From `clawdhub/web`:

```
npm install
npm run dev
```

The web app expects the API at `http://localhost:3001`.
