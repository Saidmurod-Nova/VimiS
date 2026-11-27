import React, { useState } from "react";
import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import {
  BarChart3,
  BriefcaseBusiness,
  Home,
  LayoutDashboard,
  LayoutGrid,
  Package,
  Plus,
  RefreshCw,
  Settings,
  ShoppingBag,
  Store,
  User,
  Wrench,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useBusiness } from "@/lib/BusinessContext";
import AppHeader from "./AppHeader";

const marketplaceNav = [
  { to: "/", label: "Bosh sahifa", icon: Home },
  { to: "/catalog", label: "Mahsulotlar", icon: Package },
  { to: "/services", label: "Xizmatlar", icon: Wrench },
  { to: "/categories", label: "Kategoriyalar", icon: LayoutGrid },
];

const accountNav = [
  { to: "/profile", label: "Profil", icon: User },
  { to: "/orders", label: "Buyurtmalarim", icon: ShoppingBag },
  { to: "/settings", label: "Sozlamalar", icon: Settings },
];

function isActive(pathname, to) {
  return pathname === to || (to !== "/" && to !== "/seller" && pathname.startsWith(to + "/"));
}

function NavItem({ to, label, icon: Icon, active, onNavigate }) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
        active ? "bg-sidebar-accent text-[#d9e8a7]" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
      )}
    >
      <Icon className="w-5 h-5" aria-hidden="true" />
      {label}
    </Link>
  );
}

function MobileNavItem({ to, label, icon: Icon, active }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <Link
      to={to}
      className={cn(
        "relative isolate flex flex-1 flex-col items-center gap-1 rounded-full px-1 py-1.5 text-[11px] font-medium transition-colors",
        active ? "text-primary-foreground" : "text-muted-foreground"
      )}
    >
      {active && (
        <motion.span
          layoutId="workspace-mobile-active-tab"
          className="absolute inset-0 z-0 rounded-full bg-primary"
          transition={{ type: "spring", stiffness: 420, damping: 34, duration: shouldReduceMotion ? 0 : undefined }}
          aria-hidden="true"
        />
      )}
      <Icon className="relative z-10 w-5 h-5" aria-hidden="true" />
      <span className="relative z-10">{label}</span>
    </Link>
  );
}

function ModeSwitcher({ isSeller, hasBusiness, onNavigate }) {
  const navigate = useNavigate();
  const destination = isSeller ? "/" : hasBusiness ? "/seller" : "/seller/businesses/new";
  return (
    <button
      type="button"
      onClick={() => {
        navigate(destination);
        onNavigate?.();
      }}
      className="mt-auto flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/50 px-3 py-3 text-left transition hover:bg-sidebar-accent active:scale-[0.99]"
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-accent text-[#d9e8a7]">
        <RefreshCw className="w-4 h-4" aria-hidden="true" />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-medium text-sidebar-foreground">
          {isSeller ? "Xaridorga o‘tish" : hasBusiness ? "Biznes boshqaruvi" : "Biznes yaratish"}
        </span>
        <span className="block text-xs text-sidebar-foreground/60">
          {isSeller ? "Marketplace tajribasiga qaytish" : hasBusiness ? "Ish maydoningizni ochish" : "Platformada biznes boshlash"}
        </span>
      </span>
    </button>
  );
}

export default function AppShell() {
  const { pathname } = useLocation();
  const { businesses, loading: businessesLoading } = useBusiness();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const isSeller = pathname.startsWith("/seller");
  const hasBusiness = businesses.length > 0;
  const businessNav = [
    { to: "/seller/businesses", label: "Bizneslarim", icon: BriefcaseBusiness },
    { to: "/seller/businesses/new", label: "Biznes yaratish", icon: Plus },
    ...(hasBusiness && !businessesLoading
      ? [
          { to: "/seller", label: "Biznes boshqaruvi", icon: LayoutDashboard },
          { to: "/seller/products", label: "Mahsulotlar", icon: Package },
          { to: "/seller/orders", label: "Biznes buyurtmalari", icon: ShoppingBag },
          { to: "/seller/statistics", label: "Statistika", icon: BarChart3 },
          { to: "/seller/profile", label: "Biznes profili", icon: Store },
        ]
      : []),
  ];
  const groups = [
    { label: "Marketplace", items: marketplaceNav },
    { label: "Biznes", items: businessNav },
    { label: "Hisob", items: accountNav },
  ];
  const mobileNav = isSeller
    ? hasBusiness && !businessesLoading
      ? [
          { to: "/seller", label: "Boshqaruv", icon: LayoutDashboard },
          { to: "/seller/products", label: "Mahsulotlar", icon: Package },
          { to: "/seller/orders", label: "Buyurtmalar", icon: ShoppingBag },
          { to: "/seller/profile", label: "Profil", icon: User },
        ]
      : [
          { to: "/seller/businesses", label: "Bizneslarim", icon: BriefcaseBusiness },
          { to: "/seller/businesses/new", label: "Yaratish", icon: Plus },
          { to: "/profile", label: "Profil", icon: User },
        ]
    : [
        { to: "/", label: "Bosh sahifa", icon: Home },
        { to: "/catalog", label: "Mahsulotlar", icon: Package },
        { to: "/orders", label: "Buyurtmalar", icon: ShoppingBag },
        { to: "/profile", label: "Profil", icon: User },
      ];

  return (
    <div className="app-workspace min-h-screen text-foreground">
      {isMobileNavOpen && (
        <button
          type="button"
          aria-label="Navigatsiyani yopish"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 text-sidebar-foreground transition-transform duration-200 lg:z-40 lg:w-64 lg:flex",
          isMobileNavOpen ? "flex translate-x-0" : "hidden -translate-x-full",
          isSidebarOpen ? "lg:translate-x-0" : "lg:-translate-x-full"
        )}
        aria-hidden={!isMobileNavOpen && !isSidebarOpen}
        inert={!isMobileNavOpen && !isSidebarOpen}
      >
        <div className="mb-6 flex items-center justify-between gap-3 px-2 py-2">
          <Link
            to={isSeller ? "/seller" : "/"}
            className="min-w-0"
            onClick={() => setIsMobileNavOpen(false)}
          >
            <span className="block truncate text-base font-semibold text-white">VireonSpes</span>
            <span className="block text-[11px] text-sidebar-foreground/60">Marketplace &amp; Business</span>
          </Link>
          <button
            type="button"
            aria-label="Navigatsiyani yopish"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground hover:bg-sidebar-accent lg:hidden"
            onClick={() => setIsMobileNavOpen(false)}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <nav aria-label="Asosiy navigatsiya" className="flex-1 space-y-5 overflow-y-auto">
          {groups.map((group) => (
            <section key={group.label}>
              <h2 className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/50">
                {group.label}
              </h2>
              <div className="flex flex-col gap-1">
                {group.items.map((item) => (
                  <NavItem
                    key={item.to}
                    {...item}
                    active={isActive(pathname, item.to)}
                    onNavigate={() => setIsMobileNavOpen(false)}
                  />
                ))}
              </div>
            </section>
          ))}
        </nav>
        <ModeSwitcher
          isSeller={isSeller}
          hasBusiness={hasBusiness}
          onNavigate={() => setIsMobileNavOpen(false)}
        />
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-2 lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around rounded-full border border-border bg-card/95 px-2 py-1.5 shadow-lg shadow-black/5 backdrop-blur">
          {mobileNav.map((item) => (
            <MobileNavItem key={item.to} {...item} active={isActive(pathname, item.to)} />
          ))}
        </div>
      </nav>

      <main className={cn("transition-[padding] duration-200", isSidebarOpen ? "lg:pl-64" : "lg:pl-0")}>
        <AppHeader
          isSeller={isSeller}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
          onToggleMobileNav={() => setIsMobileNavOpen((open) => !open)}
          isMobileNavOpen={isMobileNavOpen}
        />
        <div className="mx-auto w-full max-w-[1600px] px-4 pb-28 pt-6 sm:px-7 lg:px-10 lg:pb-12 lg:pt-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}