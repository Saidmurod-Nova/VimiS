import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, ChevronRight, Search as SearchIcon, ArrowRight, Store, Sparkles, Heart } from "lucide-react";
import { TextInput } from "@/components/vimi/VimiInput";
import { PrimaryButton } from "@/components/vimi/VimiButton";
import SavedStoreCard from "@/components/vimi/SavedStoreCard";
import ProductCard from "@/components/vimi/ProductCard";
import LocationSheet from "@/components/vimi/LocationSheet";
import ConfirmDialog from "@/components/vimi/ConfirmDialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/vimi/States";
import { useBuyer } from "@/lib/BuyerContext";
import { base44 } from "@/api/base44Client";
import { isSupabaseMode } from "@/lib/supabase";
import { listPublicCategories, listProducts } from "@/lib/supabaseCatalog";
import { useToast } from "@/components/ui/use-toast";

function SectionHeader({ title, action = null }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {action}
    </div>
  );
}

export default function Home() {
  const { stores, loading, connectStore, removeSavedStore, selectedLocation } = useBuyer();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [storeCode, setStoreCode] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [locOpen, setLocOpen] = useState(false);
  const [removeId, setRemoveId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [catalogError, setCatalogError] = useState("");
  const [catalogRetryKey, setCatalogRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    setCatalogError("");
    const loadHighlights = async () => {
      try {
        const [cats, prods] = isSupabaseMode
          ? await Promise.all([listPublicCategories(), listProducts({ limit: 8 })])
          : await Promise.all([
              base44.entities.Category.list(),
              base44.entities.Product.filter({ is_active: true }, "-created_date", 8),
            ]);
        if (active) {
          setCategories((cats || []).filter((category) => !category.parent_id));
          setProducts(prods || []);
        }
      } catch (error) {
        console.error("Marketplace mahsulotlarini yuklab bo‘lmadi.", error);
        if (active) {
          setCatalogError(error?.message || "Marketplace mahsulotlarini yuklab bo‘lmadi.");
          setCategories([]);
          setProducts([]);
        }
      }
    };
    loadHighlights();
    return () => { active = false; };
  }, [catalogRetryKey]);

  const onConnect = async (e) => {
    e.preventDefault();
    const code = storeCode.trim();
    if (!code || connecting) return;
    setConnecting(true);
    try {
      const data = await connectStore(code);
      toast({ title: "Do'konga ulandi", description: data.business.name });
      navigate(`/store/${data.business.store_id}`);
      setStoreCode("");
    } catch (err) {
      const msg = err?.response?.data?.error || "Ulanib bo'lmadi";
      toast({ title: msg, variant: msg === "Do'kon topilmadi" ? "destructive" : "default" });
    } finally {
      setConnecting(false);
    }
  };

  const confirmRemove = async () => {
    if (!removeId) return;
    try { await removeSavedStore(removeId); toast({ title: "Do'kon o'chirildi" }); }
    catch { toast({ title: "O'chirib bo'lmadi" }); }
    finally { setRemoveId(null); }
  };

  const locLabel = selectedLocation?.city || selectedLocation?.region || "Joylashuv tanlang";
  const recentlyVisited = stores.items.filter((i) => i.saved.last_visited_at).sort((a, b) => new Date(b.saved.last_visited_at).getTime() - new Date(a.saved.last_visited_at).getTime());
  const favorites = stores.favorites;

  return (
    <div className="workspace-page animate-fade-in space-y-6">
      <header className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">VireonSpes Marketplace</p>
          <h1 className="mt-1 max-w-3xl font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Mahalliy do‘konlar va mahsulotlarni kashf eting
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setLocOpen(true)} className="inline-flex max-w-[40vw] items-center gap-1.5 rounded-full bg-secondary px-3 py-2 text-sm font-medium text-foreground">
            <MapPin className="w-4 h-4 text-primary" aria-hidden="true" />
            <span className="truncate">{locLabel}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]">
        <button type="button" onClick={() => navigate("/search")} className="relative block w-full self-start">
          <SearchIcon className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <div className="flex h-12 w-full items-center rounded-lg border border-border bg-card pl-11 text-left text-muted-foreground transition hover:border-primary/40">
            Do‘kon yoki mahsulot qidirish
          </div>
        </button>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-semibold text-foreground">Do‘kon ID orqali kirish</p>
          <p className="mt-1 text-xs text-muted-foreground">Do‘kon ID sini kiriting va do‘konga o‘ting.</p>
          <form className="mt-3 flex gap-2" onSubmit={onConnect}>
            <TextInput
              placeholder="Do‘kon ID"
              value={storeCode}
              onChange={(e) => setStoreCode(e.target.value)}
              className="min-w-0 flex-1"
            />
            <PrimaryButton type="submit" className="h-11 shrink-0 rounded-lg px-3" disabled={connecting}>
              <ArrowRight className="mr-1 h-4 w-4" aria-hidden="true" />
              Kirish
            </PrimaryButton>
          </form>
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          {recentlyVisited.length > 0 && (
            <section className="space-y-3">
              <SectionHeader title="So'nggi tashriflar" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {recentlyVisited.slice(0, 10).map((e) => (
                  <SavedStoreCard key={e.saved.id} entry={e} onView={() => navigate(`/store/${e.business.store_id}`)} onRemove={setRemoveId} className="w-full" />
                ))}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <SectionHeader title="Sevimli do'konlar" action={favorites.length > 0 ? <button type="button" onClick={() => navigate("/search")} className="text-xs font-medium text-primary">Barchasi</button> : null} />
            {favorites.length === 0 ? (
              <EmptyState icon={Heart} title="Hozircha sevimli do'konlar yo'q" description="Qidirish orqali do'konlarni sevimlilarga qo'shing." action={<PrimaryButton onClick={() => navigate("/search")} className="h-10">Do'kon qidirish</PrimaryButton>} />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {favorites.slice(0, 10).map((e) => (
                  <SavedStoreCard key={e.favorite_id} entry={{ ...e, saved: { id: e.favorite_id } }} onView={() => navigate(`/store/${e.business.store_id}`)} showRemove={false} className="w-full" />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <SectionHeader title="Saqlangan do'konlar" />
            {stores.items.length === 0 ? (
              <EmptyState icon={Store} title="Hozircha do'konlar yo'q" description="Do'kon ID orqali ulanib, shu yerda saqlang." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {stores.items.map((e) => (
                  <SavedStoreCard key={e.saved.id} entry={e} onView={() => navigate(`/store/${e.business.store_id}`)} onRemove={setRemoveId} className="w-full" />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {categories.length > 0 && (
        <section className="space-y-3">
          <SectionHeader title="Kategoriyalar" />
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {categories.map((c) => (
              <button key={c.id} type="button" onClick={() => navigate(`/search?q=${encodeURIComponent(c.name)}`)} className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary active:scale-95">
                {c.icon ? `${c.icon} ` : ""}{c.name}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <SectionHeader title="Tavsiya etilgan mahsulotlar" action={<button type="button" onClick={() => navigate("/search")} className="text-xs font-medium text-primary">Barchasi</button>} />
        {catalogError ? (
          <ErrorState title={catalogError} onRetry={() => setCatalogRetryKey((key) => key + 1)} />
        ) : products.length === 0 ? (
          <EmptyState icon={Sparkles} title="Hozircha mahsulotlar yo'q" description="Do'konlar mahsulot qo'shganda shu yerda paydo bo'ladi." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((p) => (
              <ProductCard key={p.id} name={p.name} price={p.price} image={p.image_url} onClick={() => navigate(`/product/${p.id}`)} />
            ))}
          </div>
        )}
      </section>

      <LocationSheet open={locOpen} onOpenChange={setLocOpen} />
      <ConfirmDialog
        open={!!removeId}
        onOpenChange={(o) => !o && setRemoveId(null)}
        title="Do'konni o'chirish"
        description="Bu do'kon saqlanganlar ro'yxatidan o'chiriladi. Do'konning o'zi va buyurtmalariga ta'sir etmaydi."
        confirmText="O'chirish"
        destructive
        onConfirm={confirmRemove}
      />
    </div>
  );
}
