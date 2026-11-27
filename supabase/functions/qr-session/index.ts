import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const publishableKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const publicClient = createClient(supabaseUrl, publishableKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

function getEncryptionKey() {
  const hex = Deno.env.get("VIMI_SESSION_ENCRYPTION_KEY") ?? "";
  if (!/^[a-f0-9]{64}$/i.test(hex)) throw new Error("Session encryption key is not configured.");
  return Uint8Array.from(hex.match(/.{2}/g)!, (byte) => Number.parseInt(byte, 16));
}

async function encrypt(value: string) {
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey("raw", getEncryptionKey(), "AES-GCM", false, ["encrypt"]);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, new TextEncoder().encode(value));
  return `${bytesToBase64(nonce)}.${bytesToBase64(new Uint8Array(ciphertext))}`;
}

async function decrypt(value: string) {
  const [noncePart, ciphertextPart] = value.split(".");
  if (!noncePart || !ciphertextPart) throw new Error("Invalid encrypted session credential.");
  const key = await crypto.subtle.importKey("raw", getEncryptionKey(), "AES-GCM", false, ["decrypt"]);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(noncePart) },
    key,
    base64ToBytes(ciphertextPart),
  );
  return new TextDecoder().decode(plaintext);
}

function decodeClaims(accessToken: string) {
  const payload = accessToken.split(".")[1];
  if (!payload) throw new Error("Invalid access token.");
  const normalized = payload.replaceAll("-", "+").replaceAll("_", "/");
  return JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")));
}

async function authenticate(request: Request) {
  const authorization = request.headers.get("Authorization") ?? "";
  const accessToken = authorization.replace(/^Bearer\s+/i, "");
  if (!accessToken) throw new Error("Authentication required.");
  const { data, error } = await admin.auth.getUser(accessToken);
  if (error || !data.user) throw new Error("Authentication required.");
  const claims = decodeClaims(accessToken);
  if (claims.sub !== data.user.id || !claims.session_id) throw new Error("Invalid session.");
  return { user: data.user, accessToken, sessionId: claims.session_id as string };
}

async function registerSession(request: Request, body: Record<string, unknown>) {
  const { user, sessionId } = await authenticate(request);
  if (typeof body.refreshToken !== "string" || body.refreshToken.length < 20) {
    return json({ error: "Session token noto'g'ri." }, 400);
  }
  const deviceName = typeof body.deviceName === "string" ? body.deviceName.trim().slice(0, 80) : "Qurilma";
  const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 240);
  const { error } = await admin.from("user_sessions").upsert({
    id: sessionId,
    user_id: user.id,
    device_name: deviceName || "Qurilma",
    user_agent: userAgent,
    refresh_token_ciphertext: await encrypt(body.refreshToken),
    last_seen_at: new Date().toISOString(),
    revoked_at: null,
  }, { onConflict: "id" });
  if (error) return json({ error: "Session ma'lumotini saqlab bo'lmadi." }, 500);
  return json({ ok: true });
}

async function listSessions(request: Request) {
  const { user, sessionId } = await authenticate(request);
  const { data, error } = await admin.from("user_sessions")
    .select("id,device_name,user_agent,created_at,last_seen_at")
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .order("last_seen_at", { ascending: false });
  if (error) return json({ error: "Sessionlarni yuklab bo'lmadi." }, 500);
  return json({ sessions: (data ?? []).map((session) => ({ ...session, isCurrent: session.id === sessionId })) });
}

async function revokeSession(request: Request, body: Record<string, unknown>) {
  const { user, sessionId } = await authenticate(request);
  if (typeof body.sessionId !== "string" || body.sessionId === sessionId) {
    return json({ error: "Joriy sessionni bu yerdan bekor qilib bo'lmaydi." }, 400);
  }

  const { data: session, error: lookupError } = await admin.from("user_sessions")
    .select("id,refresh_token_ciphertext")
    .eq("id", body.sessionId)
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .maybeSingle();
  if (lookupError || !session) return json({ error: "Session topilmadi." }, 404);

  const refreshToken = await decrypt(session.refresh_token_ciphertext);
  const { data: refreshed, error: refreshError } = await publicClient.auth.refreshSession({ refresh_token: refreshToken });
  if (refreshError || !refreshed.session) return json({ error: "Session yangilanmadi. Keyinroq qayta urinib ko'ring." }, 409);

  const { error: signOutError } = await admin.auth.admin.signOut(refreshed.session.access_token, "local");
  if (signOutError) {
    await admin.from("user_sessions").update({
      refresh_token_ciphertext: await encrypt(refreshed.session.refresh_token),
    }).eq("id", session.id).eq("user_id", user.id);
    return json({ error: "Sessionni bekor qilib bo'lmadi." }, 500);
  }

  await admin.from("user_sessions").update({
    revoked_at: new Date().toISOString(),
    refresh_token_ciphertext: "",
  }).eq("id", session.id).eq("user_id", user.id);
  return json({ ok: true });
}

async function revokeOtherSessions(request: Request) {
  const { user, accessToken, sessionId } = await authenticate(request);
  const { error } = await admin.auth.admin.signOut(accessToken, "others");
  if (error) return json({ error: "Boshqa sessionlarni bekor qilib bo'lmadi." }, 500);
  await admin.from("user_sessions").update({
    revoked_at: new Date().toISOString(),
    refresh_token_ciphertext: "",
  }).eq("user_id", user.id).neq("id", sessionId).is("revoked_at", null);
  return json({ ok: true });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const body = await request.json() as Record<string, unknown>;
    switch (body.action) {
      case "register-session": return await registerSession(request, body);
      case "list-sessions": return await listSessions(request);
      case "revoke-session": return await revokeSession(request, body);
      case "revoke-other-sessions": return await revokeOtherSessions(request);
      default: return json({ error: "Action not found." }, 400);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    const status = message === "Authentication required." ? 401 : 500;
    return json({ error: status === 401 ? "Kirish kerak." : "Serverda xatolik yuz berdi." }, status);
  }
});