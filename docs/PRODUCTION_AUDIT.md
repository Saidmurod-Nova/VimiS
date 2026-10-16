# VimiS Production Audit

**Audit date:** 2026-10-13
**Scope:** Static repository audit only. No source application code or SQL was changed and no deploy was performed.

## Executive Summary

**Verdict: BLOCKED for production.** This repository contains a working Base44 application path and a partially implemented Supabase migration. Several Supabase UI data paths still call Base44, making mixed-provider use unsafe. The checkout/status RPCs are present and contain useful transactional protections, but the checkout screen does not call them. No production Supabase project, OAuth provider, deployed migration state, imported data, or live RLS behavior was inspected.

The current tree was already dirty before this audit. This report is the only file added by the audit; existing modified and untracked files were left untouched.

## Repository Map

- `src/App.jsx`: React Router routes and provider composition. Buyer/seller pages are behind `ProtectedRoute`.
- `src/lib/`: Auth, business, buyer, and cart contexts; Supabase client, catalog, OAuth, order RPC, and storage helpers.
- `src/pages/`: buyer, seller, auth, profile, and notification screens.
- `src/api/base44Client.js`: Base44 SDK client.
- `base44/entities/`: 16 Base44 entity schemas.
- `base44/functions/`: 27 Base44 backend function directories, each with an `entry.ts` and function descriptor.
- `supabase/migrations/`: public storage policy, application schema/RLS, and checkout/order-status RPC migrations.
- `supabase/config.toml`: local Supabase configuration. It does not prove production Dashboard settings.
- `vite.config.js`: Base44 Vite plugin remains installed and enabled.

Important implementation references: [App.jsx](../src/App.jsx), [AuthContext.jsx](../src/lib/AuthContext.jsx), [supabase.js](../src/lib/supabase.js), [supabaseCatalog.js](../src/lib/supabaseCatalog.js), [supabaseOrders.js](../src/lib/supabaseOrders.js), [supabaseStorage.js](../src/lib/supabaseStorage.js), [vite.config.js](../vite.config.js).

## Feature Status

Statuses describe repository implementation, not live production verification. “Ishlamaydi” below means the Supabase-provider path is not implemented or is routed to Base44; it does not claim the existing Base44 path is broken.

| Feature | Status | Repository evidence and limitation |
|---|---|---|
| Auth / Google OAuth | Qisman tayyor | `AuthContext` supports Supabase session restore, auth-state subscription cleanup, and profile reads. Login/register/password reset and Google OAuth helpers exist. However, the rest of the app still has Base44 calls, so switching auth alone is not a complete provider migration. OAuth round-trip and Dashboard settings were not tested. |
| Business and branches | Qisman tayyor | `supabaseCatalog.js` has business/branch list, create, and update helpers. Some create/edit pages switch provider; business profile, branch detail, inventory and other calls still use Base44. |
| Products and catalog | Qisman tayyor | Supabase catalog list/create/update and branch catalog reads exist and are used on selected buyer/seller screens. Seller product details, categories, search paths or inventory operations still contain Base44 calls. |
| Cart | Ishlamaydi (Supabase mode) | `CartContext.jsx` always invokes Base44 cart functions. The Supabase schema has `carts`/`cart_items`, but no Supabase cart data-access implementation is used by the context. |
| Addresses | Ishlamaydi (Supabase mode) | Address pages and checkout read/write through Base44 entities/functions. Supabase `addresses` and owner RLS exist, but no Supabase address CRUD integration was found. |
| Checkout | Qisman tayyor | `vimi_checkout` RPC exists and `supabaseOrders.js` wraps it, but `buyer/Checkout.jsx` always calls Base44 `checkout`. The RPC has no explicit idempotency key and does not restrict `p_payment_method` to an allowlist. |
| Buyer orders | Qisman tayyor | Supabase order-status RPC wrapper exists, but buyer order list/detail read and cancellation pages call Base44. No Supabase order-list/detail data helper was found. |
| Seller panel / seller orders | Qisman tayyor | Parts of business/product/branch CRUD use Supabase. Dashboard, statistics, seller order list/detail and updates still call Base44. |
| Profile | Qisman tayyor | Supabase Auth bootstraps and reads `profiles`; profile update grant allows selected fields. The profile screens are mostly read-only, selected-location updates still call Base44, and `ProfileEdit.jsx` is not wired in `App.jsx`. |
| Favorite and saved stores | Ishlamaydi (Supabase mode) | `BuyerContext.jsx` calls Base44 for saved stores, visits, favorites and connect-store. Supabase tables and owner RLS exist, but no Supabase API integration was found. |
| Notifications | Ishlamaydi (Supabase mode) | Notification list/realtime/read actions call Base44 entities/functions. Supabase schema has notification select/update RLS but no UI data-access path. |
| Storage | Qisman tayyor | Product image and business logo uploads can use `vimi-public` when `VITE_STORAGE_PROVIDER=supabase`; uploads validate MIME and size and use user-owned paths. The bucket is public for every object, so it is not suitable for private avatars. Live policy behavior is unverified. |

Relevant files: [CartContext.jsx](../src/lib/CartContext.jsx), [BuyerContext.jsx](../src/lib/BuyerContext.jsx), [Checkout.jsx](../src/pages/buyer/Checkout.jsx), [Addresses.jsx](../src/pages/buyer/Addresses.jsx), [Orders.jsx](../src/pages/buyer/Orders.jsx), [Notifications.jsx](../src/pages/Notifications.jsx), [Profile.jsx](../src/pages/buyer/Profile.jsx), [ProfileEdit.jsx](../src/pages/ProfileEdit.jsx).

## Base44 Inventory

### Frontend SDK Surface

- SDK client: `src/api/base44Client.js`; Base44 Vite plugin: `vite.config.js`.
- Direct Base44 entity types found in frontend: `Address`, `Branch`, `BranchInventory`, `Business`, `Category`, `FavoriteStore`, `GeoArea`, `Notification`, `Product`, `ProductCategory`, and `SavedStore`.
- Additional entities used by Base44 backend functions: `Cart`, `CartItem`, `Order`, and `OrderItem`. `User.jsonc` exists as a schema, but no direct use of `base44.entities.User` was found.
- Base44 frontend function names invoked: `addToCart`, `checkout`, `clearCart`, `connectStore`, `createBranch`, `createProduct`, `deleteAddress`, `getBranchCatalog`, `getBuyerStores`, `getMyCart`, `getMyOrder`, `getMyOrders`, `getSellerDashboard`, `getSellerOrder`, `getSellerOrders`, `getSellerStatistics`, `markStoreVisited`, `removeCartItem`, `saveAddress`, `searchCatalog`, `setNotificationRead`, `updateBranch`, `updateCartItem`, `updateOrderStatus`, `upsertInventory`, and `updateProduct`.
- `reorder` exists under `base44/functions/` but no frontend invocation was found.
- Auth/app SDK methods found: `base44.auth.me`, `logout`, `redirectToLogin`, `updateMe`, `resetPasswordRequest`, `loginViaEmailPassword`, `loginWithProvider`, `register`, `verifyOtp`, `setToken`, `resendOtp`, and `base44.app.getPublicSettings`.
- Base44 uploads remain in `LogoUpload.jsx` and `ProductImageUpload.jsx` as the non-Supabase storage path. `app-params.js` imports Base44 `getAccessToken`; `PageNotFound.jsx` calls `base44.auth.me`.

### Base44 Backend Function Directories

`addToCart`, `checkout`, `clearCart`, `connectStore`, `createBranch`, `createProduct`, `deleteAddress`, `getBranchCatalog`, `getBuyerStores`, `getMyCart`, `getMyOrder`, `getMyOrders`, `getSellerDashboard`, `getSellerOrder`, `getSellerOrders`, `getSellerStatistics`, `markStoreVisited`, `removeCartItem`, `reorder`, `saveAddress`, `searchCatalog`, `setNotificationRead`, `updateBranch`, `updateCartItem`, `updateOrderStatus`, `updateProduct`, `upsertInventory`.

Base44 backend functions use `base44.auth.me()` to identify the caller and many use `base44.asServiceRole.entities.*` for reads/writes. Their existence does not demonstrate that the same data/actions are available under Supabase Auth.

## Supabase Schema, RLS, RPC, and Storage

### Schema and RLS

`202610130002_vimi_schema.sql` creates `profiles`, catalog/business/branch/product/inventory tables, addresses, carts/cart items, orders/order items, favorites/saved stores, and notifications. It enables RLS on these tables and declares owner-based policies. `profiles` update grants are column-limited to `full_name`, `phone`, `avatar`, and `selected_location`; `role` is not granted for client update.

Personal data policies generally scope addresses/carts/favorites/saved stores/notifications by `auth.uid()`. Cart items check parent cart ownership. Orders and order items are selectable by the buyer or the business owner. These are source-level findings only; no two-user RLS test or live database query was run.

Risks requiring review before applying to production:

- The schema has no partial unique index enforcing one default address per user. Client/function logic alone cannot guarantee this invariant under concurrent updates.
- There is no unique constraint for one active cart per user. `unique(cart_id, product_id)` prevents duplicate item rows within a cart, but does not prevent concurrent creation of multiple active carts.
- Public catalog policies check active state of the individual business, branch, product, or inventory row, but do not consistently require the full business/branch/product relationship to be active. Review inactive-business exposure and catalog consistency.
- `profiles` signup uses a client `upsert` in addition to the auth trigger. The `role` column restriction is helpful, but the live table grants and trigger behavior must be verified against the deployed schema.
- No Base44-to-Supabase data import or reconciliation process is present in the inspected migrations/docs.

### Checkout and Order Status

`202610130003_atomic_checkout_order_status.sql` defines `vimi_checkout` and `vimi_update_order_status` as `SECURITY DEFINER` functions with `search_path = ''`, revokes execute from `public`/`anon`, and grants execute to `authenticated`.

Positive source-level controls in `vimi_checkout`: validates the authenticated user, active owned cart, active business/branch, owned address, active products, inventory availability and stock; locks the cart and inventory rows; calculates prices from current product/inventory values; inserts order snapshots, decrements stock and clears/closes the cart in one PostgreSQL function call/transaction. This supports atomicity when called in PostgreSQL, but the UI does not currently call this RPC.

Remaining risks: no idempotency key is accepted/stored; a second call using the same cart is rejected after the first closes it, but duplicate active carts or client retry behavior are not comprehensively guarded. `p_payment_method` accepts arbitrary values despite the current UI sending cash-on-delivery. Database runtime behavior, lock contention and rollback were not tested.

`vimi_update_order_status` locks the order row and validates buyer/seller ownership and allowed transitions. Cancellation restores inventory and updates status in the same transaction; the row lock plus transition check appears to prevent repeated restoration for the same order. No concurrent runtime test was run.

### Storage

`202610130001_storage_vimi_public.sql` provisions a public `vimi-public` bucket with 5 MiB limit and JPG/PNG/WebP MIME allowlist. Read is public; insert/update/delete require the first path folder to equal the authenticated user ID. This protects writes to another user's folder, but all uploaded objects are publicly readable. Restrict usage to public product/business assets or introduce a private bucket and signed URLs for private content. The local Supabase config's global storage cap is 50 MiB; the migration bucket cap is 5 MiB.

### Service Role Key Check

No `service_role`, `SUPABASE_SERVICE_ROLE_KEY`, or service-role variable/reference was found in `src/**`. The browser client uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Secret-bearing `.env`/`.env.local` values were deliberately not read or searched, so this is not a claim that local or hosted environment configuration is clean. No service-role value was printed.

Migration references: [storage migration](../supabase/migrations/202610130001_storage_vimi_public.sql), [schema/RLS migration](../supabase/migrations/202610130002_vimi_schema.sql), [checkout/status migration](../supabase/migrations/202610130003_atomic_checkout_order_status.sql), [local Supabase config](../supabase/config.toml).

## Auth and Runtime Configuration Notes

- `VITE_AUTH_PROVIDER` is checked independently in multiple components; there is no centralized provider validation or warning for unknown values.
- Supabase auth is selected only when the flag equals `supabase`; absent/other values fall back to Base44 in several paths.
- Supabase Google OAuth is wired from Login/Register through `signInWithGoogleSupabase`, but Dashboard provider credentials, Site URL and production Redirect URLs are unknown.
- `supabase/config.toml` local `site_url` and redirect URL use `127.0.0.1:3000`; the README describes the Base44/Vite frontend as typically using port 5173. Confirm and align the local callback URL before live OAuth tests.
- `README.md` says `base44 dev` is the default full-stack local command. Do not infer that `npm run dev` includes a Base44 backend.
- `npm run build` emitted a large-chunk warning (about 1.52 MB minified JS), stale Browserslist data warning and Base44 proxy-not-enabled notice. It did complete successfully.

## Checks Executed

| Command | Result |
|---|---|
| `npm run build` | Completed successfully (exit 0). Vite built 2,651 modules. Warnings: outdated Browserslist data, Base44 proxy not enabled, and JS chunk above 500 kB. |
| `npm run lint` | Failed (exit 1): 24 unused-import errors across 13 source files. No files were changed to fix them because this is an audit-only request. |
| `npm run typecheck` | Failed: TypeScript reported 701 errors in 95 files. Error examples include JSX component-prop mismatches, missing `ImportMeta.env` typing, a `listProducts` argument mismatch, and 146 diagnostics in `node_modules/leaflet/dist/leaflet-src.js`. The tool truncated output before exposing the process exit code; the exact typecheck exit code was not captured. |
| Tests | `package.json` has no test script and no `*.test.*`/`*.spec.*` files were found under `src/`. No tests were run. |

No install, live Supabase connection, OAuth login, RLS test, data migration, or deployment was performed.

## Prioritized Remaining Work

### P0 — Prevent mixed-identity production use

**Files:** `src/lib/AuthContext.jsx`, `src/lib/BuyerContext.jsx`, `src/lib/CartContext.jsx`, `src/lib/BusinessContext.jsx`, `src/lib/PageNotFound.jsx`, and any affected buyer/seller pages.
**Work:** Either keep `VITE_AUTH_PROVIDER=base44` until Supabase paths are complete, or finish and consistently route every active data call to Supabase. Do not send a Supabase-authenticated user/session to Base44 backend functions as if it were a Base44 identity. Centralize provider selection and make unsupported paths explicit.
**Acceptance:** Provider is validated once; each protected operation uses the same identity provider end-to-end; no Base44 call is reachable in the declared Supabase flow; Base44 mode remains functional.

### P0 — Complete secure cart, address, and checkout flow

**Files:** `src/lib/CartContext.jsx`, `src/pages/buyer/Cart.jsx`, `src/pages/buyer/Checkout.jsx`, `src/pages/buyer/Addresses.jsx`, `src/pages/buyer/AddressEdit.jsx`, `src/lib/supabaseOrders.js`, and a new forward-only SQL migration.
**Work:** Implement Supabase cart/address APIs, use the existing checkout RPC from the UI, enforce a single active cart and one default address at the database level, validate accepted payment methods, and decide whether idempotency tokens are required. Preserve Base44 mode.
**Acceptance:** Two-user isolation passes; wrong-owner address/cart requests fail; duplicate/concurrent cart creation cannot mix stores; stock contention never makes inventory negative; checkout success creates one order and consumes one cart; any failure rolls back order, inventory and cart changes.

### P0 — Verify and harden database trust boundaries

**Files:** `supabase/migrations/*` and a new forward-only migration after checking deployed migration history.
**Work:** Verify deployed RLS and grants, relationship integrity and public catalog visibility; address default uniqueness, active-cart uniqueness, and any missing business/branch/product validation. Do not edit an already-applied migration in place.
**Acceptance:** Automated/two-user SQL tests prove no cross-user reads/writes; seller A cannot access seller B's data; anon can see only intended active public catalog data; RPC grants and `search_path` are confirmed on the target project.

### P1 — Migrate buyer/seller orders and status operations

**Files:** `src/pages/buyer/Orders.jsx`, `src/pages/buyer/OrderDetail.jsx`, `src/pages/seller/Orders.jsx`, `src/pages/seller/OrderDetail.jsx`, seller dashboard/statistics pages, `src/lib/supabaseOrders.js`.
**Work:** Add buyer/seller reads and dashboard aggregations under RLS; route status updates through the existing RPC; preserve order item/address snapshots.
**Acceptance:** Buyer sees only own orders; seller sees only own business orders; forbidden transitions fail; cancellation restores stock once under concurrent requests; totals use order snapshots.

### P1 — Migrate business, branch, product, and inventory parity

**Files:** `src/lib/supabaseCatalog.js`, `src/lib/BusinessContext.jsx`, seller business/branch/product/category/inventory pages and components.
**Work:** Replace remaining Base44 access in the selected Supabase experience; validate branch/product/category ownership relationships server-side and retain Base44 fallback.
**Acceptance:** CRUD and public catalog operate under Supabase RLS; inactive/non-owned records are not exposed or editable; stock and branch filtering match the UI contract.

### P1 — Buyer data, profile, notifications, and storage privacy

**Files:** `src/lib/BuyerContext.jsx`, address/profile/notification screens, `src/lib/supabaseStorage.js`, upload components, storage migrations.
**Work:** Implement favorites/saved stores/location/notifications/profile updates in Supabase. Decide whether avatars are private; separate private data from the public image bucket.
**Acceptance:** Two-user isolation tests pass; only allowed profile columns are writable; notification read state is owner-scoped; public bucket contains only intentionally public images; private objects require signed access.

### P1 — Resolve validation gates

**Files:** `package.json`, `jsconfig.json`, and reported source files after the current baseline is reviewed.
**Work:** Triage the 24 lint errors and 701 typecheck errors; distinguish true project errors from JS-check/type-definition configuration noise; add a repeatable test suite for auth, cart, checkout and RLS. Do not hide errors with broad disables.
**Acceptance:** Build, lint and typecheck pass in clean CI; tests cover ownership, concurrency and rollback; `npm test` (or the repository's selected test command) is documented and repeatable.

### P2 — Operational migration and release readiness

**Files:** `README.md`, `docs/`, `supabase/migrations/`, deployment/CI configuration.
**Work:** Define a Base44 export/import/reconciliation and rollback plan; verify Supabase Auth Google provider, production redirect allowlist, Storage policies, CORS, backups, monitoring, environment variable inventory and deployed migration history.
**Acceptance:** Staging end-to-end checklist passes against a real configured Supabase project; no secret is in browser artifacts; data counts/reconciliation are signed off; rollback and recovery are practiced.

## Not Verified

- Supabase project/table/policy/RPC state and whether these SQL migrations have been applied.
- Supabase Auth settings, Google OAuth credentials, allowed redirects, SMTP/email verification and live callbacks.
- Production environment variables or any secret values; `.env` and `.env.local` were not opened.
- Base44-to-Supabase record migration or production data consistency.
- Runtime RLS isolation, concurrent checkout/cancellation, Storage upload/read permissions, and end-to-end UI flows.
- Deployment host, domain, HTTPS, backups, monitoring, and release rollback configuration.