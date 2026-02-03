

## Plan: Fix Build Errors

### Overview
There are 4 build errors to fix across 3 files, plus 2 configuration issues that need attention.

---

### Build Errors to Fix

#### 1. Edge Function Type Error (thirdweb-me/index.ts)
**Error:** `Property 'address' does not exist on type 'JWTPayload<unknown>'`

The `parsedJWT` object from thirdweb's `verifyJWT` doesn't have an `address` property in its type definition. The address is stored in the `sub` claim.

**Fix:** Use only `parsed.sub` and cast to access the JWT payload safely:
```typescript
const address = parsed.sub;
```

---

#### 2. Supabase Function Body Type (src/App.tsx line 54)
**Error:** `Type 'unknown' is not assignable to type 'string | ArrayBuffer | Blob | ...'`

The `invokeFunction` helper passes `unknown` typed body to Supabase's `invoke()` which expects specific types.

**Fix:** Change the body type from `unknown` to a more specific union type:
```typescript
options?: { body?: Record<string, unknown>; headers?: Record<string, string> }
```

---

#### 3. Auth Config Type Mismatch (src/App.tsx line 155)
**Error:** `Type 'Promise<unknown>' is not assignable to type 'Promise<LoginPayload>'`

The `getLoginPayload` function returns `Promise<unknown>` but the thirdweb `auth` prop expects a specific `LoginPayload` type.

**Fix:** Import `LoginPayload` from thirdweb and type the return properly:
```typescript
import type { LoginPayload } from 'thirdweb/auth';

async getLoginPayload(params: { address: string; chainId?: number }): Promise<LoginPayload> {
  return invokeFunction<LoginPayload>('thirdweb-payload', {
    body: { address: params.address, chainId: params.chainId },
  });
}
```

---

#### 4. ThirdwebProvider Props (src/main.tsx line 14)
**Error:** `Property 'client' does not exist on type...`

The `ThirdwebProvider` in thirdweb v5 doesn't accept a `client` prop directly. The client is passed to individual components like `ConnectButton`.

**Fix:** Remove the `client` prop from `ThirdwebProvider`:
```typescript
<ThirdwebProvider>
  <App client={client} />
</ThirdwebProvider>
```

---

### Configuration Fixes Required

#### 5. Vite Port Configuration
The vite.config.ts uses port 5173 but Lovable requires port 8080.

**Fix:** Change server port to 8080 in vite.config.ts

---

### Note for User

**Manual steps required (cannot be done by Lovable):**

1. **Add build:dev script** - Add to package.json scripts:
   ```json
   "build:dev": "vite build --mode development"
   ```

2. **Generate lock file** - Run `npm install` locally to generate `package-lock.json` and commit it to the project

---

### Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/thirdweb-me/index.ts` | Use `parsed.sub` only for address |
| `src/App.tsx` | Fix body type, add LoginPayload import and typing |
| `src/main.tsx` | Remove `client` prop from ThirdwebProvider |
| `vite.config.ts` | Change port to 8080 |

