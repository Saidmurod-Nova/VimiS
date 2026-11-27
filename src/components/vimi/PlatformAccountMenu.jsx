import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeftRight, Bell, Bike, BriefcaseBusiness, LogIn, LogOut, Moon, PackageCheck, Plus, Settings, Sun, User, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { useBusiness } from "@/lib/BusinessContext";
import { useTheme } from "@/lib/ThemeContext";
import Avatar from "@/components/vimi/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PlatformAccountMenu({ experience }) {
  const { user, logout } = useAuth();
  const { businesses } = useBusiness();
  const { theme, toggleTheme } = useTheme();
  const isBusiness = experience === "business";
  const displayName = user?.full_name || user?.email || "Profil";
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      toast.error(error?.message || "Hisobdan chiqib bo‘lmadi. Qayta urinib ko‘ring.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Hisob menyusini ochish"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full focus-visible:outline-none"
        >
          <Avatar src={user?.avatar} name={displayName} size={38} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="liquid-surface w-72 rounded-2xl p-2">
        <DropdownMenuLabel className="truncate px-3 py-2 text-sm font-semibold">{user ? displayName : "Hisob"}</DropdownMenuLabel>
        {user?.email && user.full_name && (
          <p className="truncate px-2 pb-1 text-xs text-muted-foreground">{user.email}</p>
        )}
        <DropdownMenuSeparator />
        {!user ? (
          <>
            <DropdownMenuItem asChild>
              <Link to="/login">
                <LogIn aria-hidden="true" />
                Kirish
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/register">
                <UserPlus aria-hidden="true" />
                Ro‘yxatdan o‘tish
              </Link>
            </DropdownMenuItem>
          </>
        ) : isBusiness ? (
          <DropdownMenuItem asChild>
            <Link to="/">
              <BriefcaseBusiness aria-hidden="true" />
              Marketplace’ga o‘tish
            </Link>
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link to="/notifications">
                <Bell aria-hidden="true" />
                Bildirishnomalar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/profile">
                <User aria-hidden="true" />
                Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/orders">
                <PackageCheck aria-hidden="true" />
                Buyurtmalarim
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <Settings aria-hidden="true" />
                Sozlamalar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/courier">
                <Bike aria-hidden="true" />
                Kuryerlik rejimi
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/business">
                <BriefcaseBusiness aria-hidden="true" />
                Bizneslarim
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/business/new">
                <Plus aria-hidden="true" />
                Biznes yaratish
              </Link>
            </DropdownMenuItem>
            {businesses.length > 0 && (
              <DropdownMenuItem asChild>
                <Link to="/business">
                  <ArrowLeftRight aria-hidden="true" />
                  Business Console’ga o‘tish
                </Link>
              </DropdownMenuItem>
            )}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={toggleTheme}>
          {theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          {theme === "dark" ? "Yorug‘ mavzu" : "Qorong‘i mavzu"}
        </DropdownMenuItem>
        {user && (
          <DropdownMenuItem onSelect={handleLogout}>
            <LogOut aria-hidden="true" />
            Hisobdan chiqish
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
