# Vimi Supabase Migration — Stage 4

This stage adds a Supabase data-access layer for the core catalogue:
- public/owned businesses
- branches
- products
- branch inventory

## Files added
- `src/lib/supabaseCatalog.js`

## Before use
1. Ensure `@supabase/supabase-js` is installed.
2. Ensure `.env.local` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Apply the schema migrations from stages 1–3 in order, after reviewing them.
4. Set `VITE_AUTH_PROVIDER=supabase` only in a test environment once AuthContext and all app data flows have been migrated. Do not switch production yet.
5. Import functions from `@/lib/supabaseCatalog` into pages incrementally and replace corresponding Base44 calls only after each page is tested.

## Example
```js
import { listPublicBusinesses, listProducts } from '@/lib/supabaseCatalog';

const stores = await listPublicBusinesses({ search: 'non' });
const products = await listProducts({ businessId: stores[0]?.id });
```

## Important limitations
- This stage does not automatically rewrite every existing page or migrate Base44 records.
- Existing pages may still call Base44 directly. Search for `base44.` and migrate each use case deliberately.
- The app's current SQL schema uses text IDs for Base44 compatibility. New Supabase auth IDs are UUIDs, stored as text in owner columns. Keep these comparisons consistent.
- This repository is not a substitute for testing Row Level Security against real buyer and seller accounts.
- No production readiness is claimed until build, lint, RLS tests, and end-to-end order tests pass.
