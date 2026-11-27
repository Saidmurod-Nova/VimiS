import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ArrowLeft, CheckCheck, Home } from "lucide-react";
import { DemoNotice } from "@/components/courier/CourierUI";
import { useCourierDemo } from "@/lib/CourierDemoContext";

const navigation = [
  { to: "/courier", label: "Bosh menyu", icon: Home, end: true },
  { to: "/courier/completed", label: "Tugatilgan buyurtmalar", icon: CheckCheck },
];

function NavigationLink({ item, selected }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={() => `group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
        selected
              ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      <Icon className={`h-[18px] w-[18px] shrink-0 ${selected ? "text-indigo-600 dark:text-indigo-300" : ""}`} aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {selected && <span className="h-5 w-0.5 rounded-full bg-indigo-600 dark:bg-indigo-300" aria-hidden="true" />}
    </NavLink>
  );
}

export default function CourierLayout() {
  const { pathname } = useLocation();
  const { isSupabaseBacked } = useCourierDemo();
  const isCompleted = pathname.startsWith("/courier/completed");
  const isHome = !isCompleted;
  const title = isCompleted ? "Tugatilgan buyurtmalar" : isHome ? "Bosh menyu" : "Buyurtma tafsilotlari";

  return (
    <div className="courier-mode min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex h-[76px] items-center gap-3 border-b border-sidebar-border px-6">
          <img src="/vimis-logo.svg" alt="VimiS" className="h-7 w-auto" />
          <span className="h-6 w-px bg-border" />
          <span className="text-sm font-semibold">Kuryerlik</span>
        </div>
        <nav aria-label="Kuryer navigatsiyasi" className="flex-1 space-y-1 px-3 pt-5">
          {navigation.map((item) => <NavigationLink key={item.to} item={item} selected={item.end ? isHome : isCompleted} />)}
        </nav>

        <div className="space-y-3 border-t border-border p-4">
          <Link to="/" className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />Oddiy rejimga qaytish
          </Link>
          <p className="text-center text-[10px] text-muted-foreground">VimiS Kuryer · {isSupabaseBacked ? "Supabase" : "Demo"}</p>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[252px]">
        <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <div className="lg:hidden">
                <img src="/vimis-logo.svg" alt="VimiS" className="h-6 w-auto" />
              </div>
              <span className="hidden text-sm font-medium text-muted-foreground sm:inline lg:hidden">/</span>
              <p className="truncate text-sm font-semibold sm:text-base">{title}</p>
              <span className="hidden rounded-md bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary sm:inline-flex">{isSupabaseBacked ? "SUPABASE" : "DEMO"}</span>
            </div>
            <Link to="/" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground sm:text-sm">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /><span>Oddiy rejimga qaytish</span>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 pb-28 pt-5 sm:px-7 sm:pt-7 lg:pb-10">
          <div className="mb-5"><DemoNotice /></div>
          <Outlet />
        </main>
      </div>

      <nav aria-label="Courier mobil navigatsiyasi" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-stretch justify-around px-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const selected = item.end ? isHome : isCompleted;
            return (
              <NavLink key={item.to} to={item.to} end={item.end}
                    className={`relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[10px] font-medium transition ${selected ? "text-primary" : "text-muted-foreground"}`}
              >
                {selected && <span className="absolute top-0 h-0.5 w-7 rounded-full bg-primary" aria-hidden="true" />}
                <Icon className="h-[19px] w-[19px]" aria-hidden="true" />
                <span className="max-w-full truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
