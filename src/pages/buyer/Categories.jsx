import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, LayoutGrid } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/vimi/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/vimi/States";
import { isSupabaseMode } from "@/lib/supabase";
import { listPublicCategories } from "@/lib/supabaseCatalog";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [activeParentId, setActiveParentId] = useState("");

  useEffect(() => {
    let active = true;
    const loadCategories = async () => {
      setLoading(true);
      setError("");
      try {
        const rows = isSupabaseMode
          ? await listPublicCategories()
          : await base44.entities.Category.list();
        if (active) {
          const next = rows || [];
          setCategories(next);
          setActiveParentId((current) => current || next.find((category) => !category.parent_id)?.id || "");
        }
      } catch (loadError) {
        if (active) setError(loadError?.message || "Kategoriyalarni yuklab bo‘lmadi.");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadCategories();
    return () => { active = false; };
  }, [reloadKey]);

  return (
    <div className="workspace-page animate-fade-in space-y-5">
      <PageHeader
        title="Kategoriyalar"
        subtitle="Mahsulotlarni yo‘nalishlar bo‘yicha toping."
        backTo="/"
        action={null}
        className=""
      />

      {loading ? (
        <LoadingState className="" />
      ) : error ? (
        <ErrorState title={error} onRetry={() => setReloadKey((key) => key + 1)} className="" />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="Kategoriyalar hali mavjud emas"
          description="Mahsulot katalogiga o‘tib, barcha mahsulotlarni ko‘rishingiz mumkin."
          className=""
          action={
            <Link to="/catalog" className="text-sm font-medium text-primary hover:underline">
              Mahsulotlarni ko‘rish
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-border bg-card p-2">
            {categories.filter((category) => !category.parent_id).map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveParentId(category.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                  activeParentId === category.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                }`}
              >
                <span className="text-xl" aria-hidden="true">{category.icon || "◈"}</span>
                <span className="min-w-0 flex-1">{category.name}</span>
                <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </button>
            ))}
          </div>

          <section className="rounded-2xl border border-border bg-card p-4">
            {(() => {
              const parent = categories.find((category) => category.id === activeParentId);
              const children = categories.filter((category) => category.parent_id === activeParentId);
              if (!parent) return null;
              return (
                <>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Kategoriya</p>
                      <h2 className="mt-1 font-display text-xl font-bold">{parent.name}</h2>
                    </div>
                    <Link
                      to={`/catalog?categoryId=${encodeURIComponent(parent.id)}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Hammasini ko‘rish
                    </Link>
                  </div>
                  {children.length === 0 ? (
                    <EmptyState icon={LayoutGrid} title="Ichki kategoriyalar yo‘q" description="Bu bo‘lim uchun mahsulotlarni hammasini ko‘ring." />
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {children.map((category) => (
                        <Link
                          key={category.id}
                          to={`/catalog?categoryId=${encodeURIComponent(category.id)}`}
                          className="flex min-h-24 flex-col justify-between rounded-xl border border-border bg-background p-3 transition hover:border-primary/40"
                        >
                          <span className="text-2xl" aria-hidden="true">{category.icon || "◈"}</span>
                          <span className="mt-3 text-sm font-medium">{category.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </section>
        </div>
      )}
    </div>
  );
}
