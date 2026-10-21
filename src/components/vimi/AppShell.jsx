import React, { useState } from "react";
import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { Home, ShoppingBag, User, Package, Store, RefreshCw, LayoutGrid, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import AppHeader from "./AppHeader";

const buyerNav = [
  { to: "/", label: "Bosh sahifa", icon: Home },
  { to: "/catalog", label: "Katalog", icon: LayoutGrid },
  { to: "/orders", label: "Buyurtmalar", icon: ShoppingBag },
  { to: "/profile", label: "Profil", icon: User },
];

const sellerNav = [
  { to: "/seller", label: "Bosh sahifa", icon: Store },
  { to: "/seller/products", label: "Mahsulotlar", icon: Package },
  { to: "/seller/orders", label: "Buyurtmalar", icon: ShoppingBag },
  { to: "/seller/profile", label: "Profil", icon: User },
];

function isActive(pathname, to) {
  return pathname === to || (to !== "/" && to !== "/seller" && pathname.startsWith(to + "/"));
}

function NavItem({ to, label, icon: Icon, active }) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <Icon className="w-5 h-5" aria-hidden="true" />
      {label}
    </Link>
  );
}

function MobileNavItem({ to, label, icon: Icon, active }) {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-medium transition",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      <Icon className="w-5 h-5" aria-hidden="true" />
      {label}
    </Link>
  );
}

function ModeSwitcher({ isSeller }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(isSeller ? "/" : "/seller")}
      className="mt-auto flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 text-left transition active:scale-[0.99]"
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <RefreshCw className="w-4 h-4" aria-hidden="true" />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-medium text-foreground">{isSeller ? "Xaridorga o'tish" : "Sotuvchiga o'tish"}</span>
        <span className="block text-xs text-muted-foreground">{isSeller ? "Buyurtma berish rejimi" : "Biznesni boshqarish"}</span>
      </span>
    </button>
  );
}

export default function AppShell() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isSeller = pathname.startsWith("/seller");
  const baseNav = isSeller ? sellerNav : buyerNav;
  const nav = user?.role === "admin" ? [{ to: "/admin", label: "Admin", icon: ShieldCheck }, ...baseNav] : baseNav;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-sidebar/40 px-4 py-6 transition-transform duration-200 lg:flex",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )} aria-hidden={!isSidebarOpen} inert={!isSidebarOpen}>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <NavItem key={item.to} {...item} active={isActive(pathname, item.to)} />
          ))}
        </nav>
        <ModeSwitcher isSeller={isSeller} />
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-2 lg:hidden">
        <div className="glass-nav mx-auto flex max-w-md items-center justify-around rounded-2xl px-2 py-1.5 shadow-lg shadow-black/5">
          {nav.map((item) => (
            <MobileNavItem key={item.to} {...item} active={isActive(pathname, item.to)} />
          ))}
        </div>
      </nav>

      <main className={cn("transition-[padding] duration-200", isSidebarOpen ? "lg:pl-64" : "lg:pl-0")}>
        <AppHeader
          isSeller={isSeller}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        />
        <div className="mx-auto max-w-3xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
}