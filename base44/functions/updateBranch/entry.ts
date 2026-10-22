import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getOwnedBusiness } from '../../shared/branchAuth.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { branch_id, ...fields } = body || {};
    if (!branch_id) return Response.json({ error: "branch_id majburiy" }, { status: 400 });

    const branch = await base44.asServiceRole.entities.Branch.get(branch_id);
    if (!branch) return Response.json({ error: "Filial topilmadi" }, { status: 404 });

    // Server-side: only the owner of the branch's business may edit it.
    await getOwnedBusiness(base44, branch.business_id, user.id);

    const update = {};
    for (const k of ["name", "geo_area_id", "country", "region", "city", "district", "address", "phone", "working_hours", "is_active"]) {
      if (fields[k] !== undefined) update[k] = fields[k];
    }
    if (fields.latitude !== undefined) {
      const lat = Number(fields.latitude);
      if (Number.isNaN(lat) || lat < -90 || lat > 90) return Response.json({ error: "Latitude noto'g'ri" }, { status: 400 });
      update.latitude = lat;
    }
    if (fields.longitude !== undefined) {
      const lng = Number(fields.longitude);
      if (Number.isNaN(lng) || lng < -180 || lng > 180) return Response.json({ error: "Longitude noto'g'ri" }, { status: 400 });
      update.longitude = lng;
    }

    const updated = await base44.asServiceRole.entities.Branch.update(branch_id, update);
    return Response.json({ branch: updated });
  } catch (error) {
    return Response.json({ error: error.message || "Filial yangilanmadi" }, { status: error.status || 500 });
  }
}