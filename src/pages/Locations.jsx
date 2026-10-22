import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapPin, MapPinned, Navigation, Store } from "lucide-react";
import PageHeader from "@/components/vimi/PageHeader";
import { SettingsList, SettingsRow } from "@/components/vimi/SettingsList";
import { SecondaryButton } from "@/components/vimi/VimiButton";
import LocationSheet from "@/components/vimi/LocationSheet";
import { useBuyer } from "@/lib/BuyerContext";
import { useBusiness } from "@/lib/BusinessContext";

export default function Locations() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedLocation } = useBuyer();
  const { selectedBusiness } = useBusiness();
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const activeLocation = [selectedLocation?.city, selectedLocation?.region].filter(Boolean).join(", ") || "Joylashuv tanlanmagan";
  const backTo = location.state?.from || "/profile";

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Joylashuvlar" subtitle="Hudud va manzillaringizni boshqaring." backTo={backTo} />

      <section className="space-y-3">
        <h2 className="font-display text-base font-semibold">Faol hudud</h2>
        <SettingsList>
          <SettingsRow icon={MapPin} label="Do‘konlarni ko‘rish hududi" value={activeLocation} onClick={() => setLocationSheetOpen(true)} />
        </SettingsList>
        <SecondaryButton className="h-11 w-full gap-2" onClick={() => setLocationSheetOpen(true)}>
          <Navigation className="h-4 w-4" />Hududni o‘zgartirish
        </SecondaryButton>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-base font-semibold">Yetkazib berish</h2>
        <SettingsList>
          <SettingsRow icon={MapPinned} label="Saqlangan manzillar" onClick={() => navigate("/addresses")} />
        </SettingsList>
      </section>

      {selectedBusiness && (
        <section className="space-y-3">
          <h2 className="font-display text-base font-semibold">Sotuvchi joylashuvlari</h2>
          <SettingsList>
            <SettingsRow icon={Store} label={`${selectedBusiness.name} filiallari`} onClick={() => navigate(`/seller/businesses/${selectedBusiness.id}`)} />
          </SettingsList>
        </section>
      )}

      <LocationSheet open={locationSheetOpen} onOpenChange={setLocationSheetOpen} />
    </div>
  );
}