import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, FileText, Inbox, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/lib/role-context";
import { toast } from "sonner";

export const Route = createFileRoute("/placements")({
  head: () => ({
    meta: [
      { title: "Placement review queue · Smart Internship" },
      {
        name: "description",
        content: "Coordinators review student placement requests, vet host companies and assign supervisors.",
      },
      { property: "og:title", content: "Placement review queue · Smart Internship" },
      { property: "og:description", content: "Accept, reject or query student placement submissions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlacementsPage,
});

type Req = {
  id: string;
  student_id: string;
  company_id: string | null;
  company_name: string;
  company_address: string | null;
  industry_supervisor_name: string;
  industry_supervisor_email: string;
  start_date: string;
  acceptance_letter_path: string | null;
  status: string;
  review_note: string | null;
  created_at: string;
  student?: { full_name: string | null; email: string | null; matric: string | null; department: string | null };
};
type Supervisor = { id: string; name: string; email: string | null; type: "academic" | "industry"; capacity: number; load: number };

const STATUS_TONE: Record<string, string> = {
  pending: "bg-blue-100 text-blue-700 border-blue-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  more_info: "bg-amber-100 text-amber-700 border-amber-200",
};

function PlacementsPage() {
  const { role } = useRole();
  const isAdmin = role === "admin";

  const [reqs, setReqs] = useState<Req[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>("pending");
  const [active, setActive] = useState<Req | null>(null);
  const [academicId, setAcademicId] = useState("");
  const [note, setNote] = useState("");
  const [letterUrl, setLetterUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: rows, error }, { data: sup }] = await Promise.all([
      supabase.from("placement_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("supervisors").select("id, name, email, type, capacity, load").order("name"),
    ]);
    if (error) toast.error(error.message);
    setSupervisors((sup ?? []) as Supervisor[]);

    const list = (rows ?? []) as Req[];
    const ids = Array.from(new Set(list.map((r) => r.student_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, email, matric, department")
        .in("id", ids);
      const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
      list.forEach((r) => {
        const p = map.get(r.student_id);
        if (p) r.student = p;
      });
    }
    setReqs(list);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
    else setLoading(false);
  }, [isAdmin]);

  // Signed URL for the uploaded acceptance letter
  useEffect(() => {
    setLetterUrl(null);
    setNote(active?.review_note ?? "");
    setAcademicId("");
    if (!active?.acceptance_letter_path) return;
    (async () => {
      const { data } = await supabase.storage
        .from("acceptance-letters")
        .createSignedUrl(active.acceptance_letter_path!, 60 * 10);
      setLetterUrl(data?.signedUrl ?? null);
    })();
  }, [active?.id]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { pending: 0, approved: 0, rejected: 0, more_info: 0 };
    reqs.forEach((r) => { c[r.status] = (c[r.status] ?? 0) + 1; });
    return c;
  }, [reqs]);

  const filtered = tab === "all" ? reqs : reqs.filter((r) => r.status === tab);

  const accept = async () => {
    if (!active) return;
    if (!academicId) return toast.error("Assign an academic supervisor first");
    setBusy(true);
    try {
      // 1. Verify (or create) the host company
      let companyId = active.company_id;
      if (companyId) {
        const { error } = await supabase.from("companies").update({ verified: true }).eq("id", companyId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("companies")
          .insert({ name: active.company_name, address: active.company_address, verified: true })
          .select("id")
          .single();
        if (error) throw error;
        companyId = data.id;
      }

      // 2. Link or invite the industry supervisor
      const email = active.industry_supervisor_email.toLowerCase();
      let industryId: string | null = supervisors.find(
        (s) => s.type === "industry" && (s.email ?? "").toLowerCase() === email,
      )?.id ?? null;
      if (!industryId) {
        const { data, error } = await supabase
          .from("supervisors")
          .insert({
            name: active.industry_supervisor_name,
            email,
            type: "industry",
            affiliation: active.company_name,
          })
          .select("id")
          .single();
        if (error) throw error;
        industryId = data.id;
      }

      // 3. Create or update the placement
      const { data: existing } = await supabase
        .from("placements")
        .select("id")
        .eq("student_id", active.student_id)
        .maybeSingle();

      const payload = {
        student_id: active.student_id,
        company_id: companyId,
        academic_supervisor_id: academicId,
        industry_supervisor_id: industryId,
        start_date: active.start_date,
        status: "active" as const,
      };
      const { error: pErr } = existing
        ? await supabase.from("placements").update(payload).eq("id", existing.id)
        : await supabase.from("placements").insert(payload);
      if (pErr) throw pErr;

      // 4. Close the request
      const { error: rErr } = await supabase
        .from("placement_requests")
        .update({ status: "approved", review_note: note.trim() || null, reviewed_at: new Date().toISOString() })
        .eq("id", active.id);
      if (rErr) throw rErr;

      toast.success("Placement approved — the student's workspace is now unlocked");
      setActive(null);
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not approve placement");
    } finally {
      setBusy(false);
    }
  };

  const decline = async (status: "rejected" | "more_info") => {
    if (!active) return;
    if (!note.trim()) return toast.error("Give the student a reason so they can resubmit");
    setBusy(true);
    const { error } = await supabase
      .from("placement_requests")
      .update({ status, review_note: note.trim(), reviewed_at: new Date().toISOString() })
      .eq("id", active.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(status === "rejected" ? "Request rejected" : "More information requested");
    setActive(null);
    load();
  };

  if (!isAdmin) {
    return (
      <AppShell>
        <PageHeader title="Placements" description="Restricted to the internship office." />
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Only the admin / coordinator can review placement requests.
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const academics = supervisors.filter((s) => s.type === "academic");

  return (
    <AppShell>
      <PageHeader
        title="Placement requests"
        description="Vet student submissions, verify host companies and assign supervisors. Placements originate from students only."
      />

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground uppercase flex items-center gap-1">
              <Inbox className="h-3 w-3" /> Awaiting review
            </div>
            <div className="text-2xl font-semibold mt-2">{counts.pending ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground uppercase flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Approved
            </div>
            <div className="text-2xl font-semibold mt-2">{counts.approved ?? 0}</div>
            <Progress
              className="mt-3"
              value={reqs.length ? ((counts.approved ?? 0) / reqs.length) * 100 : 0}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground uppercase flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Sent back
            </div>
            <div className="text-2xl font-semibold mt-2">
              {(counts.rejected ?? 0) + (counts.more_info ?? 0)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">rejected or awaiting more info</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="pending">Pending ({counts.pending ?? 0})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({counts.approved ?? 0})</TabsTrigger>
          <TabsTrigger value="more_info">More info ({counts.more_info ?? 0})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({counts.rejected ?? 0})</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Review queue</CardTitle>
          <CardDescription>Click a request to see the acceptance letter and decide.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground py-6">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6">Nothing in this queue.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Industry supervisor</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>Letter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.student?.full_name ?? r.student?.email ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{r.student?.matric ?? ""}</div>
                    </TableCell>
                    <TableCell className="text-sm">{r.company_name}</TableCell>
                    <TableCell className="text-sm">
                      <div>{r.industry_supervisor_name}</div>
                      <div className="text-xs text-muted-foreground">{r.industry_supervisor_email}</div>
                    </TableCell>
                    <TableCell className="text-sm">{r.start_date}</TableCell>
                    <TableCell>
                      {r.acceptance_letter_path ? (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <span className="text-xs text-muted-foreground">none</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_TONE[r.status] ?? ""}>
                        {r.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => setActive(r)}>
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {active && (
            <>
              <SheetHeader>
                <SheetTitle>Review placement request</SheetTitle>
                <SheetDescription>
                  {active.student?.full_name ?? active.student?.email} · {active.student?.department ?? "—"}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-5 py-4">
                <div className="rounded-md border p-3 space-y-2 text-sm">
                  <Field label="Company" value={active.company_name} />
                  <Field label="Address" value={active.company_address ?? "—"} />
                  <Field label="Industry supervisor" value={active.industry_supervisor_name} />
                  <Field label="Supervisor email" value={active.industry_supervisor_email} />
                  <Field label="Start date" value={active.start_date} />
                </div>

                <div>
                  <div className="text-xs uppercase text-muted-foreground mb-2">Acceptance letter</div>
                  {letterUrl ? (
                    <a
                      href={letterUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm underline"
                    >
                      <FileText className="h-4 w-4" /> Open uploaded letter
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">No letter uploaded.</p>
                  )}
                </div>

                <div>
                  <Label>Academic supervisor to assign</Label>
                  <Select value={academicId} onValueChange={setAcademicId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pick from school staff" />
                    </SelectTrigger>
                    <SelectContent>
                      {academics.length === 0 && (
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          No academic supervisors registered yet.
                        </div>
                      )}
                      {academics.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.load}/{s.capacity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Note to student</Label>
                  <Textarea
                    rows={3}
                    value={note}
                    placeholder="Required when rejecting or asking for more information."
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <Button onClick={accept} disabled={busy}>Accept</Button>
                  <Button
                    variant="outline"
                    disabled={busy}
                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                    onClick={() => decline("more_info")}
                  >
                    Request more info
                  </Button>
                  <Button variant="destructive" disabled={busy} onClick={() => decline("rejected")}>
                    Reject
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs uppercase text-muted-foreground w-32 shrink-0 pt-0.5">{label}</span>
      <span className="flex-1">{value}</span>
    </div>
  );
}
