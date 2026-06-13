import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/role-context";
import { toast } from "sonner";
import { AttachmentGallery } from "@/components/attachment-gallery";
import { CommentThread } from "@/components/comment-thread";
import { usePlacement } from "@/hooks/use-placement";
import { PlacementRequired } from "@/components/placement-required";
import { useRole } from "@/lib/role-context";

type LogStatus = "draft" | "submitted" | "approved" | "revision";
type LogEntry = {
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
};

export const Route = createFileRoute("/logbook")({
  head: () => ({ meta: [{ title: "Logbook · SIMS" }] }),
  component: LogbookPage,
});

function StatusBadge({ s }: { s: LogEntry["status"] }) {
  const map = {
    approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
    submitted: "bg-blue-100 text-blue-700 border-blue-200",
    revision: "bg-amber-100 text-amber-700 border-amber-200",
    draft: "bg-muted text-muted-foreground",
  } as const;
  return <Badge variant="outline" className={map[s]}>{s}</Badge>;
}

function LogbookPage() {
  const { user, loading: authLoading } = useAuth();
  const { role } = useRole();
  const { hasActivePlacement, loading: placementLoading } = usePlacement();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<LogEntry | null>(null);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // form state
  const [week, setWeek] = useState("");
  const [date, setDate] = useState("");
  const [hours, setHours] = useState("");
  const [title, setTitle] = useState("");
  const [activities, setActivities] = useState("");
  const [skills, setSkills] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("log_entries")
      .select("id, week, entry_date, hours, title, activities, skills, status, attachments, feedback")
      .order("week", { ascending: false });
    if (error) toast.error(error.message);
    setEntries((data as LogEntry[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const gated = role === "student" && !placementLoading && !hasActivePlacement;

  const save = async (status: LogStatus) => {
    if (!user) return;
    if (!week || !date || !title) {
      toast.error("Week, date and title are required");
      return;
    }
    setUploading(true);
    const { data: inserted, error } = await supabase
      .from("log_entries")
      .insert({
        student_id: user.id,
        week: parseInt(week, 10),
        entry_date: date,
        hours: hours ? parseFloat(hours) : 0,
        title,
        activities,
        skills: skills ? skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
        status,
      })
      .select("id")
      .single();
    if (error || !inserted) {
      setUploading(false);
      toast.error(error?.message ?? "Failed to save entry");
      return;
    }
    const uploadedPaths: string[] = [];
    for (const f of files) {
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name} is larger than 5MB, skipped`);
        continue;
      }
      const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/${inserted.id}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("logbook-attachments")
        .upload(path, f, { contentType: f.type, upsert: false });
      if (upErr) {
        toast.error(`Upload failed: ${upErr.message}`);
      } else {
        uploadedPaths.push(path);
      }
    }
    if (uploadedPaths.length > 0) {
      await supabase
        .from("log_entries")
        .update({ attachments: uploadedPaths })
        .eq("id", inserted.id);
    }
    setUploading(false);
    toast.success(status === "draft" ? "Draft saved" : "Submitted for approval");
    setOpen(false);
    setWeek(""); setDate(""); setHours(""); setTitle(""); setActivities(""); setSkills(""); setFiles([]);
    load();
  };

  return (
    <AppShell>
      <PageHeader
        title="Logbook"
        description="Weekly entries with industry and academic supervisor approvals."
        actions={gated ? null : (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">+ New entry</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New logbook entry</DialogTitle>
                <DialogDescription>Record activities for the current week.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Week</Label><Input type="number" placeholder="15" value={week} onChange={(e) => setWeek(e.target.value)} /></div>
                  <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
                </div>
                <div><Label>Hours</Label><Input type="number" placeholder="40" value={hours} onChange={(e) => setHours(e.target.value)} /></div>
                <div><Label>Title</Label><Input placeholder="Sprint planning & component refactor" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
                <div><Label>Activities</Label><Textarea placeholder="Describe what you did this week..." rows={4} value={activities} onChange={(e) => setActivities(e.target.value)} /></div>
                <div><Label>Skills practised (comma separated)</Label><Input placeholder="React, TypeScript, Testing" value={skills} onChange={(e) => setSkills(e.target.value)} /></div>
                <div>
                  <Label>Attach images / screenshots (optional, max 5MB each)</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                  />
                  {files.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">{files.length} file(s) selected</div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" disabled={uploading} onClick={() => save("draft")}>Save draft</Button>
                <Button disabled={uploading} onClick={() => save("submitted")}>{uploading ? "Saving…" : "Submit for approval"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      />

      {gated ? (
        <PlacementRequired feature="the logbook" />
      ) : (
      <>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Submitted", value: entries.filter(e => e.status === "submitted").length },
          { label: "Approved", value: entries.filter(e => e.status === "approved").length },
          { label: "Revision", value: entries.filter(e => e.status === "revision").length },
          { label: "Drafts", value: entries.filter(e => e.status === "draft").length },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="text-xs text-muted-foreground uppercase">{s.label}</div>
              <div className="text-2xl font-semibold mt-2">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>All entries</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Loading…</div>
          ) : entries.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">No entries yet. Create your first logbook entry above.</div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Week</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.id} className="cursor-pointer" onClick={() => setSelected(e)}>
                  <TableCell className="font-mono text-xs">W{e.week}</TableCell>
                  <TableCell>{e.entry_date}</TableCell>
                  <TableCell className="font-medium">{e.title}</TableCell>
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
                <DialogDescription>{selected.entry_date} · {selected.hours} hours</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase mb-1">Activities</div>
                  <p className="text-sm">{selected.activities}</p>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase mb-1">Skills practised</div>
                  <div className="flex gap-2 flex-wrap">
                    {(selected.skills ?? []).map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
                  </div>
                </div>
                {selected.attachments && selected.attachments.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground uppercase mb-2">Attachments</div>
                    <AttachmentGallery paths={selected.attachments} />
                  </div>
                )}
                {selected.feedback && (
                  <div className="rounded-md border bg-muted/40 p-3">
                    <div className="text-xs text-muted-foreground uppercase mb-1">Supervisor feedback</div>
                    <p className="text-sm whitespace-pre-wrap">{selected.feedback}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <StatusBadge s={selected.status} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase mb-2">Comments</div>
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