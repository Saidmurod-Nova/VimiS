import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Marks the current user's notification(s) as read. Ownership is verified
// server-side: a user can touch only their own notifications. Supports a
// single notification_id or all unread at once. Notification creation is
// admin-only by RLS, so this runs as service role after an explicit
// user_id check.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { notification_id, all } = body || {};
    const now = new Date().toISOString();

    if (all) {
      await base44.asServiceRole.entities.Notification.updateMany(
        { user_id: user.id, read: false },
        { $set: { read: true, read_at: now } }
      );
      return Response.json({ ok: true });
    }

    if (!notification_id) {
      return Response.json({ error: 'notification_id yoki all majburiy' }, { status: 400 });
    }
    const n = await base44.asServiceRole.entities.Notification.get(notification_id).catch(() => null);
    if (!n) return Response.json({ error: 'Bildirishnoma topilmadi' }, { status: 404 });
    if (n.user_id !== user.id) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });

    const updated = await base44.asServiceRole.entities.Notification.update(notification_id, {
      read: true,
      read_at: now,
    });
    return Response.json({ ok: true, notification: updated });
  } catch (error) {
    return Response.json({ error: error.message || 'Yangilanmadi' }, { status: error.status || 500 });
  }
}