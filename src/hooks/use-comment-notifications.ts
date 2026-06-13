import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/role-context";
import { toast } from "sonner";

export function useCommentNotifications() {
  const { user, role } = useAuth();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`log_comments_notify_${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "log_comments" },
        async (payload) => {
          const c = payload.new as { author_id: string; entry_id: string; body: string };
          if (c.author_id === user.id) return;

          // Check if user should be notified for this entry
          const { data: entry } = await supabase
            .from("log_entries")
            .select("student_id, title, week")
            .eq("id", c.entry_id)
            .maybeSingle();
          if (!entry) return;

          const isOwner = entry.student_id === user.id;
          const isStaff = role === "admin" || role === "academic" || role === "industry";
          if (!isOwner && !isStaff) return;

          const { data: author } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", c.author_id)
            .maybeSingle();
          const name = author?.full_name ?? author?.email ?? "Someone";

          toast.info(`New comment from ${name}`, {
            description: `On W${entry.week} · ${entry.title}: ${c.body.slice(0, 80)}${c.body.length > 80 ? "…" : ""}`,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, role]);
}