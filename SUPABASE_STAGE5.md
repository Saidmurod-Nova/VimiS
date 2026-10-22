# Vimi Supabase Migration — Stage 5

This stage wires the seller product-management flow to Supabase when `VITE_AUTH_PROVIDER=supabase`, while preserving the Base44 path when the flag is `base44`.

## Updated
- `src/lib/BusinessContext.jsx`: loads owned businesses from Supabase in Supabase-auth mode.
- `src/pages/seller/Products.jsx`: loads products, inventory, and product categories from Supabase.
- `src/pages/seller/ProductCreate.jsx`: creates products through Supabase.
- `src/pages/seller/ProductEdit.jsx`: reads and updates products through Supabase.
- `src/components/vimi/ProductCategorySelect.jsx`: reads business product categories through Supabase.
- `src/lib/supabaseCatalog.js`: adds category, business inventory, and product detail helpers.

## Important remaining gaps
- Business creation, branch management, inventory editing, product-image upload, buyer catalogue, cart, addresses, orders, notifications, and statistics still have Base44-backed paths.
- Do not enable Supabase auth in production until the rest of the app has been migrated and end-to-end tested.
- Apply schema migrations in order and test RLS with buyer and seller accounts. Never put a service-role key in browser code.

## Validation status
A local `npm ci --ignore-scripts --no-audit --no-fund` attempt timed out in this environment, so Vite build/lint and live Supabase tests are not confirmed.
