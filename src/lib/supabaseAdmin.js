import { requireSupabase } from "@/lib/supabase";

export async function createAdminCategory({ name, icon }) {
  const client = requireSupabase();
  const { data, error } = await client.from("categories")
    .insert({ name: String(name).trim(), icon: String(icon || "").trim() || null })
    .select("id,name,icon")
    .single();
  if (error) throw new Error(error.message || "Kategoriya yaratilmadi.");
  return data;
}

export async function updateAdminCategory(categoryId, { name, icon }) {
  const client = requireSupabase();
  const { data, error } = await client.from("categories")
    .update({ name: String(name).trim(), icon: String(icon || "").trim() || null })
    .eq("id", String(categoryId))
    .select("id,name,icon")
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