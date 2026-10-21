import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Loader2, ScanLine } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { PrimaryButton } from "@/components/vimi/VimiButton";
import { safeReturnTo } from "@/lib/authReturnTo";
import { requireSupabase } from "@/lib/supabase";
import { consumeLoginQr } from "@/lib/qrSessions";

export default function ScanLogin() {
  const videoRef = useRef(null);
  const busyRef = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const returnTo = safeReturnTo();

  useEffect(() => {
    let mounted = true;
    /** @type {{ stop: () => void } | undefined} */
    let controls;
    const videoElement = /** @type {HTMLVideoElement | null} */ (videoRef.current);
    if (!videoElement) return undefined;
    import("@zxing/browser").then(({ BrowserQRCodeReader }) => {
      if (!mounted) return undefined;
      return new BrowserQRCodeReader().decodeFromVideoDevice(undefined, videoElement, async (result) => {
        if (!mounted || !result || busyRef.current) return;
        busyRef.current = true;
        setProcessing(true);
        setError("");
        controls?.stop();

        try {
          const payload = JSON.parse(result.getText());
          if (payload?.type !== "vimis-session" || typeof payload.id !== "string" || typeof payload.secret !== "string") {
            throw new Error("Vimi QR kodi topilmadi.");
          }
          const { tokenHash } = await consumeLoginQr(payload.id, payload.secret);
          const { error: authError } = await requireSupabase().auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
          if (authError) throw authError;
          navigate(returnTo, { replace: true });
        } catch (scanError) {
          if (!mounted) return;
          setError(scanError instanceof Error ? scanError.message : "QR kodni o‘qib bo‘lmadi.");
          setProcessing(false);
          busyRef.current = false;
        }
      });
    }).then((scannerControls) => {
      if (mounted) controls = scannerControls;
      else scannerControls?.stop();
    }).catch(() => {
      if (mounted) setError("Kamerani ochib bo‘lmadi. Brauzerda kameraga ruxsat bering.");
    });

    return () => {
      mounted = false;
      controls?.stop();
    };
  }, [attempt, navigate, returnTo]);

  const retry = () => {
    busyRef.current = false;
    setError("");
    setProcessing(false);
    setAttempt((current) => current + 1);
  };

  return (
    <AuthLayout title="Skaner qilib kirish" subtitle="Profilingizdagi QR kodni kameraga tuting" footer={null}>
      <div className="space-y-4">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-black">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative aspect-square w-2/3 max-w-56 border-2 border-white/90">
              <span className="absolute -left-0.5 -top-0.5 h-6 w-6 border-l-4 border-t-4 border-primary" />
              <span className="absolute -right-0.5 -top-0.5 h-6 w-6 border-r-4 border-t-4 border-primary" />
              <span className="absolute -bottom-0.5 -left-0.5 h-6 w-6 border-b-4 border-l-4 border-primary" />
              <span className="absolute -bottom-0.5 -right-0.5 h-6 w-6 border-b-4 border-r-4 border-primary" />
            </div>
          </div>
          {!processing && !error && (
            <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-md bg-black/65 px-3 py-2 text-xs text-white">
              <Camera className="h-4 w-4" aria-hidden="true" /> Kamerani QR kodga qarating
            </div>
          )}
          {processing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-white">
              <span className="inline-flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Tasdiqlanmoqda</span>
            </div>
          )}
        </div>

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {error && <PrimaryButton className="w-full" onClick={retry}><ScanLine className="mr-2 h-4 w-4" />Qayta skanerlash</PrimaryButton>}
        <Link to={`/login${returnTo !== "/" ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`} className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Boshqa usul bilan kirish
        </Link>
      </div>
    </AuthLayout>
  );
}