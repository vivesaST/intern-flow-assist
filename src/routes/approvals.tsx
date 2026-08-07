import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
import { scopedStudentIds, displayName } from "@/lib/scope";
import { toast } from "sonner";
import { AttachmentGallery } from "@/components/attachment-gallery";
import { CommentThread } from "@/components/comment-thread";

type LogStatus = "draft" | "submitted" | "industry_approved" | "approved" | "revision";
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
  head: () => ({
    meta: [
      { title: "Logbook approvals · Smart Internship" },
      {
        name: "description",
        content:
          "Supervisors review the logbook entries of their own interns — industry approval first, then academic sign-off.",
      },
      { property: "og:title", content: "Logbook approvals · Smart Internship" },
      { property: "og:description", content: "Approve, query and comment on intern logbook submissions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ApprovalsPage,
});

const TONE: Record<LogStatus, string> = {
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  industry_approved: "bg-indigo-100 text-indigo-700 border-indigo-200",
  submitted: "bg-blue-100 text-blue-700 border-blue-200",
  revision: "bg-amber-100 text-amber-700 border-amber-200",
  draft: "bg-muted text-muted-foreground",
};

const LABEL: Record<LogStatus, string> = {
  approved: "approved",
  industry_approved: "awaiting academic",
  submitted: "awaiting industry",
  revision: "revision",
  draft: "draft",
};

function StatusBadge({ s }: { s: LogStatus }) {
  return <Badge variant="outline" className={TONE[s]}>{LABEL[s]}</Badge>;
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

  const isReviewer = role === "academic" || role === "industry" || role === "admin";

  // Industry signs off first, academic moderates afterwards.
  const myQueueStatus: LogStatus = role === "academic" ? "industry_approved" : "submitted";

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    setFilter(role === "academic" ? "industry_approved" : "submitted");
  }, [role]);

  const load = async () => {
    if (!user) return;
    setLoading(true);

    // Only students assigned to this reviewer via an approved placement.
    const ids = await scopedStudentIds(role, user.id);
    if (ids.length === 0) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("log_entries")
      .select("id, week, entry_date, hours, title, activities, skills, status, attachments, feedback, student_id")
      .in("student_id", ids)
      .neq("status", "draft")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as Entry[];
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", Array.from(new Set(rows.map((r) => r.student_id))).length ? ids : ids);
    const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
    rows.forEach((r) => {
      const p = map.get(r.student_id);
      if (p) r.student = { full_name: p.full_name, email: p.email };
    });

    setEntries(rows);
    setLoading(false);
  };

  useEffect(() => {
    if (user && isReviewer) load();
  }, [user?.id, role, isReviewer]);

  useEffect(() => {
    setFeedback(selected?.feedback ?? "");
  }, [selected?.id]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    entries.forEach((e) => { c[e.status] = (c[e.status] ?? 0) + 1; });
    return c;
  }, [entries]);

  const approve = async () => {
    if (!selected || !user) return;
    // Industry approval promotes to the academic queue; academic/admin approval finalises.
    const next: LogStatus =
      role === "industry" && selected.status === "submitted" ? "industry_approved" : "approved";

    const stamp = new Date().toISOString();
    const patch: Record<string, unknown> = {
      status: next,
      feedback: feedback.trim() || null,
      reviewed_by: user.id,
      reviewed_at: stamp,
    };
    if (next === "industry_approved") {
      patch.industry_reviewed_by = user.id;
      patch.industry_reviewed_at = stamp;
    } else {
      patch.academic_reviewed_by = user.id;
      patch.academic_reviewed_at = stamp;
    }

    setActing(true);
    const { error } = await supabase.from("log_entries").update(patch).eq("id", selected.id);
    setActing(false);
    if (error) return toast.error(error.message);
    toast.success(
      next === "industry_approved" ? "Approved — sent to the academic supervisor" : "Entry fully approved",
    );
    setSelected(null);
    load();
  };

  const requestRevision = async () => {
    if (!selected || !user) return;
    if (!feedback.trim()) return toast.error("Add feedback so the student knows what to change");
    setActing(true);
    const { error } = await supabase
      .from("log_entries")
      .update({
        status: "revision",
        feedback: feedback.trim(),
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", selected.id);
    setActing(false);
    if (error) return toast.error(error.message);
    toast.success("Revision requested");
    setSelected(null);
    load();
  };

  if (!authLoading && user && !isReviewer) {
    return (
      <AppShell>
        <PageHeader title="Approvals" description="Restricted to supervisors and coordinators." />
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            You don't have access to this page.
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const filtered = filter === "all" ? entries : entries.filter((e) => e.status === filter);
  const canAct = selected ? role === "admin" || selected.status === myQueueStatus : false;

  const description =
    role === "industry"
      ? "First-stage review of logbook entries from your assigned interns."
      : role === "academic"
        ? "Moderate logbook entries your interns' industry supervisors have already approved."
        : "Institution-wide oversight of every logbook submission.";

  return (
    <AppShell>
      <PageHeader title="Logbook approvals" description={description} />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-4">
        <TabsList>
          {role !== "academic" && (
            <TabsTrigger value="submitted">Awaiting industry ({counts.submitted ?? 0})</TabsTrigger>
          )}
          {role !== "industry" && (
            <TabsTrigger value="industry_approved">
              Awaiting academic ({counts.industry_approved ?? 0})
            </TabsTrigger>
          )}
          <TabsTrigger value="revision">Revision ({counts.revision ?? 0})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({counts.approved ?? 0})</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader><CardTitle>Entries</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              Nothing here. Entries appear once your assigned interns submit them.
            </div>
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
                    <TableCell className="font-medium">{displayName(e.student)}</TableCell>
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
                  {displayName(selected.student)} · {selected.entry_date} · {selected.hours} hours
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
                    placeholder="Shown to the student on their logbook entry."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>
                {canAct ? (
                  <div className="flex gap-2 justify-end pt-2 border-t">
                    <Button
                      variant="outline"
                      disabled={acting}
                      onClick={requestRevision}
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      Request revision
                    </Button>
                    <Button disabled={acting} onClick={approve}>
                      {role === "industry" && selected.status === "submitted"
                        ? "Approve & send to academic"
                        : "Approve"}
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground pt-2 border-t">
                    This entry is not in your review stage — no action available.
                  </p>
                )}
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
