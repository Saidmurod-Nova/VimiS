import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { uploadVimiImage } from "@/lib/supabaseStorage";
import { Image } from "@/components/ui/image";
import { Upload, Loader2, Package, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProductImageUpload({ value, onChange, className }) {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      if (import.meta.env.VITE_STORAGE_PROVIDER === "supabase") {
        const { publicUrl } = await uploadVimiImage(file, "products");
        onChange(publicUrl);
      } else {
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
        onChange(file_url);
      }
    } catch (error) {
      console.error("Rasm yuklash xatosi:", error);
      window.alert(error?.message || "Rasmni yuklab bo'lmadi.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative aspect-square w-full max-w-[200px] overflow-hidden rounded-2xl border border-border bg-secondary">
        {value ? (
          <>
            <Image src={value} alt="Mahsulot rasmi" fittingType="fill" className="h-full w-full" />
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Rasmni o'chirish"
              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition active:scale-95"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium transition active:scale-95 disabled:opacity-60"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Yuklanmoqda...</>
        ) : value ? (
          <><Upload className="h-4 w-4" aria-hidden="true" />Rasmni almashtirish</>
        ) : (
          <><Upload className="h-4 w-4" aria-hidden="true" />Rasm yuklash</>
        )}
      </button>
      <p className="text-xs text-muted-foreground">PNG yoki JPG. Kvadrat rasm tavsiya etiladi.</p>
      <input ref={inputRef} type="file" accept="image/*" onChange={handle} className="hidden" />
    </div>
  );
}