import { requireSupabase } from "@/lib/supabase";

async function invokeSessionAction(action, payload = {}) {
  const { data, error } = await requireSupabase().functions.invoke("qr-session", {
    body: { action, ...payload },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export function createLoginQr() {
  return invokeSessionAction("create-qr");
}

export function consumeLoginQr(id, secret) {
  return invokeSessionAction("consume-qr", { id, secret });
}

export function registerCurrentSession(refreshToken) {
  const userAgent = navigator.userAgent;
  const deviceName = /Android|iPhone|iPad|Mobile/i.test(userAgent) ? "Mobil qurilma" : "Kompyuter";
  return invokeSessionAction("register-session", { refreshToken, deviceName });
}

export function listUserSessions() {
  return invokeSessionAction("list-sessions");
}

export function revokeUserSession(sessionId) {
  return invokeSessionAction("revoke-session", { sessionId });
}

export function revokeOtherUserSessions() {
  return invokeSessionAction("revoke-other-sessions");
}