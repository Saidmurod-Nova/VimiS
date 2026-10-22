import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getOwnedProduct } from '../../shared/productAuth.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { product_id, name, description, image_url, category_id, price, is_active } = body || {};
    if (!product_id) return Response.json({ error: "Mahsulot majburiy" }, { status: 400 });

    const product = await getOwnedProduct(base44, product_id, user.id);

    const update = {};
    if (name !== undefined) update.name = String(name).trim();
    if (description !== undefined) update.description = description || '';
    if (image_url !== undefined) update.image_url = image_url || null;
    if (is_active !== undefined) update.is_active = !!is_active;
    if (price !== undefined) {
      const numPrice = Math.round(Number(price));
      if (Number.isNaN(numPrice) || numPrice < 0) return Response.json({ error: "Narx noto'g'ri" }, { status: 400 });
      update.price = numPrice;
    }
    if (category_id !== undefined) {
      if (category_id) {
        const cat = await base44.asServiceRole.entities.ProductCategory.get(category_id);
        if (!cat || cat.business_id !== product.business_id) {
          return Response.json({ error: "Kategoriya ushbu biznesga tegishli emas" }, { status: 400 });
        }
        update.category_id = category_id;
        update.category_name = cat.name;
      } else {
        update.category_id = null;
        update.category_name = '';
      }
    }

    const updated = await base44.asServiceRole.entities.Product.update(product_id, update);
    return Response.json({ product: updated });
  } catch (error) {
    return Response.json({ error: error.message || "Mahsulot yangilanmadi" }, { status: error.status || 500 });
  }
}