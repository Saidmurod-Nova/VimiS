import React from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, PackageCheck } from "lucide-react";
import { useCourierDemo } from "@/lib/CourierDemoContext";
import { AvailabilityControl, DeliveryCard, PageHeading } from "@/components/courier/CourierUI";

const activeStatuses = ["accepted", "picked_up", "on_the_way"];

export default function CourierDashboard() {
  const { deliveries, availableDeliveries, courierCode, isOnline, loading, error, refresh } = useCourierDemo();
  const available = isOnline ? availableDeliveries : [];
  const active = deliveries.filter((delivery) => activeStatuses.includes(delivery.status));

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeading
        title="Bosh menyu"
        description="Yangi yetkazib berish buyurtmalari va qabul qilgan buyurtmalaringiz."
      />

      {courierCode && (
        <section className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BadgeCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Sizning kuryer kodingiz</p>
            <p className="font-mono text-lg font-semibold tracking-normal text-foreground">{courierCode}</p>
          </div>
        </section>
      )}

      <AvailabilityControl />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Yangi buyurtmalar</h2>
          <span className="text-sm text-muted-foreground">{isOnline ? `${available.length} ta` : "Oflayn"}</span>
        </div>
        {loading ? (
          <div role="status" className="rounded-2xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">Buyurtmalar yuklanmoqda…</div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-destructive/20 bg-card px-5 py-8 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <button type="button" className="mt-3 text-sm font-medium underline" onClick={refresh}>Qayta urinish</button>
          </div>
        ) : !isOnline ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-8 text-center">
            <p className="font-medium">Kuryerlik rejimi o‘chirilgan</p>
            <p className="mt-1 text-sm text-muted-foreground">Yangi takliflarni ko‘rish uchun kuryerlik rejimini yoqing.</p>
          </div>
        ) : available.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {available.map((delivery) => <DeliveryCard key={delivery.id} delivery={delivery} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-10 text-center">
            <PackageCheck className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">Hozircha yangi buyurtmalar yo‘q.</p>
          </div>
        )}
      </section>

      {active.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Qabul qilingan buyurtmalar</h2>
            <p className="mt-1 text-sm text-muted-foreground">Kuryerlik rejimi o‘chiq bo‘lsa ham faol buyurtmalar shu yerda qoladi.</p>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {active.map((delivery) => <DeliveryCard key={delivery.id} delivery={delivery} />)}
          </div>
        </section>
      )}

      <Link to="/courier/completed" className="inline-flex min-h-10 items-center text-sm font-medium text-primary hover:underline">
        Tugatilgan buyurtmalarni ko‘rish
      </Link>
    </div>
  );
}
