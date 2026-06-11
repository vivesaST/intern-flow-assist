import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type PlacementStatus = "placed" | "pending" | "completed";
type Row = {
  id: string;
  full_name: string | null;
  email: string | null;
  matric: string | null;
  department: string | null;
  placement_id: string | null;
  company_id: string | null;
  academic_supervisor_id: string | null;
  industry_supervisor_id: string | null;
  status: PlacementStatus;
};
type Company = { id: string; name: string; slots: number; filled: number };
type Supervisor = { id: string; name: string; type: "academic" | "industry"; capacity: number; load: number };

export const Route = createFileRoute("/placements")({
  head: () => ({ meta: [{ title: "Placements · SIMS" }] }),
  component: PlacementsPage,
});

function PlacementsPage() {
  const [filter, setFilter] = useState<"all" | PlacementStatus>("all");
  const [active, setActive] = useState<Row | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignForm, setAssignForm] = useState({ company_id: "", academic_id: "", industry_id: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "student");
    const ids = (roles ?? []).map(r => r.user_id);
    const [{ data: profs }, { data: placements }, cmp, sup] = await Promise.all([
      ids.length ? supabase.from("profiles").select("id, full_name, email, matric, department").in("id", ids) : Promise.resolve({ data: [] as any[] }),
      ids.length ? supabase.from("placements").select("*").in("student_id", ids) : Promise.resolve({ data: [] as any[] }),
      supabase.from("companies").select("id, name, slots, filled").order("name"),
      supabase.from("supervisors").select("id, name, type, capacity, load").order("name"),
    ]);
    setCompanies((cmp.data ?? []) as Company[]);
    setSupervisors((sup.data ?? []) as Supervisor[]);
    const pmap = new Map((placements ?? []).map((p: any) => [p.student_id, p]));
    setRows(((profs ?? []) as any[]).map(p => {
      const pl = pmap.get(p.id);
      return {
        id: p.id, full_name: p.full_name, email: p.email,
        matric: p.matric, department: p.department,
        placement_id: pl?.id ?? null,
        company_id: pl?.company_id ?? null,
        academic_supervisor_id: pl?.academic_supervisor_id ?? null,
        industry_supervisor_id: pl?.industry_supervisor_id ?? null,
        status: (pl?.status ?? "pending") as PlacementStatus,
      };
    }));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!active) return;
    setAssignForm({
      company_id: active.company_id ?? "",
      academic_id: active.academic_supervisor_id ?? "",
      industry_id: active.industry_supervisor_id ?? "",
    });
  }, [active?.id]);

  const filtered = useMemo(
    () => rows.filter((s) => filter === "all" || s.status === filter),
    [rows, filter],
  );

  const companyName = (id: string | null) => id ? companies.find(c => c.id === id)?.name ?? null : null;
  const supName = (id: string | null) => id ? supervisors.find(s => s.id === id)?.name ?? null : null;

  const confirmAssign = async () => {
    if (!active) return;
    setSaving(true);
    const payload = {
      student_id: active.id,
      company_id: assignForm.company_id || null,
      academic_supervisor_id: assignForm.academic_id || null,
      industry_supervisor_id: assignForm.industry_id || null,
      status: (assignForm.company_id ? "placed" : "pending") as PlacementStatus,
    };
    const { error } = active.placement_id
      ? await supabase.from("placements").update(payload).eq("id", active.placement_id)
      : await supabase.from("placements").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Placement saved");
    setActive(null);
    load();
  };

  return (
    <AppShell>
      <PageHeader
        title="Placements"
        description="Match students to companies and supervisors."
      />

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground uppercase">Placement rate</div>
            <div className="text-2xl font-semibold mt-2">{rows.length ? Math.round((rows.filter(s => s.status !== "pending").length / rows.length) * 100) : 0}%</div>
            <Progress className="mt-3" value={rows.length ? (rows.filter(s => s.status !== "pending").length / rows.length) * 100 : 0} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground uppercase">Open slots</div>
            <div className="text-2xl font-semibold mt-2">{companies.reduce((a, c) => a + (c.slots - c.filled), 0)}</div>
            <div className="text-xs text-muted-foreground mt-1">across {companies.length} partners</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground uppercase flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Awaiting placement</div>
            <div className="text-2xl font-semibold mt-2">{rows.filter(s => s.status === "pending").length}</div>
            <div className="text-xs text-muted-foreground mt-1">need supervisor + company</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Students</CardTitle>
            <CardDescription>Click a row to assign company & supervisor.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
              <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="placed">Placed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
          {!loading && filtered.length === 0 && <div className="text-sm text-muted-foreground">No students.</div>}
          {!loading && filtered.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Academic</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-medium">{s.full_name ?? s.email ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{s.matric ?? ""}</div>
                  </TableCell>
                  <TableCell className="text-sm">{s.department ?? "—"}</TableCell>
                  <TableCell className="text-sm">{companyName(s.company_id) ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-sm">{supName(s.academic_supervisor_id) ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell><Badge variant="outline">{s.status}</Badge></TableCell>
                  <TableCell>
                    <Sheet open={active?.id === s.id} onOpenChange={(o) => !o && setActive(null)}>
                      <SheetTrigger asChild>
                        <Button size="sm" variant="ghost" onClick={() => setActive(s)}>Assign</Button>
                      </SheetTrigger>
                      <SheetContent className="w-[420px]">
                        <SheetHeader>
                          <SheetTitle>Assign placement</SheetTitle>
                          <SheetDescription>{s.full_name ?? s.email} · {s.matric ?? ""}</SheetDescription>
                        </SheetHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label>Host company</Label>
                            <Select value={assignForm.company_id} onValueChange={(v) => setAssignForm({ ...assignForm, company_id: v })}>
                              <SelectTrigger><SelectValue placeholder="Pick company" /></SelectTrigger>
                              <SelectContent>
                                {companies.map((c) => (
                                  <SelectItem key={c.id} value={c.id} disabled={c.filled >= c.slots && c.id !== s.company_id}>
                                    {c.name} <span className="text-xs text-muted-foreground">({c.slots - c.filled} slots)</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Academic supervisor</Label>
                            <Select value={assignForm.academic_id} onValueChange={(v) => setAssignForm({ ...assignForm, academic_id: v })}>
                              <SelectTrigger><SelectValue placeholder="Pick supervisor" /></SelectTrigger>
                              <SelectContent>
                                {supervisors.filter(sv => sv.type === "academic").map((sv) => (
                                  <SelectItem key={sv.id} value={sv.id}>
                                    {sv.name} <span className="text-xs text-muted-foreground">({sv.load}/{sv.capacity})</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Industry supervisor</Label>
                            <Select value={assignForm.industry_id} onValueChange={(v) => setAssignForm({ ...assignForm, industry_id: v })}>
                              <SelectTrigger><SelectValue placeholder="Pick mentor" /></SelectTrigger>
                              <SelectContent>
                                {supervisors.filter(sv => sv.type === "industry").map((sv) => (
                                  <SelectItem key={sv.id} value={sv.id}>{sv.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <SheetFooter>
                          <Button variant="outline" onClick={() => setActive(null)}>Cancel</Button>
                          <Button onClick={confirmAssign} disabled={saving}>{saving ? "Saving…" : "Confirm"}</Button>
                        </SheetFooter>
                      </SheetContent>
                    </Sheet>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}