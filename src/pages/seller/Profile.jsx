import React from "react";
import { useNavigate } from "react-router-dom";
import { Store, RefreshCw, LogOut, Briefcase, Bell, MapPinned, Settings, MessageCircle } from "lucide-react";
import Avatar from "@/components/vimi/Avatar";
import { SettingsList, SettingsRow } from "@/components/vimi/SettingsList";
import { useAuth } from "@/lib/AuthContext";
import { useBusiness } from "@/lib/BusinessContext";

export default function Profile() {
  const { user, logout } = useAuth();
  const { selectedBusiness } = useBusiness();
  const navigate = useNavigate();
  const openBusiness = (tab) => {
    if (!selectedBusiness) { navigate("/business"); return; }
    if (tab === "telegram") {
      navigate(`/business/${selectedBusiness.id}/telegram`);
      return;
    }
    navigate(`/business/${selectedBusiness.id}/settings${tab === "branches" ? "?tab=branches" : ""}`);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Sotuvchi profili</h1>

      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
        <Avatar name={user?.full_name || "Vimi seller"} src={user?.avatar} size={64} />
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-foreground">{user?.full_name || "Foydalanuvchi"}</h2>
          <p className="truncate text-sm text-muted-foreground">{user?.email || "—"}</p>
        </div>
      </div>

      <SettingsList>
        <SettingsRow icon={Store} label="Bizneslarim" onClick={() => navigate("/business")} />
        <SettingsRow icon={Briefcase} label="Filiallar" onClick={() => openBusiness("branches")} />
        <SettingsRow icon={MapPinned} label="Joylashuvlar" onClick={() => navigate("/locations", { state: { from: "/seller/profile" } })} />
        <SettingsRow icon={Settings} label="Biznes sozlamalari" onClick={() => openBusiness("settings")} />
        <SettingsRow icon={MessageCircle} label="Telegram botlari" onClick={() => openBusiness("telegram")} />
        <SettingsRow icon={Bell} label="Bildirishnomalar (tez orada)" />
      </SettingsList>

      <SettingsList>
        <SettingsRow icon={RefreshCw} label="Xaridor rejimiga o'tish" onClick={() => navigate("/")} />
      </SettingsList>

      <SettingsList>
        <SettingsRow icon={LogOut} label="Chiqish" destructive onClick={() => logout()} />
      </SettingsList>
    </div>
  );
}