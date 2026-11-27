import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useBusiness } from "@/lib/BusinessContext";
import { isSupabaseMode } from "@/lib/supabase";
import { createProductCategory, deleteProductCategory, updateProductCategory } from "@/lib/supabaseRelations";
import { listProductCategories, listProducts } from "@/lib/supabaseCatalog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, Tag, Loader2, Check } from "lucide-react";
import PageHeader from "@/components/vimi/PageHeader";
import { PrimaryButton, IconButton } from "@/components/vimi/VimiButton";
import { TextInput } from "@/components/vimi/VimiInput";
import { LoadingState, EmptyState, ErrorState } from "@/components/vimi/States";

export default function Categories() {
  const { selectedBusiness: biz, loading: bizLoading } = useBusiness();
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const productsPath = biz ? `/business/${biz.id}/products` : "/business";

  const load = useCallback(async () => {
    if (!biz?.id) { setCategories([]); setProducts([]); setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const [c, p] = await Promise.all(isSupabaseMode ? [
        listProductCategories(biz.id),
        listProducts({ businessId: biz.id, includeInactive: true, limit: 200 })
      ] : [
        base44.entities.ProductCategory.filter({ business_id: biz.id }, "name"),
        base44.entities.Product.filter({ business_id: biz.id }, "-created_date", 200)
      ]);
      setCategories(c || []);
      setProducts(p || []);
    } catch (loadError) {
      console.error("Mahsulot kategoriyalarini yuklab bo‘lmadi.", loadError);
      setError(loadError?.message || "Mahsulot kategoriyalarini yuklab bo‘lmadi.");
      setCategories([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [biz?.id]);

  useEffect(() => { load(); }, [load]);

  const countByCategory = (catId) => products.filter((p) => p.category_id === catId).length;

  const create = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    if (categories.some((category) => category.name.localeCompare(newName.trim(), undefined, { sensitivity: "base" }) === 0)) {
      toast({ title: "Bu kategoriya allaqachon mavjud", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const created = isSupabaseMode
        ? await createProductCategory(biz.id, newName)
        : await base44.entities.ProductCategory.create({ business_id: biz.id, name: newName.trim() });
      setCategories((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
    } catch (err) {
      toast({ title: err.message || "Kategoriya yaratilmadi", variant: "destructive" });
    } finally { setCreating(false); }
  };

  const saveEdit = async (catId) => {
    if (!editName.trim()) return;
    setSavingId(catId);
    try {
      if (isSupabaseMode) await updateProductCategory(catId, editName);
      else await base44.entities.ProductCategory.update(catId, { name: editName.trim() });
      setCategories((prev) => prev.map((c) => (c.id === catId ? { ...c, name: editName.trim() } : c)));
      setEditingId(null);
    } catch (err) {
      toast({ title: err.message || "Yangilanmadi", variant: "destructive" });
    } finally { setSavingId(null); }
  };

  const remove = async (cat) => {
    const count = countByCategory(cat.id);
    if (count > 0) {
      toast({ title: "Bu kategoriyada mahsulotlar mavjud", description: "Avval mahsulotlarni boshqa kategoriyaga o'tkazing.", variant: "destructive" });
      return;
    }
    try {
      if (isSupabaseMode) await deleteProductCategory(cat.id);
      else await base44.entities.ProductCategory.delete(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    } catch (err) {
      toast({ title: err.message || "O'chirilmadi", variant: "destructive" });
    }
  };

  if (bizLoading || loading) return <div className="workspace-page space-y-4"><PageHeader title="Kategoriyalar" backTo={productsPath} /><LoadingState /></div>;
  if (!biz) return <div className="workspace-page space-y-4"><PageHeader title="Kategoriyalar" backTo={productsPath} /><EmptyState title="Avval biznes tanlang" /></div>;

  return (
    <div className="workspace-page animate-fade-in space-y-5">
      <PageHeader title="Kategoriyalar" subtitle="Mahsulotlaringizni biznes kategoriyalari bo‘yicha tartiblang." backTo={productsPath} />
      {error ? <ErrorState title={error} onRetry={load} /> : null}
      <form onSubmit={create} className="surface-card flex items-center gap-2 p-3">
        <TextInput value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Yangi kategoriya nomi" maxLength={60} required />
        <PrimaryButton type="submit" aria-label="Kategoriya qo‘shish" className="h-12 px-4" disabled={creating}>{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}</PrimaryButton>
      </form>

      {!error && categories.length === 0 ? (
        <EmptyState icon={Tag} title="Hozircha kategoriyalar yo'q" description="Mahsulotlarni guruhlash uchun kategoriya qo'shing." />
      ) : (
        <div className="space-y-2">
          {categories.map((c) => {
            const count = countByCategory(c.id);
            const editing = editingId === c.id;
            return (
              <div key={c.id} className="flex items-center gap-2 border-b border-border bg-card px-4 py-3 last:border-b-0">
                {editing ? (
                  <>
                    <TextInput value={editName} onChange={(e) => setEditName(e.target.value)} placeholder={c.name} className="flex-1" autoFocus />
                    <IconButton icon={Check} label="Saqlash" onClick={() => saveEdit(c.id)} disabled={savingId === c.id} />
                  </>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{count} mahsulot</p>
                    </div>
                    <IconButton icon={Pencil} label="Tahrirlash" onClick={() => { setEditingId(c.id); setEditName(c.name); }} />
                    <IconButton icon={Trash2} label="O'chirish" onClick={() => remove(c)} />
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}