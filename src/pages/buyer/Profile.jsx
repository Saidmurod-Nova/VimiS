import React from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Pencil, MapPinned, Briefcase, RefreshCw, LogOut } from "lucide-react";
import Avatar from "@/components/vimi/Avatar";
import { SettingsList, SettingsRow } from "@/components/vimi/SettingsList";
import { useAuth } from "@/lib/AuthContext";
import { useBuyer } from "@/lib/BuyerContext";

export default function Profile() {
  const { user, logout } = useAuth();
  const { selectedLocation, setLocation } = useBuyer();
  const navigate = useNavigate();
  const locLabel = selectedLocation?.city || selectedLocation?.region || "Joylashuv tanlanmagan";

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
        <SettingsRow icon={Pencil} label="Profilni tahrirlash" onClick={() => {}} />
        <SettingsRow icon={MapPinned} label="Manzillar" onClick={() => {}} />
        <SettingsRow icon={Briefcase} label="Mening bizneslarim" onClick={() => {}} />
      </SettingsList>

      <SettingsList>
        <SettingsRow icon={RefreshCw} label="Sotuvchi rejimiga o'tish" onClick={() => navigate("/seller")} />
      </SettingsList>

      <SettingsList>
        <SettingsRow icon={LogOut} label="Chiqish" destructive onClick={() => logout()} />
      </SettingsList>
    </div>
  );
}