import React, { useState } from "react";
import { LocateFixed, Loader2 } from "lucide-react";
import BottomSheet from "./BottomSheet";
import GeoSelect from "./GeoSelect";
import { PrimaryButton, SecondaryButton } from "./VimiButton";
import { useBuyer } from "@/lib/BuyerContext";
import { getCurrentPosition, detectNearestLocation } from "@/lib/location";
import { useToast } from "@/components/ui/use-toast";

// Location selector: manual geo hierarchy + optional automatic detection via
// nearest branch. GPS is requested only when the user taps the detect button.
export default function LocationSheet({ open, onOpenChange }) {
  const { selectedLocation, setLocation } = useBuyer();
  const { toast } = useToast();
  const [detecting, setDetecting] = useState(false);

  const handleDetect = async () => {
    setDetecting(true);
    try {
      const coords = await getCurrentPosition();
      const loc = await detectNearestLocation(coords);
      if (!loc) { toast({ title: "Joylashuv aniqlanmadi", description: "Iltimos, qo'lda tanlang." }); return; }
      await setLocation(loc);
      toast({ title: "Joylashuv aniqlandi", description: [loc.city, loc.region].filter(Boolean).join(", ") });
      onOpenChange?.(false);
    } catch (e) {
      toast({ title: "Ruxsat berilmadi", description: "Qo'lda tanlashda davom eting." });
    } finally {
      setDetecting(false);
    }
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Joylashuvni tanlang">
      <div className="space-y-4">
        <PrimaryButton type="button" className="h-12 w-full" onClick={handleDetect} disabled={detecting}>
          {detecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LocateFixed className="mr-2 h-4 w-4" />}
          Joriy joylashuvni aniqlash
        </PrimaryButton>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-3 text-xs text-muted-foreground">Yoki qo'lda tanlang</p>
          <GeoSelect onChange={(loc) => { setLocation(loc); }} />
        </div>
        {selectedLocation && (
          <SecondaryButton type="button" className="h-12 w-full" onClick={() => { setLocation(null); onOpenChange?.(false); }}>
            Joylashuvni tozalash
          </SecondaryButton>
        )}
      </div>
    </BottomSheet>
  );
}