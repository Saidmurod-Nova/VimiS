import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useBusiness } from "@/lib/BusinessContext";
import { generateUniqueStoreId } from "@/lib/storeId";
import {
  createBusinessWithBranch,
  generateUniqueStoreIdSupabase,
} from "@/lib/supabaseCatalog";
import { isSupabaseMode } from "@/lib/supabase";
import PageHeader from "@/components/vimi/PageHeader";
import CategorySelect from "@/components/vimi/CategorySelect";
import GeoSelect from "@/components/vimi/GeoSelect";
import LogoUpload from "@/components/vimi/LogoUpload";
import MapPicker from "@/components/vimi/MapPicker";
import { TextInput } from "@/components/vimi/VimiInput";
import { PrimaryButton, SecondaryButton } from "@/components/vimi/VimiButton";
import { useToast } from "@/components/ui/use-toast";

const steps = ["Asosiy ma’lumot", "Aloqa", "Joylashuv", "Tekshirish"];

function validateStep(step, values) {
  if (step === 0) {
    if (!values.name.trim()) return "Biznes nomini kiriting.";
    if (!values.categoryId) return "Biznes kategoriyasini tanlang.";
  }
  if (step === 2) {
    if (!values.geo?.country || !values.geo?.region || !values.geo?.city || !values.geo?.geo_area_id) {
      return "Davlat, viloyat va shahar/tumanni tanlang.";
    }
    if (!Number.isFinite(values.coordinates?.lat) || !Number.isFinite(values.coordinates?.lng)) {
      return "Xaritada biznes joylashuvini belgilang.";
    }
  }
  return "";
}

export default function BusinessCreate() {
  const navigate = useNavigate();
  const { refresh, rememberBusiness } = useBusiness();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({
    name: "",
    description: "",
    categoryId: "",
    categoryName: "",
    logoUrl: "",
    phone: "",
    workingHours: "",
    geo: null,
    address: "",
    coordinates: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [partialBusiness, setPartialBusiness] = useState(null);
  const submissionInProgress = useRef(false);

  const update = (patch) => setValues((current) => ({ ...current, ...patch }));

  const goNext = () => {
    const validationError = validateStep(step, values);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const goBack = () => {
    setError("");
    setStep((current) => Math.max(current - 1, 0));
  };

  const branchPayload = (businessId) => ({
    business_id: businessId,
    name: "Asosiy filial",
    geo_area_id: values.geo.geo_area_id,
    country: values.geo.country,
    region: values.geo.region,
    city: values.geo.city,
    district: values.geo.district,
    address: values.address.trim(),
    latitude: values.coordinates.lat,
    longitude: values.coordinates.lng,
    phone: values.phone.trim(),
    working_hours: values.workingHours.trim(),
  });

  const finishCreation = async (business) => {
    await refresh();
    rememberBusiness(business);
    toast({
      title: "Biznes yaratildi",
      description: `${business.name} biznesi va asosiy filiali tayyor.`,
    });
    navigate("/business", { replace: true });
  };

  const submit = async (event) => {
    event.preventDefault();
    const validationError = validateStep(0, values) || validateStep(2, values);
    if (validationError) {
      setError(validationError);
      setStep(validationError.includes("joylashuv") || validationError.includes("viloyat") ? 2 : 0);
      return;
    }
    if (submissionInProgress.current) return;

    submissionInProgress.current = true;
    setLoading(true);
    setError("");
    try {
      if (partialBusiness) {
        await base44.functions.invoke("createBranch", branchPayload(partialBusiness.id));
        await finishCreation(partialBusiness);
        return;
      }

      const storeId = isSupabaseMode
        ? await generateUniqueStoreIdSupabase(values.name)
        : await generateUniqueStoreId(base44, values.name);
      const businessInput = {
        name: values.name.trim(),
        description: values.description.trim(),
        category_id: values.categoryId,
        category_name: values.categoryName,
        logo_url: values.logoUrl,
        store_id: storeId,
        is_active: true,
      };

      if (isSupabaseMode) {
        const result = await createBusinessWithBranch({
          business: businessInput,
          branch: branchPayload(null),
        });
        await finishCreation(result.business);
      } else {
        const business = await base44.entities.Business.create(businessInput);
        setPartialBusiness(business);
        await base44.functions.invoke("createBranch", branchPayload(business.id));
        await finishCreation(business);
      }
    } catch (createError) {
      console.error("Biznes yaratish jarayoni bajarilmadi.", createError);
      setError(createError?.message || "Biznes yaratilmadi. Ma’lumotlaringiz saqlandi, qayta urinib ko‘ring.");
    } finally {
      submissionInProgress.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-6">
      <PageHeader
        title="Biznes yaratish"
        subtitle="Shaxsiy hisobingizdan biznes oching va boshqaring."
        backTo="/business"
        action={null}
        className=""
      />

      <ol aria-label="Biznes yaratish bosqichlari" className="grid grid-cols-4 gap-2">
        {steps.map((label, index) => {
          const current = index === step;
          const complete = index < step;
          return (
            <li key={label} aria-current={current ? "step" : undefined} className="min-w-0">
              <div className={`h-1.5 rounded-full ${complete || current ? "bg-primary" : "bg-secondary"}`} />
              <p className={`mt-2 truncate text-[11px] font-medium sm:text-xs ${current ? "text-foreground" : "text-muted-foreground"}`}>
                <span className="mr-1">{complete ? <Check className="inline h-3 w-3" aria-hidden="true" /> : `${index + 1}.`}</span>
                {label}
              </p>
            </li>
          );
        })}
      </ol>

      <form onSubmit={submit} className="space-y-5 rounded-2xl border border-border bg-card p-4 sm:p-6">
        {step === 0 && (
          <section aria-labelledby="business-step-basic" className="space-y-5">
            <div>
              <h2 id="business-step-basic" className="font-display text-lg font-semibold">Biznes haqida</h2>
              <p className="mt-1 text-sm text-muted-foreground">Marketplace’da ko‘rinadigan asosiy ma’lumotlar.</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="business-name" className="text-sm font-medium">Biznes nomi <span aria-hidden="true">*</span></label>
              <TextInput
                icon={null}
                className=""
                inputClassName=""
                id="business-name"
                value={values.name}
                onChange={(event) => update({ name: event.target.value })}
                placeholder="Masalan: Samarqand hunarmandlari"
                maxLength={120}
                autoComplete="organization"
                autoFocus
                required
              />
              <p className="text-right text-xs text-muted-foreground">{values.name.length}/120</p>
            </div>
            <CategorySelect
              value={values.categoryId}
              onChange={(categoryId, categoryName) => update({ categoryId, categoryName })}
            />
            <div className="space-y-2">
              <label htmlFor="business-description" className="text-sm font-medium">Tavsif <span className="text-muted-foreground">(ixtiyoriy)</span></label>
              <textarea
                id="business-description"
                value={values.description}
                onChange={(event) => update({ description: event.target.value })}
                placeholder="Biznesingiz va takliflaringiz haqida qisqacha"
                maxLength={1200}
                rows={4}
                className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-right text-xs text-muted-foreground">{values.description.length}/1200</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Biznes logosi <span className="text-muted-foreground">(ixtiyoriy)</span></p>
              <LogoUpload value={values.logoUrl} onChange={(logoUrl) => update({ logoUrl })} className="" />
            </div>
          </section>
        )}

        {step === 1 && (
          <section aria-labelledby="business-step-contact" className="space-y-5">
            <div>
              <h2 id="business-step-contact" className="font-display text-lg font-semibold">Aloqa ma’lumotlari</h2>
              <p className="mt-1 text-sm text-muted-foreground">Bu ma’lumot asosiy filial uchun saqlanadi.</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="business-phone" className="text-sm font-medium">Biznes telefoni <span className="text-muted-foreground">(ixtiyoriy)</span></label>
              <TextInput
                icon={null}
                className=""
                inputClassName=""
                id="business-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={values.phone}
                onChange={(event) => update({ phone: event.target.value })}
                placeholder="+998 90 123 45 67"
                maxLength={40}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="business-hours" className="text-sm font-medium">Ish vaqti <span className="text-muted-foreground">(ixtiyoriy)</span></label>
              <TextInput
                icon={null}
                className=""
                inputClassName=""
                id="business-hours"
                value={values.workingHours}
                onChange={(event) => update({ workingHours: event.target.value })}
                placeholder="Masalan: 09:00 — 18:00"
                maxLength={120}
              />
            </div>
          </section>
        )}

        {step === 2 && (
          <section aria-labelledby="business-step-location" className="space-y-5">
            <div>
              <h2 id="business-step-location" className="font-display text-lg font-semibold">Asosiy filial joylashuvi</h2>
              <p className="mt-1 text-sm text-muted-foreground">Birinchi filial biznes bilan birga yaratiladi. Keyin boshqa filiallarni qo‘shishingiz mumkin.</p>
            </div>
            <GeoSelect onChange={(geo) => update({ geo })} />
            <div className="space-y-2">
              <label htmlFor="business-address" className="text-sm font-medium">Ko‘cha va uy manzili <span className="text-muted-foreground">(ixtiyoriy)</span></label>
              <TextInput
                icon={null}
                className=""
                inputClassName=""
                id="business-address"
                value={values.address}
                onChange={(event) => update({ address: event.target.value })}
                placeholder="Ko‘cha, uy, mo‘ljal"
                maxLength={240}
                autoComplete="street-address"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Filial xaritadagi nuqtasi <span aria-hidden="true">*</span></p>
              <MapPicker
                value={values.coordinates}
                onChange={(coordinates) => update({ coordinates })}
              />
              <p className="text-xs text-muted-foreground">Xaritadagi nuqtani bosing yoki joylashuvingizni aniqlang.</p>
            </div>
          </section>
        )}

        {step === 3 && (
          <section aria-labelledby="business-step-review" className="space-y-5">
            <div>
              <h2 id="business-step-review" className="font-display text-lg font-semibold">Tekshirish</h2>
              <p className="mt-1 text-sm text-muted-foreground">Biznesni yaratishdan oldin ma’lumotlarni tekshiring.</p>
            </div>
            <dl className="divide-y divide-border rounded-xl border border-border">
              <ReviewRow label="Biznes nomi" value={values.name} />
              <ReviewRow label="Kategoriya" value={values.categoryName} />
              <ReviewRow label="Tavsif" value={values.description || "Kiritilmagan"} />
              <ReviewRow label="Telefon" value={values.phone || "Kiritilmagan"} />
              <ReviewRow label="Ish vaqti" value={values.workingHours || "Kiritilmagan"} />
              <ReviewRow
                label="Joylashuv"
                value={[values.geo?.city, values.geo?.region, values.geo?.country].filter(Boolean).join(", ")}
              />
              <ReviewRow label="Manzil" value={values.address || "Kiritilmagan"} />
              <ReviewRow label="Logo" value={values.logoUrl ? "Yuklangan" : "Kiritilmagan"} />
            </dl>
            {partialBusiness && (
              <p className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-foreground">
                Biznes qayd etildi, ammo filial hali yaratilmagan. Qayta urinish faqat filialni yaratadi.
              </p>
            )}
          </section>
        )}

        {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between">
          <SecondaryButton type="button" className="h-11" onClick={goBack} disabled={step === 0 || loading}>
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Orqaga
          </SecondaryButton>
          {step < steps.length - 1 ? (
            <PrimaryButton type="button" className="h-11" onClick={goNext}>
              Davom etish
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </PrimaryButton>
          ) : (
            <PrimaryButton type="submit" className="h-11" disabled={loading}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Yaratilmoqda...</>
              ) : (
                partialBusiness ? "Filialni yaratishni qayta urinish" : "Biznesni yaratish"
              )}
            </PrimaryButton>
          )}
        </div>
      </form>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="grid gap-1 px-4 py-3 sm:grid-cols-[140px_1fr] sm:gap-4">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm">{value}</dd>
    </div>
  );
}
