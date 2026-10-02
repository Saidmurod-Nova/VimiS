import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

// Floating glass notification bell with a live unread badge. RLS scopes
// Notification reads to the current user, so filtering { read: false } returns
// only the user's own unread count. A realtime subscription keeps the badge
// fresh without manual refresh.
export default function NotificationBell() {
  const [unread, setUnread] = useState(0);

  const load = async () => {
    try {
      const list = await base44.entities.Notification.filter({ read: false });
      setUnread((list || []).length);
    } catch {}
  };

  useEffect(() => {
    load();
    let unsub;
    try {
      unsub = base44.entities.Notification.subscribe(() => load());
    } catch {}
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  return (
    <Link
      to="/notifications"
      aria-label="Bildirishnomalar"
      className="glass fixed right-4 top-4 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground shadow-lg shadow-black/5 transition active:scale-95"
    >
      <Bell className="h-5 w-5" />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}