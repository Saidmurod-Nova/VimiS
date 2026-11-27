import { requireSupabase } from "@/lib/supabase";

export async function createAdminCategory({ name, icon, parentId = null, sortOrder = 0 }) {
  const client = requireSupabase();
  const { data, error } = await client.from("categories")
    .insert({
      name: String(name).trim(),
      icon: String(icon || "").trim() || null,
      parent_id: parentId || null,
      sort_order: Number(sortOrder) || 0,
    })
    .select("id,name,icon,parent_id,sort_order")
    .single();
  if (error) throw new Error(error.message || "Kategoriya yaratilmadi.");
  return data;
}

export async function updateAdminCategory(categoryId, { name, icon, parentId = null, sortOrder = 0 }) {
  const client = requireSupabase();
  const { data, error } = await client.from("categories")
    .update({
      name: String(name).trim(),
      icon: String(icon || "").trim() || null,
      parent_id: parentId || null,
      sort_order: Number(sortOrder) || 0,
    })
    .eq("id", String(categoryId))
    .select("id,name,icon,parent_id,sort_order")
    .single();
  if (error) throw new Error(error.message || "Kategoriya yangilanmadi.");
  return data;
}

export async function deleteAdminCategory(categoryId) {
  const client = requireSupabase();
  const { error } = await client.from("categories").delete().eq("id", String(categoryId));
  if (error) throw new Error(error.message || "Kategoriya o‘chirilmadi.");
}

export async function getAdminOverview() {
  const client = requireSupabase();
  const [businesses, products, categories] = await Promise.all([
    client.from("businesses").select("id", { count: "exact", head: true }).eq("is_active", true),
    client.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
    client.from("categories").select("id", { count: "exact", head: true }),
  ]);
  const failed = [businesses, products, categories].find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message || "Admin ma’lumotlarini yuklab bo‘lmadi.");
  return {
    businesses: businesses.count || 0,
    products: products.count || 0,
    categories: categories.count || 0,
  };
}

export async function getAdminCourierApplications() {
  const { data, error } = await requireSupabase().rpc("vimi_admin_list_courier_applications");
  if (error) {
    if (error.code === "PGRST202") {
      throw new Error(
        "Kuryer arizalari RPC funksiyasi Supabase schema keshida topilmadi. 202611030001 migratsiyasini tekshiring va PostgREST schema keshini yangilang."
      );
    }
    throw new Error(error.message || "Kuryerlik arizalarini yuklab bo‘lmadi.");
  }
  if (!Array.isArray(data)) throw new Error("Kuryerlik arizalari noto‘g‘ri shaklda keldi.");
  return data;
}

export async function setAdminCourierApplicationStatus(userId, status) {
  if (!userId || !["approved", "rejected"].includes(status)) {
    throw new Error("Kuryer arizasi yoki holati noto‘g‘ri.");
  }
  const { data, error } = await requireSupabase().rpc("vimi_admin_set_courier_application_status", {
    p_user_id: userId,
    p_status: status,
  });
  if (error) {
    if (error.code === "PGRST202") {
      throw new Error(
        "Kuryer arizalarini boshqarish RPC funksiyasi Supabase schema keshida topilmadi. 202611030001 migratsiyasini tekshiring va PostgREST schema keshini yangilang."
      );
    }
    throw new Error(error.message || "Kuryer arizasi yangilanmadi.");
  }
  return data;
}