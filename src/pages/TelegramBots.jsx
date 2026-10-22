import React, { useState } from "react";
import { ExternalLink, Loader2, MessageCircle, Send } from "lucide-react";
import { PrimaryButton } from "@/components/vimi/VimiButton";
import { isSupabaseConfigured, isSupabaseMode } from "@/lib/supabase";
import { createTelegramLink } from "@/lib/telegramBots";

const bots = [
  {
    type: "buyer",
    title: "Xaridor boti",
    description: "Shaxsiy buyurtmalaringiz va holat yangilanishlari.",
  },
  {
    type: "seller",
    title: "Sotuvchi boti",
    description: "Siz egalik qiladigan bizneslarning yangi buyurtmalari.",
  },
];

export default function TelegramBots() {
  const [links, setLinks] = useState({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const onCreateLink = async (type) => {
    setBusy(type);
    setError("");
    setLinks((current) => ({ ...current, [type]: null }));
    try {
      const link = await createTelegramLink(type);
      setLinks((current) => ({ ...current, [type]: link }));
    } catch (linkError) {
      setError(linkError?.message || "Telegram havolasini yaratib bo'lmadi.");
    } finally {
      setBusy("");
    }
  };

  if (!isSupabaseMode || !isSupabaseConfigured) {
    return (
      <section className="space-y-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Telegram botlari</h1>
        <p role="alert" className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Telegram bog'lash Supabase hisobiga kirilganida ishlaydi.
        </p>
      </section>
    );
  }

  return (
    <section className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Telegram botlari</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Hisobingizni kerakli botga xavfsiz bog'lang. Havola bir martalik va 10 daqiqada tugaydi.
        </p>
      </div>

      {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

      <div className="space-y-4">
        {bots.map((bot) => {
          const link = links[bot.type];
          const Icon = bot.type === "buyer" ? MessageCircle : Send;
          return (
            <article key={bot.type} className="space-y-4 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold">{bot.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{bot.description}</p>
                </div>
              </div>

              <PrimaryButton type="button" className="h-10" disabled={!!busy} onClick={() => onCreateLink(bot.type)}>
                {busy === bot.type && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {busy === bot.type ? "Havola yaratilmoqda..." : "Telegramni bog'lash"}
              </PrimaryButton>

              {link && (
                <div className="space-y-2 rounded-xl bg-secondary/60 p-3">
                  <p className="text-xs text-muted-foreground">
                    Amal qilish muddati: {new Date(link.expires_at).toLocaleTimeString()}
                  </p>
                  <a
                    href={link.bot_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary underline underline-offset-4"
                  >
                    Telegram botini ochish <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
