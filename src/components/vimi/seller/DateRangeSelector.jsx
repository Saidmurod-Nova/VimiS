import React, { useState } from "react";
import { Calendar, Check } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TextInput } from "../VimiInput";
import { PrimaryButton } from "../VimiButton";
import { cn } from "@/lib/utils";

// Date-range presets for dashboard/statistics. Presets use a consistent
// business timezone (Asia/Tashkent) resolved server-side. "Boshqa" opens a
// custom range sheet with inclusive from/to dates.
const PRESETS = [
  { key: "today", label: "Bugun" },
  { key: "7d", label: "7 kun" },
  { key: "30d", label: "30 kun" },
  { key: "all", label: "Barcha" },
];

export default function DateRangeSelector({ range, from, to, onChange, className }) {
  const [open, setOpen] = useState(false);
  const [dFrom, setDFrom] = useState(from || "");
  const [dTo, setDTo] = useState(to || "");

  const applyCustom = () => {
    if (!dFrom || !dTo) return;
    onChange({ range: "custom", from: dFrom, to: dTo });
    setOpen(false);
  };

  return (
    <div className={cn("flex items-center gap-1.5 overflow-x-auto no-scrollbar", className)}>
      {PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => onChange({ range: p.key, from: null, to: null })}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition",
            range === p.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
          )}
        >
          {p.label}
        </button>
      ))}
      <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (v) { setDFrom(from || ""); setDTo(to || ""); } }}>
        <SheetTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition",
              range === "custom" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            <Calendar className="h-3.5 w-3.5" /> Boshqa
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="sm:max-w-md sm:mx-auto sm:rounded-t-2xl">
          <SheetHeader className="text-left">
            <SheetTitle>Oraliqni tanlang</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-6 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Dan (sana)</label>
              <TextInput type="date" value={dFrom} onChange={(e) => setDFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Gacha (sana)</label>
              <TextInput type="date" value={dTo} onChange={(e) => setDTo(e.target.value)} />
            </div>
            <PrimaryButton className="h-12 w-full" onClick={applyCustom} disabled={!dFrom || !dTo}>
              <Check className="mr-1 h-4 w-4" />Qo‘llash
            </PrimaryButton>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}