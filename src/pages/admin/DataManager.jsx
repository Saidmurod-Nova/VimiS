import React, { useCallback, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { isSupabaseMode, requireSupabase } from "@/lib/supabase";
import { Plus, RefreshCw, Search, Trash2, Pencil, X, Filter, Layers3 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

/**
 * @typedef {{ key: string, label: string, type: string, options?: string[], reference?: string, required?: boolean, defaultValue?: string | number | boolean }} DataField
 * @typedef {{ key: string, entity?: string, label: string, title: string, search: string, supabaseOnly?: boolean, readOnly?: boolean, fields: DataField[] }} DataTable
 */

/** @param {string} key @param {string} label @param {string} [type] @param {Partial<DataField>} [options] @returns {DataField} */
const field = (key, label, type = "text", options = {}) => ({ key, label, type, ...options });
/** @param {string} key @param {string} label @param {string} table @param {Partial<DataField>} [options] @returns {DataField} */
const fk = (key, label, table, options = {}) => field(key, label, "reference", { reference: table, ...options });
/** @param {string} key @param {string} label @param {string[]} options @param {string} [defaultValue] @returns {DataField} */
const enumField = (key, label, options, defaultValue = "") => field(key, label, "select", { options, defaultValue });

/** @type {DataTable[]} */
const TABLES = [
  { key: "businesses", entity: "Business", label: "Bizneslar", title: "name", search: "name", fields: [
    field("name", "Nomi", "text", { required: true }), field("description", "Tavsif", "textarea"),
    field("logo_url", "Logo URL"), fk("category_id", "Kategoriya", "categories"), field("category_name", "Kategoriya nomi"),
    field("store_id", "Do‘kon ID", "text", { required: true }), field("is_active", "Faol", "boolean", { defaultValue: true }),
    field("low_stock_threshold", "Kam qoldiq chegarasi", "number", { defaultValue: 5 }),
  ] },
  { key: "branches", entity: "Branch", label: "Filiallar", title: "name", search: "name", fields: [
    fk("business_id", "Biznes", "businesses", { required: true }), field("name", "Nomi", "text", { required: true }),
    field("owner_id", "Mas'ul foydalanuvchi ID"), fk("geo_area_id", "Hudud", "geo_areas"), field("country", "Mamlakat"),
    field("region", "Viloyat"), field("city", "Shahar"), field("district", "Tuman"), field("address", "Manzil"),
    field("latitude", "Kenglik", "number"), field("longitude", "Uzunlik", "number"), field("phone", "Telefon"),
    field("working_hours", "Ish vaqti"), field("is_active", "Faol", "boolean", { defaultValue: true }),
  ] },
  { key: "products", entity: "Product", label: "Mahsulotlar", title: "name", search: "name", fields: [
    fk("business_id", "Biznes", "businesses", { required: true }), fk("category_id", "Mahsulot kategoriyasi", "product_categories"),
    field("category_name", "Kategoriya nomi"), field("name", "Nomi", "text", { required: true }),
    field("description", "Tavsif", "textarea"), field("image_url", "Rasm URL"),
    field("price", "Narxi", "number", { required: true }), field("is_active", "Faol", "boolean", { defaultValue: true }),
  ] },
  { key: "categories", entity: "Category", label: "Kategoriyalar", title: "name", search: "name", fields: [
    field("name", "Nomi", "text", { required: true }), field("icon", "Belgisi"), fk("parent_id", "Ota kategoriya", "categories"),
    field("sort_order", "Tartib", "number", { defaultValue: 0 }),
  ] },
  { key: "product_categories", entity: "ProductCategory", label: "Biznes kategoriyalari", title: "name", search: "name", fields: [
    fk("business_id", "Biznes", "businesses", { required: true }), field("name", "Nomi", "text", { required: true }),
  ] },
  { key: "branch_inventory", entity: "BranchInventory", label: "Ombor qoldiqlari", title: "id", search: "id", fields: [
    fk("branch_id", "Filial", "branches", { required: true }), fk("product_id", "Mahsulot", "products", { required: true }),
    fk("business_id", "Biznes", "businesses", { required: true }), field("owner_id", "Mas'ul foydalanuvchi ID"),
    field("stock", "Qoldiq", "number", { required: true, defaultValue: 0 }), field("price_override", "Maxsus narx", "number"),
    field("is_available", "Mavjud", "boolean", { defaultValue: true }),
  ] },
  { key: "orders", entity: "Order", label: "Buyurtmalar", title: "order_number", search: "order_number", fields: [
    field("order_number", "Buyurtma raqami", "text", { required: true }), field("user_id", "Xaridor ID", "text", { required: true }),
    fk("business_id", "Biznes", "businesses", { required: true }), fk("branch_id", "Filial", "branches", { required: true }),
    field("business_name", "Biznes nomi"), field("branch_name", "Filial nomi"),
    enumField("status", "Holati", ["pending", "accepted", "preparing", "completed", "cancelled"], "pending"),
    field("delivery_address", "Yetkazish manzili", "textarea"), field("delivery_latitude", "Yetkazish kengligi", "number"),
    field("delivery_longitude", "Yetkazish uzunligi", "number"), field("buyer_name_snapshot", "Xaridor ismi"),
    field("buyer_phone_snapshot", "Xaridor telefoni"), field("payment_method", "To‘lov usuli"),
    field("subtotal", "Mahsulotlar jami", "number", { defaultValue: 0 }), field("delivery_fee", "Yetkazish haqi", "number", { defaultValue: 0 }),
    field("total", "Jami", "number", { required: true }), field("item_count", "Mahsulot soni", "number", { defaultValue: 0 }),
    field("notes", "Izoh", "textarea"), field("cancellation_reason", "Bekor qilish sababi", "textarea"),
    field("accepted_at", "Qabul qilingan vaqt", "datetime"), field("preparing_at", "Tayyorlanish vaqti", "datetime"),
    field("completed_at", "Yakunlangan vaqt", "datetime"), field("cancelled_at", "Bekor qilingan vaqt", "datetime"),
  ] },
  { key: "order_items", entity: "OrderItem", label: "Buyurtma tarkibi", title: "product_name", search: "product_name", fields: [
    fk("order_id", "Buyurtma", "orders", { required: true }), fk("product_id", "Mahsulot", "products"),
    field("product_name", "Mahsulot nomi", "text", { required: true }), field("unit_price", "Birlik narxi", "number", { required: true }),
    field("quantity", "Miqdor", "number", { required: true }), field("subtotal", "Jami", "number", { required: true }),
    field("image_url", "Rasm URL"),
  ] },
  { key: "geo_areas", entity: "GeoArea", label: "Hududlar", title: "name", search: "name", fields: [
    fk("parent_id", "Ota hudud", "geo_areas"), enumField("type", "Hudud turi", ["country", "region", "district", "city"], "country"),
    field("name", "Nomi", "text", { required: true }), field("code", "Kodi"),
  ] },
  { key: "addresses", entity: "Address", label: "Manzillar", title: "address", search: "address", fields: [
    field("user_id", "Foydalanuvchi ID", "text", { required: true }), field("title", "Sarlavha"),
    field("address", "Manzil", "textarea", { required: true }), field("latitude", "Kenglik", "number"),
    field("longitude", "Uzunlik", "number"), field("is_default", "Asosiy", "boolean", { defaultValue: false }),
  ] },
  { key: "carts", entity: "Cart", label: "Savatlar", title: "id", search: "id", fields: [
    field("user_id", "Foydalanuvchi ID", "text", { required: true }), fk("business_id", "Biznes", "businesses", { required: true }),
    fk("branch_id", "Filial", "branches", { required: true }), enumField("status", "Holati", ["active", "checked_out"], "active"),
  ] },
  { key: "cart_items", entity: "CartItem", label: "Savat tarkibi", title: "id", search: "id", fields: [
    fk("cart_id", "Savat", "carts", { required: true }), fk("product_id", "Mahsulot", "products", { required: true }),
    field("quantity", "Miqdor", "number", { required: true, defaultValue: 1 }),
  ] },
  { key: "favorite_stores", entity: "FavoriteStore", label: "Sevimli do‘konlar", title: "id", search: "user_id", fields: [
    field("user_id", "Foydalanuvchi ID", "text", { required: true }), fk("business_id", "Biznes", "businesses", { required: true }),
  ] },
  { key: "saved_stores", entity: "SavedStore", label: "Saqlangan do‘konlar", title: "id", search: "user_id", fields: [
    field("user_id", "Foydalanuvchi ID", "text", { required: true }), fk("business_id", "Biznes", "businesses", { required: true }),
    field("last_visited_at", "Oxirgi tashrif", "datetime"),
  ] },
  { key: "notifications", entity: "Notification", label: "Bildirishnomalar", title: "title", search: "title", fields: [
    field("user_id", "Foydalanuvchi ID", "text", { required: true }), field("title", "Sarlavha", "text", { required: true }),
    field("body", "Matn", "textarea"), field("type", "Turi"), field("related_id", "Bog‘liq yozuv ID"),
    field("event_key", "Hodisa kaliti"), field("read", "O‘qilgan", "boolean", { defaultValue: false }),
    field("read_at", "O‘qilgan vaqt", "datetime"),
  ] },
  { key: "business_members", label: "Biznes a'zolari", title: "id", search: "user_id", supabaseOnly: true, fields: [
    fk("business_id", "Biznes", "businesses", { required: true }), field("user_id", "Foydalanuvchi ID", "text", { required: true }),
    enumField("role", "Roli", ["manager"]),
  ] },
  { key: "courier_profiles", label: "Kuryer profillari", title: "user_id", search: "user_id", supabaseOnly: true, fields: [
    field("user_id", "Foydalanuvchi ID", "text", { required: true }), enumField("status", "Holati", ["pending", "approved", "rejected", "suspended"], "pending"),
    field("is_available", "Mavjud", "boolean", { defaultValue: false }), field("approved_by", "Tasdiqlagan ID"),
    field("approved_at", "Tasdiqlangan vaqt", "datetime"),
  ] },
  { key: "courier_deliveries", label: "Kuryer yetkazmalari", title: "order_id", search: "order_id", supabaseOnly: true, fields: [
    fk("order_id", "Buyurtma", "orders", { required: true }), field("courier_id", "Kuryer ID"),
    enumField("status", "Holati", ["available", "accepted", "picked_up", "on_the_way", "delivered", "cancelled"], "available"),
    field("accepted_at", "Qabul qilingan vaqt", "datetime"), field("picked_up_at", "Olib ketilgan vaqt", "datetime"),
    field("on_the_way_at", "Yo‘lda", "datetime"), field("delivered_at", "Yetkazilgan vaqt", "datetime"),
    field("cancelled_at", "Bekor qilingan vaqt", "datetime"),
  ] },
  { key: "courier_delivery_events", label: "Kuryer hodisalari (faqat o‘qish)", title: "id", search: "delivery_id", supabaseOnly: true, readOnly: true, fields: [
    field("delivery_id", "Yetkazma ID"), field("courier_id", "Kuryer ID"), field("changed_by", "O‘zgartirgan ID"),
    field("previous_status", "Oldingi holat"), field("new_status", "Yangi holat"),
  ] },
  { key: "profiles", label: "Foydalanuvchi profillari (faqat o‘qish)", title: "full_name", search: "full_name", supabaseOnly: true, readOnly: true, fields: [
    field("id", "ID"), field("full_name", "Ism"), field("phone", "Telefon"), field("avatar", "Avatar"),
    field("role", "Roli"), field("created_at", "Yaratilgan vaqt"),
  ] },
];

const SYSTEM_FIELDS = new Set(["id", "created_at", "updated_at", "created_by_id"]);
const PAGE_SIZE = 30;

/**
 * @param {React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" | "ghost", size?: "default" | "sm" | "icon" }} props
 */
function Button({ children, className = "", variant = "default", size = "default", ...props }) {
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  };
  const sizes = { default: "h-10 px-4 py-2", sm: "h-9 rounded-md px-3", icon: "h-9 w-9" };
  return <button className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:h-4 [&_svg]:w-4 ${variants[variant]} ${sizes[size]} ${className}`} {...props}>{children}</button>;
}

/** @param {React.InputHTMLAttributes<HTMLInputElement>} props */
function Input({ className = "", ...props }) {
  return <input className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />;
}

function rowId(table, row) {
  return row[table.key === "courier_profiles" || table.key === "profiles" ? "user_id" : "id"] ?? row.id;
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Ha" : "Yo‘q";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function toInputValue(value, type) {
  if (value === null || value === undefined) return "";
  if (type !== "datetime") return String(value);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function fromInputValue(value, type) {
  if (value === "") return null;
  if (type === "number") return Number(value);
  if (type === "boolean") return value === "true";
  if (type === "datetime") return new Date(value).toISOString();
  return value;
}

export default function DataManager() {
  const { toast } = useToast();
  const availableTables = useMemo(() => TABLES.filter((table) => isSupabaseMode || !table.supabaseOnly), []);
  const [tableKey, setTableKey] = useState("businesses");
  const table = availableTables.find((item) => item.key === tableKey) || availableTables[0];
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState([]);
  const [groupBy, setGroupBy] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [ascending, setAscending] = useState(false);
  const [page, setPage] = useState(0);
  const [modal, setModal] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [referenceOptions, setReferenceOptions] = useState({});

  const loadRows = useCallback(async () => {
    if (!table) return;
    setLoading(true);
    setError("");
    try {
      if (isSupabaseMode) {
        const client = /** @type {any} */ (requireSupabase());
        let query = client.from(table.key).select("*", { count: "exact" });
        if (search.trim() && table.search) query = query.ilike(table.search, `%${search.trim().replace(/[%_,]/g, " ")}%`);
        for (const filter of filters) {
          if (!filter.field || !filter.operator || (filter.value === "" && filter.operator !== "empty")) continue;
          if (filter.operator === "contains") query = query.ilike(filter.field, `%${filter.value.replace(/[%_,]/g, " ")}%`);
          else if (filter.operator === "empty") query = query.is(filter.field, null);
          else if (filter.operator === "gt") query = query.gt(filter.field, filter.value);
          else if (filter.operator === "lt") query = query.lt(filter.field, filter.value);
          else if (filter.operator === "eq") query = query.eq(filter.field, filter.value);
        }
        const allowedSort = table.fields.some((item) => item.key === sortBy) || ["created_at", "updated_at", "id"].includes(sortBy);
        const result = await query.order(allowedSort ? sortBy : "id", { ascending }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        if (result.error) throw result.error;
        setRows(result.data || []);
        setRowCount(result.count || 0);
      } else {
        const entity = base44.entities[table.entity];
        if (!entity) throw new Error(`${table.label} Base44 entitysi topilmadi.`);
        const result = await entity.list(`-${sortBy}`, 1000);
        const list = Array.isArray(result) ? result : [];
        const searched = list.filter((row) => {
          if (search.trim() && table.search && !String(row[table.search] || "").toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())) return false;
          return filters.every((filter) => {
            if (!filter.field || !filter.operator || (filter.value === "" && filter.operator !== "empty")) return true;
            const value = row[filter.field];
            if (filter.operator === "empty") return value == null || value === "";
            if (filter.operator === "contains") return String(value ?? "").toLocaleLowerCase().includes(filter.value.toLocaleLowerCase());
            if (filter.operator === "gt") return Number(value) > Number(filter.value);
            if (filter.operator === "lt") return Number(value) < Number(filter.value);
            return String(value ?? "") === filter.value;
          });
        });
        setRowCount(searched.length);
        setRows(searched.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE));
      }
    } catch (loadError) {
      setError(loadError?.message || `${table.label} ma’lumotlarini yuklab bo‘lmadi.`);
      setRows([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  }, [table, search, filters, sortBy, ascending, page]);

  useEffect(() => { loadRows(); }, [loadRows]);

  const openForm = async (row = null) => {
    const editableFields = table.fields.filter((item) => !SYSTEM_FIELDS.has(item.key));
    const initial = Object.fromEntries(editableFields.map((item) => [
      item.key,
      toInputValue(row?.[item.key] ?? item.defaultValue ?? (item.type === "boolean" ? false : ""), item.type),
    ]));
    const references = [...new Set(editableFields.filter((item) => item.reference).map((item) => item.reference))];
    if (references.length) {
      const loaded = {};
      try {
        await Promise.all(references.map(async (reference) => {
          if (isSupabaseMode) {
            const client = /** @type {any} */ (requireSupabase());
            const result = await client.from(reference).select("*").limit(300);
            if (result.error) throw result.error;
            loaded[reference] = result.data || [];
          } else {
            const referenceTable = TABLES.find((item) => item.key === reference);
            const entity = referenceTable?.entity && base44.entities[referenceTable.entity];
            if (!entity) throw new Error(`${reference} bog‘langan jadvali topilmadi.`);
            loaded[reference] = await entity.list("-created_date", 300);
          }
        }));
      } catch (referenceError) {
        toast({ title: referenceError?.message || "Bog‘langan jadvallarni yuklab bo‘lmadi", variant: "destructive" });
        return;
      }
      setReferenceOptions(loaded);
    }
    setFormValues(initial);
    setModal(row ? "edit" : "create");
    setDeleteId(row ? String(rowId(table, row)) : "");
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {};
      for (const item of table.fields) {
        if (SYSTEM_FIELDS.has(item.key)) continue;
        const value = formValues[item.key];
        if (value === undefined) continue;
        payload[item.key] = fromInputValue(value, item.type);
      }
      if (isSupabaseMode) {
        const client = requireSupabase();
        const { data: authData } = await client.auth.getUser();
        if (modal === "create" && ["businesses", "products", "business_members"].includes(table.key)) {
          if (!authData.user) throw new Error("Admin sessiyasi topilmadi. Qayta tizimga kiring.");
          payload.created_by_id = authData.user.id;
        }
        const key = table.key === "courier_profiles" ? "user_id" : "id";
        const result = modal === "edit"
          ? await client.from(table.key).update(payload).eq(key, deleteId).select("*").single()
          : await client.from(table.key).insert(payload).select("*").single();
        if (result.error) throw result.error;
      } else {
        const entity = base44.entities[table.entity];
        if (modal === "edit") await entity.update(deleteId, payload);
        else await entity.create(payload);
      }
      setModal(null);
      toast({ title: modal === "edit" ? "Yozuv yangilandi" : "Yozuv yaratildi" });
      await loadRows();
    } catch (saveError) {
      toast({ title: saveError?.message || "Yozuvni saqlab bo‘lmadi", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const removeRow = async (row) => {
    const id = String(rowId(table, row));
    if (!window.confirm(`Ushbu yozuvni o‘chirmoqchimisiz? Bog‘langan yozuvlar ham o‘chishi mumkin.`)) return;
    setDeleteId(id);
    try {
      if (isSupabaseMode) {
        const key = table.key === "courier_profiles" ? "user_id" : "id";
        const client = /** @type {any} */ (requireSupabase());
        const { error: deleteError } = await client.from(table.key).delete().eq(key, id);
        if (deleteError) throw deleteError;
      } else {
        await base44.entities[table.entity].delete(id);
      }
      toast({ title: "Yozuv o‘chirildi" });
      await loadRows();
    } catch (deleteError) {
      toast({ title: deleteError?.message || "Yozuvni o‘chirib bo‘lmadi", variant: "destructive" });
    } finally {
      setDeleteId("");
    }
  };

  const groupedRows = useMemo(() => {
    if (!groupBy) return [["", rows]];
    const groups = new Map();
    for (const row of rows) {
      const key = formatValue(row[groupBy]);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
  }, [rows, groupBy]);

  const addFilter = () => setFilters((current) => [...current, { field: table.fields[0]?.key || "", operator: "eq", value: "" }]);
  const updateFilter = (index, key, value) => setFilters((current) => current.map((filter, at) => at === index ? { ...filter, [key]: value } : filter));
  const maxPage = Math.max(0, Math.ceil(rowCount / PAGE_SIZE) - 1);

  return (
    <section id="data-manager" className="scroll-mt-6 space-y-4 border-t border-border pt-7">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Ma’lumotlar bazasi</h2>
          <p className="mt-1 text-sm text-muted-foreground">Ilova jadvallaridagi yozuvlarni qidiring, filterlang, guruhlang va boshqaring.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={loadRows} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} />Yangilash</Button>
          {!table.readOnly && <Button type="button" onClick={() => openForm()}><Plus />Yangi yozuv</Button>}
        </div>
      </header>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2">
        <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
          Jadval
          <select value={table.key} onChange={(event) => { setTableKey(event.target.value); setPage(0); setFilters([]); setSearch(""); setGroupBy(""); }} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
            {availableTables.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
        </label>
        <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
          Guruhlash
          <select value={groupBy} onChange={(event) => setGroupBy(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
            <option value="">Guruhlanmagan</option>
            {table.fields.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
        </label>
        <label className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder={`${table.label} ichidan qidirish...`} className="pl-9" />
        </label>
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium"><Filter className="h-4 w-4" />Filtrlar</span>
            {filters.length < 4 && <Button type="button" variant="ghost" size="sm" onClick={addFilter}>Filtr qo‘shish</Button>}
          </div>
          {groupBy && <p className="text-xs text-muted-foreground">Guruhlash hozirgi sahifadagi yozuvlarga qo‘llanadi.</p>}
          {filters.map((filter, index) => {
            const filterField = table.fields.find((item) => item.key === filter.field);
            return (
              <div key={`${index}-${filter.field}`} className="grid gap-2 sm:grid-cols-[minmax(120px,1fr)_minmax(120px,0.8fr)_minmax(120px,1fr)_auto]">
                <select value={filter.field} onChange={(event) => { updateFilter(index, "field", event.target.value); updateFilter(index, "operator", "eq"); }} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {table.fields.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                </select>
                <select value={filter.operator} onChange={(event) => updateFilter(index, "operator", event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="eq">Teng</option>
                  {(filterField?.type === "text" || filterField?.type === "textarea") && <option value="contains">Ichida bor</option>}
                  {filterField?.type === "number" && <><option value="gt">Katta</option><option value="lt">Kichik</option></>}
                  <option value="empty">Bo‘sh</option>
                </select>
                {filter.operator === "empty" ? <span className="flex items-center text-xs text-muted-foreground">Qiymat kiritilmaydi</span> : filterField?.type === "boolean" ? (
                  <select value={filter.value} onChange={(event) => updateFilter(index, "value", event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Tanlang</option><option value="true">Ha</option><option value="false">Yo‘q</option>
                  </select>
                ) : filterField?.type === "select" ? (
                  <select value={filter.value} onChange={(event) => updateFilter(index, "value", event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Tanlang</option>{filterField.options.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                ) : (
                  <Input type={filterField?.type === "number" ? "number" : "text"} value={filter.value} onChange={(event) => updateFilter(index, "value", event.target.value)} placeholder="Qiymat" />
                )}
                <Button type="button" variant="ghost" size="icon" aria-label="Filtrni o‘chirish" onClick={() => setFilters((current) => current.filter((_, at) => at !== index))}><X /></Button>
              </div>
            );
          })}
        </div>
      </div>

      {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>{rowCount.toLocaleString("uz-UZ")} ta yozuv</span>
        <label className="flex items-center gap-2">Saralash
          <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(0); }} className="h-9 rounded-md border border-input bg-background px-2 text-foreground">
            {["created_at", "updated_at", "id", ...table.fields.map((item) => item.key)].filter((value, index, list) => list.indexOf(value) === index).map((value) => <option key={value} value={value}>{table.fields.find((item) => item.key === value)?.label || value}</option>)}
          </select>
          <Button type="button" variant="outline" size="sm" onClick={() => setAscending((value) => !value)}>{ascending ? "O‘sish" : "Kamayish"}</Button>
        </label>
      </div>
      {loading ? <div className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">Ma’lumotlar yuklanmoqda...</div> : (
        <div className="space-y-3">
          {groupedRows.map(([group, groupRows]) => (
            <section key={group || "all"} className="overflow-hidden rounded-xl border border-border bg-card">
              {groupBy && <h3 className="flex items-center gap-2 border-b border-border bg-secondary/40 px-4 py-3 text-sm font-semibold"><Layers3 className="h-4 w-4" />{table.fields.find((item) => item.key === groupBy)?.label}: {group} <span className="text-muted-foreground">({groupRows.length})</span></h3>}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead><tr className="border-b border-border text-xs uppercase text-muted-foreground">
                    {[...table.fields.slice(0, 5), ...(!table.fields.some((item) => item.key === "created_at") ? [field("created_at", "Yaratilgan")] : [])].map((item) => <th key={item.key} className="px-4 py-3 font-medium">{item.label}</th>)}
                    <th className="px-4 py-3 text-right font-medium">Amallar</th>
                  </tr></thead>
                  <tbody>
                    {groupRows.map((row) => (
                      <tr key={String(rowId(table, row))} className="border-b border-border last:border-b-0 hover:bg-secondary/30">
                        {[...table.fields.slice(0, 5), ...(!table.fields.some((item) => item.key === "created_at") ? [field("created_at", "Yaratilgan")] : [])].map((item) => <td key={item.key} className="max-w-64 truncate px-4 py-3">{formatValue(row[item.key])}</td>)}
                        <td className="px-4 py-2 text-right">
                          {!table.readOnly && <div className="inline-flex gap-1">
                            <Button type="button" variant="ghost" size="icon" aria-label="Tahrirlash" onClick={() => openForm(row)}><Pencil /></Button>
                            <Button type="button" variant="ghost" size="icon" aria-label="O‘chirish" disabled={deleteId === String(rowId(table, row))} onClick={() => removeRow(row)} className="text-destructive hover:text-destructive"><Trash2 /></Button>
                          </div>}
                        </td>
                      </tr>
                    ))}
                    {groupRows.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Yozuvlar topilmadi.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
          {rows.length === 0 && <div className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">Yozuvlar topilmadi.</div>}
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{page + 1} / {maxPage + 1}-sahifa</span>
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={page === 0 || loading} onClick={() => setPage((value) => value - 1)}>Oldingi</Button>
          <Button type="button" variant="outline" disabled={page >= maxPage || loading} onClick={() => setPage((value) => value + 1)}>Keyingi</Button>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
          <form onSubmit={submitForm} role="dialog" aria-modal="true" aria-labelledby="data-editor-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-background p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div><h3 id="data-editor-title" className="font-display text-lg font-bold">{modal === "edit" ? "Yozuvni tahrirlash" : "Yangi yozuv"}</h3><p className="text-sm text-muted-foreground">{table.label}</p></div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setModal(null)} aria-label="Yopish"><X /></Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {table.fields.filter((item) => !SYSTEM_FIELDS.has(item.key)).map((item) => {
                const refRows = referenceOptions[item.reference] || [];
                const inputValue = formValues[item.key] ?? "";
                const common = { id: `field-${item.key}`, required: Boolean(item.required), value: inputValue, onChange: (event) => setFormValues((current) => ({ ...current, [item.key]: event.target.value })) };
                return (
                  <label key={item.key} htmlFor={common.id} className={`space-y-1.5 text-xs font-medium text-muted-foreground ${item.type === "textarea" ? "sm:col-span-2" : ""}`}>
                    {item.label}{item.required && " *"}
                    {item.type === "textarea" ? <textarea {...common} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" /> : item.type === "boolean" || item.type === "select" || item.type === "reference" ? (
                      <select {...common} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
                        <option value="">{item.required ? "Tanlang" : "Tanlanmagan"}</option>
                        {item.type === "boolean" ? <><option value="true">Ha</option><option value="false">Yo‘q</option></> : item.type === "select"
                          ? item.options.map((option) => <option key={option} value={option}>{option}</option>)
                          : <>
                            {inputValue && !refRows.some((option) => String(option.id ?? option.user_id) === String(inputValue)) && <option value={inputValue}>{inputValue}</option>}
                            {refRows.filter((option) => !(modal === "edit" && table.key === item.reference && String(option.id ?? option.user_id) === deleteId)).map((option) => {
                            const key = option.id ?? option.user_id;
                            return <option key={key} value={key}>{option.name || option.title || option.order_number || key}</option>;
                          })}
                          </>}
                      </select>
                    ) : (
                      <Input {...common} type={item.type === "datetime" ? "datetime-local" : item.type === "number" ? "number" : "text"} step={item.type === "number" ? "any" : undefined} />
                    )}
                  </label>
                );
              })}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setModal(null)}>Bekor qilish</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saqlanmoqda..." : "Saqlash"}</Button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
