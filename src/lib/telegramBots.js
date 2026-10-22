import { requireSupabase } from "@/lib/supabase";

export async function createTelegramLink(botType) {
  if (botType !== "buyer" && botType !== "seller") {
    throw new Error("Telegram bot turi noto'g'ri.");
  }

  const client = requireSupabase();
  const { data, error } = await client.functions.invoke("telegram-link-token", {
    body: { bot_type: botType },
  });
  if (error) throw new Error(error.message || "Telegram havolasini yaratib bo'lmadi.");
  if (
    data?.bot_type !== botType ||
    typeof data.bot_url !== "string" ||
    typeof data.expires_at !== "string"
  ) {
    throw new Error("Telegram havolasi javobi noto'g'ri.");
  }
  return data;
}
