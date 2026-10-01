import React from "react";
import { useNavigate } from "react-router-dom";
import { Store, RefreshCw, LogOut, Briefcase, Bell } from "lucide-react";
import Avatar from "@/components/vimi/Avatar";
import { SettingsList, SettingsRow } from "@/components/vimi/SettingsList";
import { useAuth } from "@/lib/AuthContext";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
        <SettingsRow icon={Store} label="Bizneslarim" onClick={() => {}} />
        <SettingsRow icon={Briefcase} label="Filiallar" onClick={() => {}} />
        <SettingsRow icon={Bell} label="Bildirishnomalar" onClick={() => {}} />
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