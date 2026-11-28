import React, { useEffect, useState } from "react";
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
  const [detectError, setDetectError] = useState("");
  const [detectedLocation, setDetectedLocation] = useState(null);

  useEffect(() => {
    if (!open) setDetectedLocation(null);
  }, [open]);

  const handleDetect = async () => {
    setDetecting(true);
    setDetectError("");
    setDetectedLocation(null);
    try {
      const coords = await getCurrentPosition();
      const loc = await detectNearestLocation(coords);
      if (!loc) {
        setDetectError("Koordinata olindi, ammo unga mos faol filial topilmadi. Hududni qo‘lda tanlang.");
        return;
      }
      setDetectedLocation(loc);
      await setLocation(loc);
      toast({ title: "Joylashuv aniqlandi", description: [loc.city, loc.region].filter(Boolean).join(", ") });
    } catch (e) {
      setDetectError(e?.message || "Joylashuvni aniqlab bo‘lmadi. Hududni qo‘lda tanlang.");
    } finally {
      setDetecting(false);
    }
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Joylashuvni tanlang">
      <div className="space-y-4">
        <PrimaryButton type="button" className="h-12 w-full" onClick={handleDetect} disabled={detecting}>
          {detecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LocateFixed className="mr-2 h-4 w-4" />}
          {detecting ? "Joylashuv aniqlanmoqda..." : "Joriy joylashuvni aniqlash"}
        </PrimaryButton>
        {detectError && (
          <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            {detectError}
          </div>
        )}
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-3 text-xs text-muted-foreground">Yoki qo'lda tanlang</p>
          <GeoSelect onChange={async (loc) => {
            if (!loc.region || !loc.city) return;
            try {
              await setLocation(loc);
              onOpenChange?.(false);
            } catch (error) {
              toast({ title: error?.message || "Joylashuvni saqlab bo‘lmadi", variant: "destructive" });
            }
          }} initialLocation={detectedLocation || selectedLocation} />
        </div>
        {selectedLocation && (
          <SecondaryButton type="button" className="h-12 w-full" onClick={() => { setDetectedLocation(null); setLocation(null); onOpenChange?.(false); }}>
            Joylashuvni tozalash
          </SecondaryButton>
        )}
      </div>
    </BottomSheet>
  );
}