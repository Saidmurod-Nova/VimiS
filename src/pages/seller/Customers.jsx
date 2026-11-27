import React, { useEffect, useMemo, useRef, useState } from "react";
import { useBusiness } from "@/lib/BusinessContext";
import { base44 } from "@/api/base44Client";
import { requireSupabase } from "@/lib/supabase";
import { Users } from "lucide-react";
import PageHeader from "@/components/vimi/PageHeader";
import { SearchBar } from "@/components/vimi/VimiInput";
import { EmptyState, ErrorState, LoadingState } from "@/components/vimi/States";

function getCustomerKey(order) {
  if (order.user_id) return `user:${order.user_id}`;
  if (order.buyer_phone_snapshot) return `phone:${order.buyer_phone_snapshot}`;
  return `name:${order.buyer_name_snapshot || "Noma’lum mijoz"}`;
}

export default function Customers() {
  const { selectedBusiness } = useBusiness();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const requestId = useRef(0);
  const businessId = selectedBusiness?.id;

  const loadCustomers = async () => {
    const currentRequest = ++requestId.current;
    if (!businessId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    setOrders([]);
    try {
      let records;
      if (import.meta.env.VITE_AUTH_PROVIDER === "supabase") {
        const { data, error: queryError } = await requireSupabase()
          .from("orders")
          .select("id, user_id, buyer_name_snapshot, buyer_phone_snapshot, order_number, created_at")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false });
        if (queryError) throw queryError;
        records = data || [];
      } else {
        records = await base44.entities.Order.filter({ business_id: businessId }, "-created_date", 500);
      }
      if (currentRequest === requestId.current) setOrders(records || []);
    } catch (loadError) {
      if (currentRequest !== requestId.current) return;
      console.error("Mijozlar ro‘yxatini yuklab bo‘lmadi.", loadError);
      setError(loadError?.message || "Mijozlar ro‘yxatini yuklab bo‘lmadi.");
      setOrders([]);
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [businessId]);

  const customers = useMemo(() => {
    const grouped = new Map();
    for (const order of orders) {
      const key = getCustomerKey(order);
      const existing = grouped.get(key);
      if (existing) {
        existing.orderCount += 1;
        continue;
      }
      grouped.set(key, {
        key,
        name: order.buyer_name_snapshot || "Noma’lum mijoz",
        phone: order.buyer_phone_snapshot || "",
        orderCount: 1,
        lastOrderAt: order.created_at || order.created_date,
      });
    }
    return [...grouped.values()];
  }, [orders]);

  const filteredCustomers = customers.filter((customer) => {
    const query = search.trim().toLocaleLowerCase();
    return !query || `${customer.name} ${customer.phone}`.toLocaleLowerCase().includes(query);
  });

  return (
    <div className="workspace-page animate-fade-in space-y-5">
      <PageHeader
        title="Mijozlar"
        subtitle="Ushbu biznesga buyurtma bergan mijozlar. Faqat mavjud buyurtma ma’lumotlari ko‘rsatiladi."
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{customers.length} ta mijoz</p>
        <SearchBar
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Ism yoki telefon bo‘yicha qidirish"
          aria-label="Mijozlarni qidirish"
          className="w-full sm:max-w-sm"
        />
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState title={error} onRetry={loadCustomers} /> : filteredCustomers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? "Mijoz topilmadi" : "Hozircha mijozlar yo‘q"}
          description={search ? "Qidiruv so‘zini o‘zgartirib ko‘ring." : "Biznesga buyurtma berilganida mijozlar shu yerda ko‘rinadi."}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(140px,1fr)_120px_180px] gap-4 border-b border-border bg-muted/60 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid">
            <span>Mijoz</span>
            <span>Telefon</span>
            <span>Buyurtmalar</span>
            <span>So‘nggi buyurtma</span>
          </div>
          <ul className="divide-y divide-border">
            {filteredCustomers.map((customer) => (
              <li key={customer.key} className="grid gap-2 px-4 py-4 md:grid-cols-[minmax(0,1.5fr)_minmax(140px,1fr)_120px_180px] md:items-center md:gap-4 md:px-5">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{customer.name}</span>
                  <span className="mt-1 block text-xs text-muted-foreground md:hidden">
                    {customer.phone || "Telefon ko‘rsatilmagan"}
                  </span>
                </span>
                <span className="hidden truncate text-sm text-muted-foreground md:block">
                  {customer.phone || "—"}
                </span>
                <span className="text-sm tabular-nums">{customer.orderCount}</span>
                <time className="text-xs text-muted-foreground" dateTime={customer.lastOrderAt}>
                  {customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleDateString() : "—"}
                </time>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
