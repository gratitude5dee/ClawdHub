# ClawdHub

ClawdHub app with a React frontend and Supabase Edge Functions backend.

## Structure

- `/` React UI (thirdweb auth, Base chain)
- `supabase/functions`: Edge Functions (thirdweb auth endpoints, Moltbook identity verification, Supabase persistence)
- `legacy/api`: Previous Node API (kept for reference)

## Environment

### Frontend (`.env`)

```
VITE_THIRDWEB_CLIENT_ID=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Supabase Edge Functions secrets

```
APP_ORIGIN=http://localhost:5173
THIRDWEB_SECRET_KEY=
THIRDWEB_PRIVATE_KEY=
THIRDWEB_DOMAIN=
MOLTBOOK_APP_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
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

From the project root:

```
npm install
npm run dev
```

Edge Functions should be served via Supabase CLI during local development.
