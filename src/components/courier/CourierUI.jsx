import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Clock3, MapPin, Package, Route, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatUZS, statusLabels } from "@/lib/courierDemo";
import { useCourierDemo } from "@/lib/CourierDemoContext";

export function DemoNotice({ className = "" }) {
  const { isSupabaseBacked } = useCourierDemo();
  return (
    <div className={`flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-foreground ${className}`}>
      <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
      {isSupabaseBacked ? (
        <p className="text-xs leading-5 sm:text-sm">
          <strong className="font-semibold">Supabase ulangan.</strong>{" "}
          Buyurtmalar bazadan olinadi va holat o‘zgarishlari serverda tekshiriladi. Xarita, GPS va masofa ulanmagan.
        </p>
      ) : (
        <p className="text-xs leading-5 sm:text-sm">
          <strong className="font-semibold">Demo ko‘rinishi.</strong>{" "}
          Buyurtmalar va holat o‘zgarishlari faqat namuna ma’lumotlari; serverga yuborilmaydi.
        </p>
      )}
    </div>
  );
}

export function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase text-primary">{eyebrow}</p>}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function StatusPill({ status }) {
  const styles = {
    available: "bg-primary/10 text-primary ring-primary/20",
    accepted: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-900",
    picked_up: "bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950 dark:text-sky-200 dark:ring-sky-900",
    on_the_way: "bg-violet-50 text-violet-800 ring-violet-200 dark:bg-violet-950 dark:text-violet-200 dark:ring-violet-900",
    completed: "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-900",
    cancelled: "bg-secondary text-muted-foreground ring-border",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${styles[status] || styles.cancelled}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {statusLabels[status] || status}
    </span>
  );
}

export function AvailabilityControl({ compact = false }) {
  const {
    isOnline,
    deliveries,
    updateAvailability,
    authorizationStatus,
    isSupabaseBacked,
    loading,
    error,
    refresh,
    requestCourierAccess,
  } = useCourierDemo();
  const [confirmOffline, setConfirmOffline] = React.useState(false);
  const [requesting, setRequesting] = React.useState(false);
  const activeCount = deliveries.filter((delivery) =>
    ["accepted", "picked_up", "on_the_way"].includes(delivery.status)
  ).length;

  const requestToggle = () => {
    if (isOnline && activeCount > 0) {
      setConfirmOffline(true);
      return;
    }
    updateAvailability(!isOnline);
  };

  const submitAccessRequest = async () => {
    setRequesting(true);
    await requestCourierAccess();
    setRequesting(false);
  };

  if (isSupabaseBacked && (loading || authorizationStatus !== "approved")) {
    const statusMessages = {
      not_requested: "Kuryerlik buyurtmalarini qabul qilish uchun administrator tasdig‘i kerak.",
      pending: "Kuryerlik ruxsati so‘rovingiz administrator tomonidan ko‘rib chiqilmoqda.",
      rejected: "Kuryerlik ruxsati so‘rovi rad etilgan. Batafsil ma’lumot uchun administratorga murojaat qiling.",
      suspended: "Kuryerlik ruxsati vaqtincha to‘xtatilgan. Faol buyurtmalaringizni ko‘rish uchun administratorga murojaat qiling.",
    };
    const statusLabel = {
      not_requested: "Ruxsat so‘ralmagan",
      pending: "Ko‘rib chiqilmoqda",
      rejected: "Rad etilgan",
      suspended: "To‘xtatilgan",
    };

    return (
      <section className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm shadow-black/[0.02] sm:p-5">
        <div>
          <h2 className="font-display font-semibold">Kuryerlik rejimi</h2>
          <p className="mt-1 text-sm font-medium">{loading ? "Holat tekshirilmoqda…" : statusLabel[authorizationStatus] || "Tasdiq talab qilinadi"}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{statusMessages[authorizationStatus] || "Kuryerlik rejimi administrator tasdig‘idan keyin yoqiladi."}</p>
        </div>
        {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
          <span>{error}</span>
          <button type="button" className="font-semibold underline" onClick={refresh}>Qayta urinish</button>
        </div>}
        {!loading && authorizationStatus === "not_requested" && (
          <button
            type="button"
            disabled={requesting || Boolean(error)}
            onClick={submitAccessRequest}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {requesting ? "Yuborilmoqda…" : "Kuryerlik ruxsatini so‘rash"}
          </button>
        )}
      </section>
    );
  }

  return (
    <>
      <section className={`flex ${compact ? "items-center gap-3 p-3 sm:p-4" : "flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"} rounded-lg border shadow-sm shadow-black/[0.02] ${isOnline ? "border-primary/20 bg-primary/5" : "border-border bg-card"}`}>
        <div className="flex min-w-0 items-start gap-3">
          {!compact && (
            <span className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isOnline ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? "bg-primary" : "bg-slate-400"}`} />
            </span>
          )}
          <div className="min-w-0">
            <h2 className={`${compact ? "text-sm" : "font-display"} font-semibold`}>Kuryerlik rejimi</h2>
            <p className="mt-1 text-sm font-medium">{isOnline ? "Onlayn" : "Oflayn"} {!isSupabaseBacked && <span className="ml-1 text-xs font-normal text-muted-foreground">· demo holat</span>}</p>
            {!compact && <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
              {isOnline
                ? "Siz yangi yetkazib berish buyurtmalarini qabul qilishingiz mumkin."
                : "Siz hozir yangi yetkazib berish buyurtmalarini qabul qilmaysiz."}
            </p>}
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isOnline}
          aria-label={`Kuryerlik rejimi ${isOnline ? "yoqilgan" : "o‘chirilgan"}. O‘zgartirish`}
          onClick={requestToggle}
          className={`inline-flex h-11 min-w-28 shrink-0 items-center justify-between gap-2 rounded-full border px-1.5 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${compact ? "ml-auto" : ""} ${isOnline ? "border-primary bg-primary" : "border-border bg-secondary"}`}
        >
          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[10px] font-bold text-primary shadow-sm transition ${isOnline ? "order-2" : "order-1"}`} aria-hidden="true">
            {isOnline ? "ON" : "OFF"}
          </span>
          <span className={`px-2 text-[10px] font-semibold ${isOnline ? "order-1 text-white" : "order-2 text-muted-foreground"}`}>{isOnline ? "ONLAYN" : "OFLAYN"}</span>
        </button>
        {error && <div role="alert" className="basis-full rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
          <p>{error}</p>
          <button type="button" className="mt-1 font-semibold underline" onClick={refresh}>Qayta urinish</button>
        </div>}
      </section>

      <AlertDialog open={confirmOffline} onOpenChange={setConfirmOffline}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Faol yetkazish mavjud</AlertDialogTitle>
            <AlertDialogDescription>
              Kuryerlik rejimini o‘chirsangiz, yangi takliflar ko‘rsatilmaydi. Qabul qilingan yoki yo‘ldagi {activeCount} ta buyurtma bekor qilinmaydi — ularni yakunlang yoki muammo haqida xabar bering.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Ortga qaytish</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={(event) => {
                event.preventDefault();
                updateAvailability(false);
                setConfirmOffline(false);
              }}
            >
              Oflayn bo‘lish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function DeliveryCard({ delivery }) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm shadow-black/[0.02] transition hover:border-primary/30 hover:shadow-md sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold tracking-tight">#{delivery.orderNumber || delivery.id}</p>
            <StatusPill status={delivery.status} />
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><Store className="h-3.5 w-3.5 shrink-0" />{delivery.store}</p>
        </div>
        {delivery.fee != null && <div className="text-right">
          <p className="font-semibold tabular-nums">{formatUZS(delivery.fee)}</p>
          <p className="text-xs text-muted-foreground">yetkazib berish haqi{delivery.isDemo ? " · demo" : ""}</p>
        </div>}
      </div>

      <div className="my-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div className="flex min-w-0 gap-2.5">
          <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"><Store className="h-3 w-3" aria-hidden="true" /></span>
          <div className="min-w-0"><p className="text-xs text-muted-foreground">Olib ketish</p><p className="truncate text-sm font-medium">{delivery.storeAddress}</p></div>
        </div>
        <div className="hidden items-center justify-center text-border sm:flex"><span className="h-px w-8 bg-border" /><ArrowUpRight className="h-4 w-4" aria-hidden="true" /><span className="h-px w-8 bg-border" /></div>
        <div className="flex min-w-0 gap-2.5">
          <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"><MapPin className="h-3 w-3" aria-hidden="true" /></span>
          <div className="min-w-0"><p className="text-xs text-muted-foreground">Manzil</p><p className="truncate text-sm font-medium">{delivery.destination}</p></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
        {delivery.distance != null && <span className="inline-flex items-center gap-1.5"><Route className="h-3.5 w-3.5" />{delivery.distance} km{delivery.isDemo ? " · demo" : ""}</span>}
        <span className="inline-flex items-center gap-1.5"><Package className="h-3.5 w-3.5" />{delivery.products.length} ta mahsulot</span>
        <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{delivery.createdAt}</span>
      </div>

      <Button asChild variant="outline" className="mt-4 h-10 w-full rounded-xl">
        <Link to={`/courier/orders/${delivery.id}`}>Batafsil</Link>
      </Button>
    </article>
  );
}
