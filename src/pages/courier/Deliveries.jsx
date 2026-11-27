import React from "react";
import { Link } from "react-router-dom";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCourierDemo } from "@/lib/CourierDemoContext";
import { PageHeading, StatusPill } from "@/components/courier/CourierUI";

export function CompletedDeliveries() {
  const { deliveries, loading, error, refresh } = useCourierDemo();
  const completed = deliveries.filter((delivery) => delivery.status === "completed");

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeading
        title="Tugatilgan buyurtmalar"
        description="Siz muvaffaqiyatli yetkazib bergan buyurtmalar."
      />
      {loading ? (
        <div role="status" className="rounded-2xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">Buyurtmalar yuklanmoqda…</div>
      ) : error ? (
        <div role="alert" className="rounded-2xl border border-destructive/20 bg-card px-5 py-8 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <button type="button" className="mt-3 text-sm font-medium underline" onClick={refresh}>Qayta urinish</button>
        </div>
      ) : completed.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {completed.map((delivery) => (
            <article key={delivery.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm shadow-black/[0.02] sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">#{delivery.orderNumber || delivery.id}</p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{delivery.store}</p>
                </div>
                <StatusPill status="completed" />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">Yetkazish manzili</p>
              <p className="mt-1 text-sm font-medium">{delivery.destination}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                <div>
                  <p className="text-xs text-muted-foreground">Tugatilgan vaqt</p>
                  <p className="mt-1 text-sm font-medium">{delivery.completedAt || delivery.createdAt}</p>
                </div>
                <Button asChild variant="outline" className="h-10 rounded-xl">
                  <Link to={`/courier/orders/${delivery.id}`}>Batafsil</Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-10 text-center">
          <CheckCheck className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">Hozircha tugatilgan buyurtmalar yo‘q.</p>
        </div>
      )}
    </div>
  );
}
