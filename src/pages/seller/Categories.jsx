import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useBusiness } from "@/lib/BusinessContext";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, Tag, Loader2, Check } from "lucide-react";
import PageHeader from "@/components/vimi/PageHeader";
import { PrimaryButton, SecondaryButton, GhostButton, IconButton } from "@/components/vimi/VimiButton";
import { TextInput } from "@/components/vimi/VimiInput";
import { LoadingState, EmptyState } from "@/components/vimi/States";
import { Label } from "@/components/ui/label";

export default function Categories() {
  const navigate = useNavigate();
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

  const load = () => {
    if (!biz) { setCategories([]); setProducts([]); setLoading(false); return; }
    setLoading(true);
    Promise.all([
      base44.entities.ProductCategory.filter({ business_id: biz.id }, "name"),
      base44.entities.Product.filter({ business_id: biz.id }, "-created_date", 200)
    ]).then(([c, p]) => { setCategories(c || []); setProducts(p || []); })
      .catch(() => { setCategories([]); setProducts([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [biz?.id]);

  const countByCategory = (catId) => products.filter((p) => p.category_id === catId).length;

  const create = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await base44.entities.ProductCategory.create({ business_id: biz.id, name: newName.trim() });
      setNewName("");
      load();
    } catch (err) {
      toast({ title: err.message || "Kategoriya yaratilmadi", variant: "destructive" });
    } finally { setCreating(false); }
  };

  const saveEdit = async (catId) => {
    if (!editName.trim()) return;
    setSavingId(catId);
    try {
      await base44.entities.ProductCategory.update(catId, { name: editName.trim() });
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
      await base44.entities.ProductCategory.delete(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    } catch (err) {
      toast({ title: err.message || "O'chirilmadi", variant: "destructive" });
    }
  };

  if (bizLoading || loading) return <div className="space-y-4"><PageHeader title="Kategoriyalar" backTo="/seller/products" /><LoadingState /></div>;
  if (!biz) return <div className="space-y-4"><PageHeader title="Kategoriyalar" backTo="/seller/products" /><EmptyState title="Avval biznes tanlang" /></div>;

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title="Kategoriyalar" backTo="/seller/products" />
      <form onSubmit={create} className="flex items-center gap-2">
        <TextInput value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Yangi kategoriya nomi" />
        <PrimaryButton className="h-12 px-4" disabled={creating}>{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}</PrimaryButton>
      </form>

      {categories.length === 0 ? (
        <EmptyState icon={Tag} title="Hozircha kategoriyalar yo'q" description="Mahsulotlarni guruhlash uchun kategoriya qo'shing." />
      ) : (
        <div className="space-y-2">
          {categories.map((c) => {
            const count = countByCategory(c.id);
            const editing = editingId === c.id;
            return (
              <div key={c.id} className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3">
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