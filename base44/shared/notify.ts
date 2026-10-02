// Best-effort in-app notification creation. Failures are swallowed so a
// notification issue never affects the order transaction that triggers it,
// and never produces duplicate orders or status transitions.

export async function notify(base44, userId, { title, body, type, related_id }) {
  try {
    await base44.asServiceRole.entities.Notification.create({
      user_id: userId,
      title: title || "",
      body: body || "",
      type: type || "order",
      related_id: related_id || null,
      read: false
    });
  } catch {}
}