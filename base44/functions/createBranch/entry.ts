import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getOwnedBusiness } from '../../shared/branchAuth.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      business_id, name, geo_area_id, country, region, city, district,
      address, latitude, longitude, phone, working_hours
    } = body || {};

    if (!business_id || !name || latitude == null || longitude == null) {
      return Response.json({ error: "Filial nomi, biznes va joylashuv majburiy" }, { status: 400 });
    }

    // Server-side: only the business owner may create its branches.
    await getOwnedBusiness(base44, business_id, user.id);

    const branch = await base44.asServiceRole.entities.Branch.create({
      business_id,
      owner_id: user.id,
      name,
      geo_area_id,
      country,
      region,
      city,
      district,
      address,
      latitude: Number(latitude),
      longitude: Number(longitude),
      phone,
      working_hours,
      is_active: true
    });

    return Response.json({ branch });
  } catch (error) {
    return Response.json({ error: error.message || "Filial yaratilmadi" }, { status: error.status || 500 });
  }
}