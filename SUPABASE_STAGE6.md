# Vimi Supabase Migration — Stage 6

This stage connects seller business creation, category selection, branch create/edit, and branch inventory reads/writes to the Supabase catalog helpers when `VITE_AUTH_PROVIDER=supabase`. Base44 behavior remains the fallback when the provider is `base44`.

## Changed files
- `src/lib/supabaseCatalog.js`: unique Store ID generation, branch read/update, branch-based inventory upsert helper.
- `src/pages/seller/BusinessCreate.jsx`: Supabase business creation and Store ID path.
- `src/components/vimi/CategorySelect.jsx`: reads categories from Supabase in Supabase mode.
- `src/pages/seller/BranchCreate.jsx`: Supabase branch creation.
- `src/pages/seller/BranchEdit.jsx`: Supabase branch read/update.
- `src/pages/seller/BranchInventory.jsx`: Supabase branch/products/inventory reads.
- `src/components/vimi/InventoryEditSheet.jsx`: Supabase inventory upsert.

## Before enabling in a live environment
1. Confirm the schema migrations from Stage 1 and Stage 3 have been applied successfully.
2. Ensure the signed-in user has a matching `profiles` row.
3. Ensure the `categories` table contains categories. The old Base44 category records are not imported automatically.
4. Test with a non-admin seller account: create business, create branch, add product, set stock, then sign out and confirm unauthorized writes are denied.
5. Build and lint the project. This archive has not been verified against a live Supabase project.

## Known remaining migration work
- Logo/product image upload needs the Storage uploader integrated with the UI components.
- Buyer catalog/search/store pages still need an end-to-end audit.
- Cart, address, order, notification, dashboard/statistics and remaining Base44 functions still require migration or verification.
- Keep `VITE_AUTH_PROVIDER=base44` until the rest of the app is migrated and tested; switch only in a separate test environment first.
