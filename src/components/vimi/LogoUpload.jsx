import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Upload, Loader2, Store } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LogoUpload({ value, onChange, className }) {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      onChange(file_url);
    } catch {
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-secondary">
        {value ? (
          <Image src={value} alt="Logo" fittingType="fill" className="h-full w-full" />
        ) : (
          <Store className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        )}
      </span>
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium transition active:scale-95 disabled:opacity-60"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Yuklanmoqda...</>
          ) : (
            <><Upload className="h-4 w-4" aria-hidden="true" />Logo yuklash</>
          )}
        </button>
        <p className="mt-1 text-xs text-muted-foreground">PNG yoki JPG. Ochiq logo.</p>
        <input ref={inputRef} type="file" accept="image/*" onChange={handle} className="hidden" />
      </div>
    </div>
  );
}