// Idempotent in-app notification creation. When `event_key` is provided, a
// notification for the same (user_id, event_key) is created at most once, so
// repeated taps, retries, or replays never produce duplicate notifications.
// Failures are swallowed so a notification issue never affects the order
// transaction that triggers it, and never produces duplicate orders or
// status transitions.

export async function notify(base44, userId, { title, body, type, related_id, event_key }) {
  try {
    if (event_key) {
      const existing = await base44.asServiceRole.entities.Notification.filter({
        user_id: userId,
        event_key,
      });
      if (existing && existing.length > 0) return;
    }
    await base44.asServiceRole.entities.Notification.create({
      user_id: userId,
      title: title || "",
      body: body || "",
      type: type || "order",
      related_id: related_id || null,
      event_key: event_key || null,
      read: false,
      read_at: null,
    });
  } catch {}
}