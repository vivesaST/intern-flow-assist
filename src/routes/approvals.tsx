import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useRole } from "@/lib/role-context";
import { toast } from "sonner";
import { AttachmentGallery } from "@/components/attachment-gallery";
import { CommentThread } from "@/components/comment-thread";

type LogStatus = "draft" | "submitted" | "approved" | "revision";
type Entry = {
  id: string;
  week: number;
  entry_date: string;
  hours: number;
  title: string;
  activities: string | null;
  skills: string[] | null;
  status: LogStatus;
  attachments: string[] | null;
  feedback: string | null;
  student_id: string;
  student?: { full_name: string | null; email: string | null } | null;
};

export const Route = createFileRoute("/approvals")({
  head: () => ({ meta: [{ title: "Approvals · SIMS" }] }),
  component: ApprovalsPage,
});

function StatusBadge({ s }: { s: LogStatus }) {
  const map = {
    approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
    submitted: "bg-blue-100 text-blue-700 border-blue-200",
    revision: "bg-amber-100 text-amber-700 border-amber-200",
    draft: "bg-muted text-muted-foreground",
  } as const;
  return <Badge variant="outline" className={map[s]}>{s}</Badge>;
}

function ApprovalsPage() {
  const { user, loading: authLoading } = useAuth();
  const { role } = useRole();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [feedback, setFeedback] = useState("");
  const [filter, setFilter] = useState<LogStatus | "all">("submitted");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  const isReviewer = role === "academic" || role === "industry" || role === "admin";

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("log_entries")
      .select("id, week, entry_date, hours, title, activities, skills, status, attachments, feedback, student_id")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as Entry[];
    const ids = Array.from(new Set(rows.map((r) => r.student_id)));
    if (ids.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ids);
      const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
      rows.forEach((r) => {
        const p = map.get(r.student_id);
        if (p) r.student = { full_name: p.full_name, email: p.email };
      });
    }
    setEntries(rows);
    setLoading(false);
  };

  useEffect(() => {
    if (user && isReviewer) load();
  }, [user, isReviewer]);

  useEffect(() => {
    setFeedback(selected?.feedback ?? "");
  }, [selected]);

  const act = async (status: LogStatus) => {
    if (!selected || !user) return;
    setActing(true);
    const { error } = await supabase
      .from("log_entries")
      .update({
        status,
        feedback: feedback.trim() || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", selected.id);
    setActing(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "approved" ? "Entry approved" : "Revision requested");
    setSelected(null);
    load();
  };

  if (!authLoading && user && !isReviewer) {
    return (
      <AppShell>
        <PageHeader title="Approvals" description="Restricted to supervisors and admins." />
        <Card><CardContent className="p-6 text-sm text-muted-foreground">You don't have access to this page.</CardContent></Card>
      </AppShell>
    );
  }

  const filtered = filter === "all" ? entries : entries.filter((e) => e.status === filter);

  return (
    <AppShell>
      <PageHeader
        title="Logbook Approvals"
        description="Review student logbook entries — approve, request revisions, and leave feedback."
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-4">
        <TabsList>
          <TabsTrigger value="submitted">Pending ({entries.filter(e => e.status === "submitted").length})</TabsTrigger>
          <TabsTrigger value="revision">Revision ({entries.filter(e => e.status === "revision").length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({entries.filter(e => e.status === "approved").length})</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader><CardTitle>Entries</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Nothing here.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Week</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id} className="cursor-pointer" onClick={() => setSelected(e)}>
                    <TableCell className="font-medium">{e.student?.full_name ?? e.student?.email ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">W{e.week}</TableCell>
                    <TableCell>{e.entry_date}</TableCell>
                    <TableCell>{e.title}</TableCell>
                    <TableCell>{e.hours}</TableCell>
                    <TableCell><StatusBadge s={e.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Week {selected.week} · {selected.title}</DialogTitle>
                <DialogDescription>
                  {selected.student?.full_name ?? selected.student?.email} · {selected.entry_date} · {selected.hours} hours
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase mb-1">Activities</div>
                  <p className="text-sm whitespace-pre-wrap">{selected.activities}</p>
                </div>
                {selected.skills && selected.skills.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground uppercase mb-1">Skills</div>
                    <div className="flex gap-2 flex-wrap">
                      {selected.skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                    </div>
                  </div>
                )}
                {selected.attachments && selected.attachments.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground uppercase mb-2">Attachments</div>
                    <AttachmentGallery paths={selected.attachments} />
                  </div>
                )}
                <div>
                  <div className="text-xs text-muted-foreground uppercase mb-2">Feedback to student</div>
                  <Textarea
                    rows={3}
                    placeholder="Optional note — shown to the student."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2 border-t">
                  <Button
                    variant="outline"
                    disabled={acting}
                    onClick={() => act("revision")}
                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    Request revision
                  </Button>
                  <Button disabled={acting} onClick={() => act("approved")}>
                    Approve
                  </Button>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase mb-2">Discussion</div>
                  <CommentThread entryId={selected.id} />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}