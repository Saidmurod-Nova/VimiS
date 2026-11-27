import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, CheckCircle2, Circle, ExternalLink, MapPin, Navigation, Package, Store } from "lucide-react";
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
import { useCourierDemo } from "@/lib/CourierDemoContext";
import { formatUZS } from "@/lib/courierDemo";
import { PageHeading, StatusPill } from "@/components/courier/CourierUI";
import { navigationUrl } from "@/lib/maps";

const confirmCopy = {
  available: {
    title: "Buyurtmani qabul qilasizmi?",
    description: "Qabul qilingach, buyurtma sizga biriktiriladi va boshqa kuryer uni qabul qila olmaydi.",
    demoDescription: "Faqat demo ko‘rinishidagi buyurtma sizga biriktiriladi. Haqiqiy buyurtma qabul qilinmaydi.",
    action: "Buyurtmani qabul qilish",
  },
  accepted: {
    title: "Buyurtmani olib ketdingizmi?",
    description: "Tasdiqlasangiz, buyurtma \"Olib ketildi\" holatiga o‘tadi.",
    demoDescription: "Tasdiqlasangiz, namuna buyurtma \"Olib ketildi\" holatiga o‘tadi.",
    action: "Buyurtmani olib ketdim",
  },
  picked_up: {
    title: "Yetkazib berishni boshlaysizmi?",
    description: "Tasdiqlasangiz, buyurtma \"Yo‘lda\" holatiga o‘tadi.",
    demoDescription: "Tasdiqlasangiz, namuna buyurtma \"Yo‘lda\" holatiga o‘tadi.",
    action: "Yetkazishga chiqdim",
  },
  on_the_way: {
    title: "Buyurtma topshirildimi?",
    description: "Yetkazilganini tasdiqlash buyurtmani yakunlaydi.",
    demoDescription: "Faqat namuna holati yakunlanadi. Haqiqiy yetkazish tasdiqlanmaydi.",
    action: "Yetkazib berdim",
  },
};

const steps = [
  ["Yangi buyurtma", "available"],
  ["Qabul qilindi", "accepted"],
  ["Olib ketildi", "picked_up"],
  ["Yo‘lda", "on_the_way"],
  ["Yetkazildi", "completed"],
];

export default function ActiveDelivery() {
  const { deliveryId } = useParams();
  const navigate = useNavigate();
  const { deliveries, isOnline, isSupabaseBacked, acceptDelivery, advanceDelivery } = useCourierDemo();
  const delivery = deliveries.find((item) => item.id === deliveryId);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!delivery) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-6 text-center">
        <Package className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
        <h1 className="mt-3 font-semibold">Buyurtma topilmadi</h1>
        <p className="mt-1 text-sm text-muted-foreground">Bu buyurtma demo ro‘yxatida yo‘q.</p>
        <Button asChild variant="outline" className="mt-4 rounded-xl"><Link to="/courier">Bosh menyuga qaytish</Link></Button>
      </div>
    );
  }

  const isComplete = delivery.status === "completed";
  const isCancelled = delivery.status === "cancelled";
  const stepIndex = steps.findIndex(([, status]) => status === delivery.status);
  const nextAction = isCancelled ? null : confirmCopy[delivery.status];
  const storeLocation = {
    address: delivery.storeAddress,
    latitude: delivery.storeLatitude,
    longitude: delivery.storeLongitude,
    city: delivery.storeCity,
    district: delivery.storeDistrict,
    region: delivery.storeRegion,
    country: delivery.storeCountry,
  };
  const customerLocation = {
    address: delivery.destination,
    latitude: delivery.destinationLatitude,
    longitude: delivery.destinationLongitude,
  };
  const pickupMapUrl = navigationUrl(storeLocation);
  const destinationMapUrl = navigationUrl(customerLocation);

  const confirmStatusAction = () => {
    if (delivery.status === "available") acceptDelivery(delivery.id);
    else advanceDelivery(delivery.id);
    setConfirmOpen(false);
  };

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="-ml-2 h-9 rounded-lg text-muted-foreground" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />Ortga
        </Button>
        <span className="text-muted-foreground">/</span>
        <Link to="/courier" className="text-sm text-muted-foreground hover:text-foreground">Bosh menyu</Link>
      </div>

      <PageHeading
        eyebrow={`Buyurtma #${delivery.orderNumber || delivery.id}`}
        title={isComplete ? "Buyurtma yetkazildi" : isCancelled ? "Buyurtma bekor qilindi" : "Buyurtma ma’lumotlari"}
        description={`Buyurtma sanasi: ${delivery.createdAt}`}
        action={<StatusPill status={delivery.status} />}
      />

      {!isCancelled && (
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Yetkazish bosqichlari</h2>
            <span className="text-xs text-muted-foreground">{isComplete ? "Yakunlangan" : `Bosqich ${stepIndex + 1} / ${steps.length}`}</span>
          </div>
          <ol className="grid grid-cols-5 gap-1">
            {steps.map(([label], index) => {
              const done = index <= stepIndex;
              const current = index === stepIndex && !isComplete;
              return (
                <li key={label} className="relative min-w-0 text-center">
                  {index > 0 && <span className={`absolute left-[-50%] top-3.5 h-0.5 w-full ${index <= stepIndex ? "bg-primary" : "bg-border"}`} aria-hidden="true" />}
                  <span className={`relative z-10 mx-auto flex h-7 w-7 items-center justify-center rounded-full ${done ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground"} ${current ? "ring-4 ring-primary/10" : ""}`}>
                    {done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3 w-3" />}
                  </span>
                  <span className={`mt-2 block truncate text-[10px] sm:text-xs ${done ? "font-medium text-foreground" : "text-muted-foreground"}`}>{label}</span>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {isCancelled && <p className="rounded-xl border border-border bg-secondary/60 p-4 text-sm text-muted-foreground">Bu namuna buyurtma bekor qilingan. Keyingi amallar mavjud emas.</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <h2 className="font-display font-semibold">Do‘kon va olib ketish joyi</h2>
          <div className="mt-4 flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Store className="h-4 w-4" aria-hidden="true" /></span>
            <div className="min-w-0">
              <p className="font-medium">{delivery.store}</p>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{delivery.storeAddress}</p>
              {pickupMapUrl && <a href={pickupMapUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-secondary px-3 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                <Navigation className="h-4 w-4" aria-hidden="true" />Do‘konga yo‘nalish<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <h2 className="font-display font-semibold">Mijoz va yetkazish manzili</h2>
          <div className="mt-4 flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-200"><MapPin className="h-4 w-4" aria-hidden="true" /></span>
            <div className="min-w-0">
              <p className="font-medium">{delivery.customer}</p>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{delivery.destination}</p>
              <p className="mt-2 text-sm text-muted-foreground">{delivery.phone}</p>
              {destinationMapUrl ? (
                <a href={destinationMapUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-secondary px-3 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                  <Navigation className="h-4 w-4" aria-hidden="true" />Mijozga yo‘nalish<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">Manzil xaritada topilmadi. Buyurtmadagi manzilni aniqlashtiring.</p>
              )}
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Package className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="font-display font-semibold">Buyurtma tarkibi</h2>
        </div>
        <ul className="mt-3 space-y-3">
          {delivery.products.map((product) => (
            <li key={product} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              {product}
            </li>
          ))}
        </ul>
        {delivery.instructions && (
          <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm leading-5 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
            <p className="font-medium">Yetkazib berish bo‘yicha izoh</p>
            <p className="mt-1">{delivery.instructions}</p>
          </div>
        )}
        {delivery.fee != null && (
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
            <span className="text-muted-foreground">Yetkazib berish haqi{delivery.isDemo ? " · demo" : ""}</span>
            <strong>{formatUZS(delivery.fee)}</strong>
          </div>
        )}
      </section>

      {!isComplete && !isCancelled && (
        <div className="sticky bottom-[76px] z-10 rounded-2xl border border-border bg-card/95 p-3 shadow-lg shadow-black/10 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
          {nextAction && (
            <>
              <Button
                disabled={delivery.status === "available" && !isOnline}
                className="h-12 w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setConfirmOpen(true)}
              >
                {nextAction.action}
              </Button>
              {delivery.status === "available" && !isOnline && <p className="mt-2 text-center text-xs text-muted-foreground">Qabul qilish uchun kuryerlik rejimini yoqing.</p>}
            </>
          )}
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{nextAction?.title}</AlertDialogTitle>
            <AlertDialogDescription>{isSupabaseBacked ? nextAction?.description : nextAction?.demoDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Bekor qilish</AlertDialogCancel>
            <AlertDialogAction className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90" onClick={(event) => { event.preventDefault(); confirmStatusAction(); }}>
              {nextAction?.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
