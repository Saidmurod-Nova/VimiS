import React from "react";
import { Moon, Sun } from "lucide-react";
import VimiLogo from "@/components/vimi/VimiLogo";
import { useTheme } from "@/lib/ThemeContext";

export default function AuthLayout({ title, subtitle, footer, children }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <main className="auth-shell min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(500px,0.92fr)]">
        <section className="relative flex min-h-[210px] flex-col justify-between overflow-hidden bg-[#1f4938] px-5 py-5 text-white sm:min-h-[250px] sm:px-10 sm:py-8 md:sticky md:top-0 md:h-screen md:min-h-screen md:px-12 md:py-12 xl:px-16 xl:py-16">
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1800&q=88"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[#102e24]/75" />
          <div className="relative z-10 flex items-center gap-3 text-sm font-semibold text-white/90">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-white/30 bg-white/10 text-lg font-bold">V</span>
            VireonSpes <span className="font-normal text-white/60">/</span> Yaqin bozor
          </div>
          <div className="relative z-10 mx-auto w-full max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#c8dfb2]">Mahalliy do‘konlar, bitta manzilda</p>
            <h2 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl xl:text-5xl">Bozor yaqin. Kun yengil.</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/75">Marketplace’dan xarid qiling yoki shu hisob orqali o‘z biznesingizni boshqaring.</p>
          </div>
        </section>

        <section className="flex min-h-screen w-full items-start justify-center bg-background px-5 py-8 sm:px-10 md:items-center md:px-12 md:py-12 xl:px-20">
          <div className="w-full max-w-[440px] animate-fade-in">
            <div className="mb-8 flex items-start justify-between gap-4">
              <VimiLogo showTagline />
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Yorug‘ mavzuga o‘tish" : "Qorong‘i mavzuga o‘tish"}
                title={theme === "dark" ? "Yorug‘ mavzu" : "Qorong‘i mavzu"}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
            <div className="surface-card w-full p-5 sm:p-7">
              <header className="mb-7">
                <h1 className="text-3xl font-display font-semibold tracking-normal text-foreground sm:text-4xl">{title}</h1>
                {subtitle && <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>}
              </header>
              {children}
            </div>
            {footer && <p className="mt-6 text-left text-sm text-muted-foreground">{footer}</p>}
          </div>
        </section>
      </div>
    </main>
  );
}