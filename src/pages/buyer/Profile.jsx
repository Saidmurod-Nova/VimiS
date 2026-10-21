import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Pencil, MapPinned, Briefcase, RefreshCw, LogOut, Loader2, MonitorSmartphone, QrCode, ShieldCheck, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Avatar from "@/components/vimi/Avatar";
import { SettingsList, SettingsRow } from "@/components/vimi/SettingsList";
import { useAuth } from "@/lib/AuthContext";
import { useBuyer } from "@/lib/BuyerContext";
import { isSupabaseMode } from "@/lib/supabase";
import { createLoginQr, listUserSessions, revokeOtherUserSessions, revokeUserSession } from "@/lib/qrSessions";
import { PrimaryButton, SecondaryButton } from "@/components/vimi/VimiButton";
import ConfirmDialog from "@/components/vimi/ConfirmDialog";

export default function Profile() {
  const { user, logout } = useAuth();
  const { selectedLocation } = useBuyer();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [qr, setQr] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [sessionError, setSessionError] = useState("");
  const [confirmRevokeOthers, setConfirmRevokeOthers] = useState(false);
  const locLabel = selectedLocation?.city || selectedLocation?.region || "Joylashuv tanlanmagan";

  const loadSessions = async () => {
    setLoadingSessions(true);
    setSessionError("");
    try {
      const result = await listUserSessions();
      setSessions(result.sessions || []);
    } catch (error) {
      setSessionError(error?.message || "Qurilmalar ro‘yxatini yuklab bo‘lmadi.");
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (isSupabaseMode) loadSessions();
  }, []);

  useEffect(() => {
    if (!qr) return undefined;
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((new Date(qr.expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) setQr(null);
    };
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [qr]);

  const onCreateQr = async () => {
    setBusyAction("qr");
    setSessionError("");
    try {
      setQr(await createLoginQr());
    } catch (error) {
      setSessionError(error?.message || "QR kod yaratib bo‘lmadi.");
    } finally {
      setBusyAction("");
    }
  };

  const onRevokeSession = async (sessionId) => {
    setBusyAction(sessionId);
    setSessionError("");
    try {
      await revokeUserSession(sessionId);
      await loadSessions();
    } catch (error) {
      setSessionError(error?.message || "Sessionni bekor qilib bo‘lmadi.");
    } finally {
      setBusyAction("");
    }
  };

  const onRevokeOthers = async () => {
    setBusyAction("others");
    setSessionError("");
    try {
      await revokeOtherUserSessions();
      await loadSessions();
    } catch (error) {
      setSessionError(error?.message || "Boshqa sessionlarni bekor qilib bo‘lmadi.");
    } finally {
      setBusyAction("");
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Profil</h1>

      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
        <Avatar name={user?.full_name || "Vimi user"} src={user?.avatar} size={64} />
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-foreground">{user?.full_name || "Foydalanuvchi"}</h2>
          <p className="truncate text-sm text-muted-foreground">{user?.phone || user?.email || "—"}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" aria-hidden="true" />{locLabel}
          </p>
        </div>
      </div>

      <SettingsList>
        <SettingsRow icon={Pencil} label="Profilni tahrirlash" onClick={() => navigate("/profile/edit")} />
        <SettingsRow icon={MapPinned} label="Joylashuvlar" onClick={() => navigate("/locations", { state: { from: "/profile" } })} />
        <SettingsRow icon={Briefcase} label="Mening bizneslarim" onClick={() => {}} />
      </SettingsList>

      {isSupabaseMode && (
        <section className="space-y-4 border-y border-border py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="font-display text-lg font-semibold">Qurilmalar va sessiyalar</h2>
            </div>
            <SecondaryButton className="h-9 px-3 text-xs" onClick={() => setConfirmRevokeOthers(true)} disabled={!!busyAction || sessions.filter((session) => !session.isCurrent).length === 0}>
              {busyAction === "others" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Boshqalarini chiqarish"}
            </SecondaryButton>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Yangi qurilmada kirish uchun bir martalik QR kod yarating va uni Login sahifasida skaner qiling.</p>
              <PrimaryButton className="mt-3 h-10" onClick={onCreateQr} disabled={!!busyAction}>
                {busyAction === "qr" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
                QR kod yaratish
              </PrimaryButton>
            </div>
            {qr && (
              <div className="flex shrink-0 flex-col items-center gap-2 self-center rounded-lg border border-border bg-card p-3">
                <QRCodeSVG value={qr.qr} size={168} level="M" includeMargin title="Bir martalik Vimi login QR kodi" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{secondsLeft} soniya qoldi</span>
                  <button type="button" onClick={() => setQr(null)} aria-label="QR kodni yopish" className="rounded p-1 hover:bg-secondary hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {sessionError && <p role="alert" className="text-sm text-destructive">{sessionError}</p>}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Faol qurilmalar</h3>
            {loadingSessions ? (
              <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda</div>
            ) : sessions.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">Faol qurilmalar topilmadi.</p>
            ) : (
              <ul className="divide-y divide-border">
                {sessions.map((session) => (
                  <li key={session.id} className="flex items-center gap-3 py-3">
                    <MonitorSmartphone className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{session.device_name}{session.isCurrent ? " · Joriy qurilma" : ""}</p>
                      <p className="text-xs text-muted-foreground">Oxirgi faollik: {new Date(session.last_seen_at).toLocaleString()}</p>
                    </div>
                    {!session.isCurrent && (
                      <button type="button" onClick={() => onRevokeSession(session.id)} disabled={!!busyAction} aria-label={`${session.device_name} sessiyasini bekor qilish`} title="Sessiyani bekor qilish" className="rounded p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50">
                        {busyAction === session.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      <ConfirmDialog
        open={confirmRevokeOthers}
        onOpenChange={setConfirmRevokeOthers}
        title="Boshqa qurilmalardan chiqilsinmi?"
        description="Joriy qurilmadan tashqari barcha faol sessiyalar bekor qilinadi."
        confirmText="Barchasidan chiqarish"
        destructive
        onConfirm={() => {
          setConfirmRevokeOthers(false);
          onRevokeOthers();
        }}
      />

      <SettingsList>
        <SettingsRow icon={RefreshCw} label="Sotuvchi rejimiga o'tish" onClick={() => navigate("/seller")} />
      </SettingsList>

      <SettingsList>
        <SettingsRow icon={LogOut} label="Chiqish" destructive onClick={() => logout()} />
      </SettingsList>
    </div>
  );
}