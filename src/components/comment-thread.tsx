import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/role-context";
import { toast } from "sonner";

type Comment = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  author?: { full_name: string | null; email: string | null } | null;
};

export function CommentThread({ entryId }: { entryId: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("log_comments")
      .select("id, author_id, body, created_at, author:profiles!log_comments_author_id_fkey(full_name, email)")
      .eq("entry_id", entryId)
      .order("created_at", { ascending: true });
    if (error) {
      // fallback without join if FK not declared
      const { data: d2 } = await supabase
        .from("log_comments")
        .select("id, author_id, body, created_at")
        .eq("entry_id", entryId)
        .order("created_at", { ascending: true });
      setComments((d2 as Comment[]) ?? []);
      return;
    }
    setComments((data as unknown as Comment[]) ?? []);
  };

  useEffect(() => {
    if (entryId) load();
  }, [entryId]);

  const post = async () => {
    if (!user || !body.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("log_comments").insert({
      entry_id: entryId,
      author_id: user.id,
      body: body.trim(),
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setBody("");
    load();
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <div className="text-xs text-muted-foreground">No comments yet.</div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="rounded-md border p-3 text-sm">
              <div className="text-xs text-muted-foreground mb-1">
                {c.author?.full_name ?? c.author?.email ?? "User"} ·{" "}
                {new Date(c.created_at).toLocaleString()}
              </div>
              <div className="whitespace-pre-wrap">{c.body}</div>
            </div>
          ))
        )}
      </div>
      <div className="space-y-2">
        <Textarea
          placeholder="Write a comment…"
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={post} disabled={loading || !body.trim()}>
            Post comment
          </Button>
        </div>
      </div>
    </div>
  );
}