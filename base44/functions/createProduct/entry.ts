import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getOwnedBusiness } from '../../shared/productAuth.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { business_id, category_id, name, description, image_url, price } = body || {};

    if (!business_id || !name || !String(name).trim() || price == null) {
      return Response.json({ error: "Biznes, nom va narx majburiy" }, { status: 400 });
    }
    const numPrice = Math.round(Number(price));
    if (Number.isNaN(numPrice) || numPrice < 0) {
      return Response.json({ error: "Narx noto'g'ri" }, { status: 400 });
    }

    // Only the business owner may create its products.
    await getOwnedBusiness(base44, business_id, user.id);

    // If a category is provided it must belong to the same business.
    let categoryName = '';
    if (category_id) {
      const cat = await base44.asServiceRole.entities.ProductCategory.get(category_id);
      if (!cat || cat.business_id !== business_id) {
        return Response.json({ error: "Kategoriya ushbu biznesga tegishli emas" }, { status: 400 });
      }
      categoryName = cat.name;
    }

    const product = await base44.asServiceRole.entities.Product.create({
      business_id,
      category_id: category_id || null,
      category_name: categoryName,
      name: String(name).trim(),
      description: description || '',
      image_url: image_url || null,
      price: numPrice,
      is_active: true
    });

    return Response.json({ product });
  } catch (error) {
    return Response.json({ error: error.message || "Mahsulot yaratilmadi" }, { status: error.status || 500 });
  }
}