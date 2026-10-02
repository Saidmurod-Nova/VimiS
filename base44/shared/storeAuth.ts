// Shared helpers for buyer store lookup operations.
// Store IDs are stored uppercase (see src/lib/storeId.js); inputs are normalized
// before lookup so users can type any case.

export function normalizeStoreId(input: string): string {
  return (input || "").trim().toUpperCase();
}

// Escapes a string for safe use inside a RegExp (MongoDB $regex). Keeps user
// input with special characters from breaking the query.
export function escapeRegex(input: string): string {
  return (input || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Finds an active business by its public Store ID. Returns null when missing.
export async function findBusinessByStoreId(base44, storeId: string) {
  const list = await base44.asServiceRole.entities.Business.filter({ store_id: storeId });
  return list && list[0] ? list[0] : null;
}

// Returns a short human-readable location string for a business derived from
// its active branches (first branch's city/region). Empty string when none.
export function branchLocation(branch: any): string {
  if (!branch) return "";
  return [branch.city, branch.region].filter(Boolean).join(", ");
}

// Idempotent upsert of a SavedStore relationship for a user+business. Without a
// database unique constraint, concurrent calls (e.g. connectStore + a visit)
// can each create a record; this cleans up any duplicates, keeping the one
// with the most recent last_visited_at (so visit timestamps survive).
// `patch` is merged on update/insert (e.g. { last_visited_at }); pass {} to
// only ensure the relationship exists without resetting the visit time.
export async function upsertSavedStore(base44, userId: string, businessId: string, patch: any = {}): Promise<{ saved: any; created: boolean }> {
  const existing = await base44.asServiceRole.entities.SavedStore.filter({ user_id: userId, business_id: businessId });
  let saved;
  let created = false;
  if (existing && existing[0]) {
    saved = Object.keys(patch).length ? await base44.asServiceRole.entities.SavedStore.update(existing[0].id, patch) : existing[0];
  } else {
    saved = await base44.asServiceRole.entities.SavedStore.create({ user_id: userId, business_id: businessId, ...patch });
    created = true;
  }
  const all = await base44.asServiceRole.entities.SavedStore.filter({ user_id: userId, business_id: businessId });
  if (all && all.length > 1) {
    const sorted = all.slice().sort((a: any, b: any) => {
      const av = a.last_visited_at ? new Date(a.last_visited_at).getTime() : 0;
      const bv = b.last_visited_at ? new Date(b.last_visited_at).getTime() : 0;
      if (av !== bv) return bv - av;
      return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
    });
    const keep = sorted[0];
    for (const s of sorted.slice(1)) {
      try { await base44.asServiceRole.entities.SavedStore.delete(s.id); } catch {}
    }
    saved = keep;
  }
  return { saved, created };
}