import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/role-context";
import { toast } from "sonner";

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setItems((data ?? []) as AppNotification[]);
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    load();
    const channel = supabase
      .channel(`notifications_${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as AppNotification;
          setItems((prev) => [n, ...prev]);
          toast(n.title, { description: n.body ?? undefined });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, load]);

  const unread = items.filter((i) => !i.read).length;

  const markAllRead = useCallback(async () => {
    if (!user || unread === 0) return;
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  }, [user?.id, unread]);

  return { items, unread, markAllRead, reload: load };
}
