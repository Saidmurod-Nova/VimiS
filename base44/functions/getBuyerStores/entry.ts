import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { branchLocation } from "../../shared/storeAuth.ts";

// Returns the current buyer's saved stores and favorites with denormalized
// public business info, a representative location, branch count, favorite
// membership, and a "new products" indicator (products created after the
// user's last visit). Inactive businesses are excluded from discovery.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const [saved, favorites] = await Promise.all([
      base44.asServiceRole.entities.SavedStore.filter({ user_id: user.id }, "-last_visited_at", 200),
      base44.asServiceRole.entities.FavoriteStore.filter({ user_id: user.id }, "-created_date", 200)
    ]);

    const favIds = new Set((favorites || []).map((f) => f.business_id));

    const buildEntry = async (businessId, relation) => {
      const business = await base44.asServiceRole.entities.Business.get(businessId);
      if (!business || !business.is_active) return null;
      const [branches, products] = await Promise.all([
        base44.asServiceRole.entities.Branch.filter({ business_id: businessId, is_active: true }),
        base44.asServiceRole.entities.Product.filter({ business_id: businessId, is_active: true }, "-created_date", 50)
      ]);
      const activeBranches = (branches || []).filter((b) => b.is_active);
      let hasNew = false;
      if (relation.last_visited_at) {
        const visitedAt = new Date(relation.last_visited_at).getTime();
        hasNew = (products || []).some((p) => p.created_date && new Date(p.created_date).getTime() > visitedAt);
      }
      return {
        business,
        location: activeBranches[0] ? branchLocation(activeBranches[0]) : "",
        branch_count: activeBranches.length,
        has_new: hasNew,
        is_favorite: favIds.has(businessId)
      };
    };

    const items = [];
    for (const s of (saved || [])) {
      const entry = await buildEntry(s.business_id, s);
      if (!entry) continue;
      items.push({ ...entry, saved: { id: s.id, business_id: s.business_id, last_visited_at: s.last_visited_at, created_date: s.created_date } });
    }

    const favItems = [];
    for (const f of (favorites || [])) {
      const entry = await buildEntry(f.business_id, { last_visited_at: null });
      if (!entry) continue;
      favItems.push({ ...entry, favorite_id: f.id });
    }

    return Response.json({ items, favorites: favItems });
  } catch (error) {
    return Response.json({ error: error.message || "Yuklanmadi" }, { status: error.status || 500 });
  }
}