import React, { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BarChart3,
  BriefcaseBusiness,
  LayoutDashboard,
  Package,
  Users,
  Settings,
  ShoppingBag,
  Store,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import AppHeader from "@/components/vimi/AppHeader";
import VimiLogo from "@/components/vimi/VimiLogo";
import { useBusiness } from "@/lib/BusinessContext";
import { cn } from "@/lib/utils";

function ConsoleLink({ to, label, icon: Icon, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) => cn(
        "console-nav-link flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
        isActive ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label}
    </NavLink>
  );
}

function BusinessBottomTabNav({ items }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <nav aria-label="Biznes mobil navigatsiyasi" className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-2 lg:hidden">
      <div className="mx-auto flex max-w-xl items-stretch justify-around rounded-full border border-border bg-card/95 px-2 py-1.5 shadow-lg shadow-black/5 backdrop-blur">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => cn(
              "relative isolate flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-full px-1 text-[10px] font-medium transition-colors",
              isActive ? "text-primary-foreground" : "text-muted-foreground"
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="business-mobile-active-tab"
                    className="absolute inset-0 z-0 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 420, damping: 34, duration: shouldReduceMotion ? 0 : undefined }}
                    aria-hidden="true"
                  />
                )}
                <Icon className="relative z-10 h-5 w-5" aria-hidden="true" />
                <span className="relative z-10">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function currentSection(pathname, businessId) {
  const suffix = pathname.slice(`/business/${businessId}`.length).split("/").filter(Boolean);
  if (suffix[0] === "products") return suffix[1] === "categories" ? "Kategoriyalar" : "Mahsulotlar";
  if (suffix[0] === "orders") return "Buyurtmalar";
  if (suffix[0] === "customers") return "Mijozlar";
  if (suffix[0] === "analytics") return "Tahlillar";
  if (suffix[0] === "settings") return "Sozlamalar";
  if (suffix[0] === "branches") return "Filiallar";
  if (suffix[0] === "telegram") return "Telegram";
  return "Umumiy ko‘rinish";
}

export default function BusinessConsoleShell() {
  const { pathname } = useLocation();
  const { selectedBusiness } = useBusiness();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  if (!selectedBusiness) return null;

  const base = `/business/${selectedBusiness.id}`;
  const section = currentSection(pathname, selectedBusiness.id);
  const isOverview = pathname === base;
  const consoleItems = [
    { to: base, label: "Umumiy ko‘rinish", icon: LayoutDashboard, end: true },
    { to: `${base}/products`, label: "Mahsulotlar", icon: Package, end: true },
    { to: `${base}/products/categories`, label: "Kategoriyalar", icon: Store, end: true },
    { to: `${base}/orders`, label: "Buyurtmalar", icon: ShoppingBag },
    { to: `${base}/customers`, label: "Mijozlar", icon: Users },
    { to: `${base}/analytics`, label: "Tahlillar", icon: BarChart3 },
    { to: `${base}/settings`, label: "Biznes sozlamalari", icon: Settings },
  ];
  const mobileTabs = [
    { to: base, label: "Boshqaruv", icon: LayoutDashboard, end: true },
    { to: `${base}/products`, label: "Mahsulotlar", icon: Package },
    { to: `${base}/orders`, label: "Buyurtmalar", icon: ShoppingBag },
    { to: `${base}/settings`, label: "Sozlamalar", icon: Settings },
  ];

  return (
    <div className="business-console min-h-screen bg-background text-foreground">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Navigatsiyani yopish"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          "liquid-aside business-console-sidebar fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r px-3 py-4 text-sidebar-foreground transition-transform duration-200 lg:z-30",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          desktopSidebarOpen ? "lg:translate-x-0" : "lg:-translate-x-full"
        )}
        aria-label="Biznes ish maydoni navigatsiyasi"
        aria-hidden={!sidebarOpen && !desktopSidebarOpen}
        inert={!sidebarOpen && !desktopSidebarOpen}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-2 pb-4">
          <Link to={base} className="min-w-0" onClick={() => setSidebarOpen(false)}>
            <VimiLogo />
            <span className="mt-1 block text-[11px] text-sidebar-foreground/60">Biznes ish maydoni</span>
          </Link>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-sidebar-accent lg:hidden"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="business-brand-card mt-4 flex min-w-0 items-center gap-3 rounded-xl border p-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md bg-sidebar-accent">
            {selectedBusiness.logo_url
              ? <img src={selectedBusiness.logo_url} alt="" className="h-full w-full object-cover" />
              : <Store className="h-4 w-4 text-sidebar-foreground/70" aria-hidden="true" />}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{selectedBusiness.name}</span>
            <span className="block truncate text-xs text-sidebar-foreground/60">
              {selectedBusiness.category_name || selectedBusiness.store_id}
            </span>
          </span>
        </div>

        <nav aria-label="Biznes modullari" className="mt-5 flex-1 space-y-1 overflow-y-auto">
          <h2 className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/50">
            Ish maydoni
          </h2>
          {consoleItems.map((item) => (
            <ConsoleLink key={item.to} {...item} onClick={() => setSidebarOpen(false)} />
          ))}
        </nav>

        <Link
          to="/business"
          onClick={() => setSidebarOpen(false)}
          className="business-sidebar-action mt-4 flex min-h-10 items-center gap-3 rounded-xl border px-3 text-sm font-medium text-sidebar-foreground/75 transition hover:text-sidebar-foreground"
        >
          <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
          Bizneslarim
        </Link>
      </aside>

      <div className={cn("min-h-screen transition-[padding] duration-200", desktopSidebarOpen ? "lg:pl-[272px]" : "lg:pl-0")}>
        <AppHeader
          isSeller
          isSidebarOpen={desktopSidebarOpen}
          isMobileNavOpen={sidebarOpen}
          onToggleSidebar={() => setDesktopSidebarOpen((open) => !open)}
          onToggleMobileNav={() => setSidebarOpen((open) => !open)}
          showBusinessSelector
        />
        <main className="mx-auto w-full max-w-[1600px] px-4 pb-28 pt-5 sm:px-7 lg:px-10 lg:pb-10 lg:pt-6">
          <nav aria-label="Sahifa yo‘li" className="business-console-breadcrumb mb-5 flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm text-muted-foreground">
            <Link to="/business" className="shrink-0 hover:text-foreground">Bizneslarim</Link>
            <span aria-hidden="true">/</span>
            <Link to={base} className="max-w-[45vw] truncate font-medium text-foreground hover:text-primary">
              {selectedBusiness.name}
            </Link>
            {!isOverview && (
              <>
                <span aria-hidden="true">/</span>
                <span className="truncate">{section}</span>
              </>
            )}
          </nav>
          <div key={selectedBusiness.id}>
            <Outlet />
          </div>
        </main>
      </div>
      {!sidebarOpen && <BusinessBottomTabNav items={mobileTabs} />}
    </div>
  );
}
