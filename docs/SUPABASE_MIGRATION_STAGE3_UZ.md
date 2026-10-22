# Vimi Supabase migration — Stage 3

## What this stage adds
- `supabase/migrations/202610130003_atomic_checkout_order_status.sql`
  - `vimi_checkout`: validates ownership, cart/business/branch/address, current prices and stock; locks inventory; creates order and immutable order-item snapshots; deducts stock; clears cart; all in one Postgres transaction.
  - `vimi_update_order_status`: enforces allowed status transitions; permits seller-owned order updates; lets buyer cancel only a pending order; restores stock on cancellation exactly once.
- `src/lib/supabaseOrders.js`: typed-by-convention JS wrappers for both RPCs.

## Apply it
1. First ensure `202610130002_vimi_schema.sql` has run successfully.
2. In Supabase Dashboard → SQL Editor, review and run `202610130003_atomic_checkout_order_status.sql`.
3. Do not run the RPC wrappers in the app yet unless the user's cart, address, order data and login are all using Supabase.

## Important limitations
- This stage does NOT migrate the Base44 cart/context/pages or import existing Base44 records.
- Do not set `VITE_AUTH_PROVIDER=supabase` in a deployed app while business/product/cart data calls still depend on Base44. The app's data providers must be migrated in lockstep or parts of the app will stop working.
- `vimi_checkout` currently assumes delivery fee is zero, matching the current MVP implementation.
- `vimi_update_order_status` has basic valid transitions. Notifications, seller statistics and additional operational rules still need migration.
- Build, SQL execution and concurrency tests were not run against your actual Supabase project. Treat as prepared migration code, not a verified production deployment.

## Recommended smoke tests in a test project
1. Buyer A cannot check out Buyer B's cart or address.
2. A cart with insufficient stock creates no order and does not decrement any inventory.
3. Two simultaneous checkouts for the last unit cannot both succeed.
4. Buyer can cancel only a pending order.
5. A cancellation restores stock once; repeated cancellation is rejected.
6. A user who does not own a business cannot accept/prepare/complete its orders.
