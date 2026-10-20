import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, LayoutDashboard, ListTree, Pencil, Plus, RefreshCw, Save, Store, Trash2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { isSupabaseMode } from "@/lib/supabase";
import { createAdminCategory, deleteAdminCategory, getAdminOverview, updateAdminCategory } from "@/lib/supabaseAdmin";
import { listPublicCategories } from "@/lib/supabaseCatalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const EMPTY_CATEGORY = { name: "", icon: "" };

/** @param {{ label: string, value: number, icon: React.ComponentType<any> }} props */
function Metric({ label, value, icon: Icon }) {
    return (
        <article className="rounded-xl border border-border bg-card p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-5 text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums">{value.toLocaleString("uz-UZ")}</p>
        </article>
    );
}

export default function AdminDashboard() {
    const { toast } = useToast();
    const [overview, setOverview] = useState({ businesses: 0, products: 0, categories: 0 });
    const [categories, setCategories] = useState(/** @type {any[]} */([]));
    const [draft, setDraft] = useState(EMPTY_CATEGORY);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            if (isSupabaseMode) {
                const [stats, rows] = await Promise.all([getAdminOverview(), listPublicCategories()]);
                setOverview(stats);
                setCategories(rows);
            } else {
                const [businesses, products, rows] = await Promise.all([
                    base44.entities.Business.list(),
                    base44.entities.Product.list(),
                    base44.entities.Category.list(),
                ]);
                setOverview({
                    businesses: businesses.filter((item) => item.is_active !== false).length,
                    products: products.filter((item) => item.is_active !== false).length,
                    categories: rows.length,
                });
                setCategories(rows);
            }
        } catch (/** @type {any} */ loadError) {
            setError(loadError?.message || "Admin ma’lumotlarini yuklab bo‘lmadi.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    /** @param {React.FormEvent<HTMLFormElement>} event */
    const saveCategory = async (event) => {
        event.preventDefault();
        const name = draft.name.trim();
        if (!name) return;
        if (categories.some((category) => category.id !== editingId && category.name.localeCompare(name, undefined, { sensitivity: "base" }) === 0)) {
            toast({ title: "Bu kategoriya mavjud", variant: "destructive" });
            return;
        }
        setSaving(true);
        try {
            const category = isSupabaseMode
                ? editingId
                    ? await updateAdminCategory(editingId, { name, icon: draft.icon })
                    : await createAdminCategory({ name, icon: draft.icon })
                : editingId
                    ? await base44.entities.Category.update(editingId, { name, icon: draft.icon.trim() || null })
                    : await base44.entities.Category.create({ name, icon: draft.icon.trim() || null });
            setCategories((current) => {
                const next = editingId ? current.map((item) => item.id === editingId ? category : item) : [...current, category];
                return next.sort((a, b) => a.name.localeCompare(b.name));
            });
            setOverview((current) => ({ ...current, categories: current.categories + (editingId ? 0 : 1) }));
            setDraft(EMPTY_CATEGORY);
            setEditingId(null);
            toast({ title: editingId ? "Kategoriya yangilandi" : "Kategoriya yaratildi" });
        } catch (/** @type {any} */ saveError) {
            toast({ title: saveError?.message || "Kategoriya saqlanmadi", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    /** @param {any} category */
    const removeCategory = async (category) => {
        if (!window.confirm(`“${category.name}” kategoriyasini o‘chirasizmi?`)) return;
        try {
            if (isSupabaseMode) await deleteAdminCategory(category.id);
            else await base44.entities.Category.delete(category.id);
            setCategories((current) => current.filter((item) => item.id !== category.id));
            setOverview((current) => ({ ...current, categories: Math.max(0, current.categories - 1) }));
            toast({ title: "Kategoriya o‘chirildi" });
        } catch (/** @type {any} */ deleteError) {
            toast({ title: deleteError?.message || "Kategoriya o‘chirilmadi", variant: "destructive" });
        }
    };

    /** @param {any} category */
    const beginEdit = (category) => {
        setEditingId(category.id);
        setDraft({ name: category.name, icon: category.icon || "" });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setDraft(EMPTY_CATEGORY);
    };

    /** @type {(field: "name" | "icon") => (event: React.ChangeEvent<HTMLInputElement>) => void} */
    const updateDraft = (field) => (event) => {
        setDraft((current) => ({ ...current, [field]: event.target.value }));
    };

    return (
        <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="border-b border-border bg-sidebar px-5 py-5 lg:min-h-screen lg:border-b-0 lg:border-r lg:px-4 lg:py-7">
                <Link to="/" className="flex flex-col items-start gap-1 rounded-lg px-2 py-1">
                    <img src="/vimis-logo.svg" alt="VimiS" className="h-8 w-auto" />
                    <span className="text-xs text-muted-foreground">Boshqaruv paneli</span>
                </Link>
                <nav className="mt-8 flex gap-2 lg:flex-col">
                    <a href="#overview" className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary"><LayoutDashboard className="h-4 w-4" />Umumiy</a>
                    <a href="#categories" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"><ListTree className="h-4 w-4" />Kategoriyalar</a>
                </nav>
                <Link to="/" className="mt-8 hidden items-center gap-2 px-3 text-sm text-muted-foreground transition hover:text-foreground lg:flex">
                    Xaridor ilovasiga qaytish <ArrowUpRight className="h-4 w-4" />
                </Link>
            </aside>

            <main className="min-w-0 px-4 py-6 sm:px-7 lg:px-10 lg:py-9">
                <div className="mx-auto max-w-6xl space-y-8">
                    <header id="overview" className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase text-primary">Platforma</p>
                            <h1 className="mt-1 font-display text-3xl font-bold">Umumiy ko‘rinish</h1>
                            <p className="mt-2 text-sm text-muted-foreground">Katalog va biznes faoliyatining joriy holati.</p>
                        </div>
                        <Button variant="outline" onClick={load} disabled={loading} aria-label="Ma’lumotlarni yangilash">
                            <RefreshCw className={loading ? "animate-spin" : ""} />Yangilash
                        </Button>
                    </header>

                    {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}

                    <section className="grid gap-3 sm:grid-cols-3" aria-label="Platforma ko‘rsatkichlari">
                        <Metric label="Faol do‘konlar" value={overview.businesses} icon={Store} />
                        <Metric label="Faol mahsulotlar" value={overview.products} icon={ListTree} />
                        <Metric label="Katalog kategoriyalari" value={overview.categories} icon={LayoutDashboard} />
                    </section>

                    <section id="categories" className="scroll-mt-6 border-t border-border pt-7">
                        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <h2 className="font-display text-xl font-bold">Kategoriyalar</h2>
                                <p className="mt-1 text-sm text-muted-foreground">Xaridor katalogida va do‘kon sozlamalarida ko‘rinadigan bo‘limlar.</p>
                            </div>
                        </div>

                        <form onSubmit={saveCategory} className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[88px_minmax(0,1fr)_auto]">
                            <Input aria-label="Kategoriya belgisi" placeholder="Belgisi" value={draft.icon} onChange={updateDraft("icon")} maxLength={8} className="h-11 text-center" />
                            <Input aria-label="Kategoriya nomi" placeholder="Yangi kategoriya nomi" value={draft.name} onChange={updateDraft("name")} maxLength={60} required className="h-11" />
                            <div className="flex gap-2">
                                <Button type="submit" disabled={saving} className="h-11">
                                    {editingId ? <Save /> : <Plus />}{editingId ? "Saqlash" : "Qo‘shish"}
                                </Button>
                                {editingId && <Button type="button" variant="outline" aria-label="Tahrirlashni bekor qilish" onClick={cancelEdit} className="h-11 px-3"><X /></Button>}
                            </div>
                        </form>

                        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
                            <div className="grid grid-cols-[minmax(0,1fr)_auto] border-b border-border bg-secondary/50 px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
                                <span>Kategoriya</span><span>Amallar</span>
                            </div>
                            {loading ? (
                                <p className="px-4 py-8 text-center text-sm text-muted-foreground">Yuklanmoqda...</p>
                            ) : categories.length === 0 ? (
                                <p className="px-4 py-8 text-center text-sm text-muted-foreground">Kategoriyalar topilmadi.</p>
                            ) : categories.map((category) => (
                                <div key={category.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-lg">{category.icon || "•"}</span>
                                        <span className="truncate text-sm font-medium">{category.name}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button type="button" variant="ghost" size="icon" aria-label={`${category.name} tahrirlash`} onClick={() => beginEdit(category)}><Pencil /></Button>
                                        <Button type="button" variant="ghost" size="icon" aria-label={`${category.name} o‘chirish`} onClick={() => removeCategory(category)} className="text-destructive hover:text-destructive"><Trash2 /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}