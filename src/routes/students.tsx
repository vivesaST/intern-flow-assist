import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRole } from "@/lib/role-context";
import { StudentManageSheet } from "@/components/student-manage-sheet";
import { useAuth } from "@/lib/role-context";
import { scopedStudentIds } from "@/lib/scope";

type Row = {
  id: string;
  full_name: string | null;
  email: string | null;
  matric: string | null;
  department: string | null;
  company: string | null;
  university: string | null;
  progress: number;
  status: string;
};

export const Route = createFileRoute("/students")({
  head: () => ({ meta: [{ title: "Students · SIMS" }] }),
  component: StudentsPage,
});

function StudentsPage() {
  const { role } = useRole();
  const { user } = useAuth();
  const canManage = role === "admin" || role === "academic";
  const isAdmin = role === "admin";
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [manageId, setManageId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
      // students = users with role 'student'
      if (!user) { setLoading(false); return; }
      const ids = await scopedStudentIds(role, user.id);
      if (ids.length === 0) { setRows([]); setLoading(false); return; }

      const [{ data: profiles }, { data: placements }, { data: companies }] = await Promise.all([
        supabase.from("profiles").select("*").in("id", ids),
        supabase.from("placements").select("student_id, company_id, progress, status").in("student_id", ids),
        supabase.from("companies").select("id, name"),
      ]);
      const cmap = new Map((companies ?? []).map(c => [c.id, c.name]));
      const pmap = new Map((placements ?? []).map(p => [p.student_id, p]));
      const merged: Row[] = (profiles ?? []).map(p => {
        const pl = pmap.get(p.id);
        return {
          id: p.id, full_name: p.full_name, email: p.email,
          matric: p.matric, department: p.department,
          company: (pl?.company_id ? cmap.get(pl.company_id) : null) ?? (p as any).company_name ?? null,
          university: (p as any).university ?? null,
          progress: pl?.progress ?? 0,
          status: pl?.status ?? "pending",
        };
      });
      setRows(merged);
      setLoading(false);
  };
  useEffect(() => { load(); }, [user?.id, role]);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const s = q.toLowerCase();
    return rows.filter(r =>
      (r.full_name ?? "").toLowerCase().includes(s) ||
      (r.matric ?? "").toLowerCase().includes(s) ||
      (r.department ?? "").toLowerCase().includes(s) ||
      (r.company ?? "").toLowerCase().includes(s) ||
      (r.university ?? "").toLowerCase().includes(s),
    );
  }, [rows, q]);

  return (
    <AppShell>
      <PageHeader title="Students" description="All students in the internship programme." />
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Directory</CardTitle>
          <Input placeholder="Search students…" className="w-64 h-9" value={q} onChange={e => setQ(e.target.value)} />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground">No students found.</div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Matric</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>University</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.full_name ?? s.email ?? "—"}</TableCell>
                  <TableCell className="text-sm">{s.matric ?? "—"}</TableCell>
                  <TableCell className="text-sm">{s.department ?? "—"}</TableCell>
                  <TableCell className="text-sm">{s.university ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-sm">{s.company ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="w-40"><Progress value={s.progress} /></TableCell>
                  <TableCell><Badge variant="outline">{s.status}</Badge></TableCell>
                  {canManage && (
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => setManageId(s.id)}>Manage</Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
      <StudentManageSheet
        studentId={manageId}
        open={!!manageId}
        onOpenChange={(o) => !o && setManageId(null)}
        isAdmin={isAdmin}
        onChanged={load}
      />
    </AppShell>
  );
}