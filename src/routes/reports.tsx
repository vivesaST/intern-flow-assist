import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth, useRole } from "@/lib/role-context";
import { scopedStudentIds, studentProfiles, displayName, type StudentLite } from "@/lib/scope";
import {
  ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie, Cell,
  LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports · SIMS" }] }),
  component: ReportsPage,
});

const PIE_COLORS = ["var(--color-chart-1)","var(--color-chart-2)","var(--color-chart-3)","var(--color-chart-4)","var(--color-chart-5)"];

function ReportsPage() {
  const { user } = useAuth();
  const { role } = useRole();
  const [submissionTrend, setSubmissionTrend] = useState<{ week: string; submitted: number; approved: number }[]>([]);
  const [sectorDistribution, setSectorDistribution] = useState<{ name: string; value: number }[]>([]);
  const [evaluationScores, setEvaluationScores] = useState<{ criterion: string; mid: number; final: number }[]>([]);
  const [students, setStudents] = useState<StudentLite[]>([]);
  const [studentId, setStudentId] = useState<string>("all");
  const [perStudent, setPerStudent] = useState<
    { id: string; name: string; entries: number; approved: number; hours: number; attendanceHours: number; avgFinal: number | null }[]
  >([]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const ids = await scopedStudentIds(role, user.id);
      setStudents(await studentProfiles(ids));
    })();
  }, [user?.id, role]);

  useEffect(() => {
    (async () => {
      const filterOne = studentId !== "all";
      let logsQuery = supabase.from("log_entries").select("week, status");
      if (filterOne) logsQuery = logsQuery.eq("student_id", studentId);
      const { data: logs } = await logsQuery;
      const byWeek = new Map<number, { submitted: number; approved: number }>();
      (logs ?? []).forEach((l: any) => {
        const w = byWeek.get(l.week) ?? { submitted: 0, approved: 0 };
        if (l.status === "submitted" || l.status === "approved" || l.status === "revision") w.submitted++;
        if (l.status === "approved") w.approved++;
        byWeek.set(l.week, w);
      });
      setSubmissionTrend(
        Array.from(byWeek.entries()).sort((a, b) => a[0] - b[0])
          .map(([w, v]) => ({ week: `W${w}`, ...v })),
      );

      let placementsQuery = supabase.from("placements").select("company_id, status").neq("status", "pending");
      if (filterOne) placementsQuery = placementsQuery.eq("student_id", studentId);
      const { data: placements } = await placementsQuery;
      const { data: companies } = await supabase.from("companies").select("id, sector");
      const sectorMap = new Map((companies ?? []).map((c: any) => [c.id, c.sector ?? "Other"]));
      const sectorCounts = new Map<string, number>();
      (placements ?? []).forEach((p: any) => {
        const s = sectorMap.get(p.company_id) ?? "Other";
        sectorCounts.set(s, (sectorCounts.get(s) ?? 0) + 1);
      });
      setSectorDistribution(Array.from(sectorCounts.entries()).map(([name, value]) => ({ name, value })));

      let evalsQuery = supabase.from("evaluations").select("criterion, mid_score, final_score");
      if (filterOne) evalsQuery = evalsQuery.eq("student_id", studentId);
      const { data: evals } = await evalsQuery;
      const byCrit = new Map<string, { mid: number[]; final: number[] }>();
      (evals ?? []).forEach((e: any) => {
        const v = byCrit.get(e.criterion) ?? { mid: [], final: [] };
        if (e.mid_score != null) v.mid.push(e.mid_score);
        if (e.final_score != null) v.final.push(e.final_score);
        byCrit.set(e.criterion, v);
      });
      const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
      setEvaluationScores(Array.from(byCrit.entries()).map(([criterion, v]) => ({
        criterion, mid: avg(v.mid), final: avg(v.final),
      })));
    })();
  }, [studentId]);

  // Per-student breakdown
  useEffect(() => {
    (async () => {
      if (students.length === 0) return setPerStudent([]);
      const ids = students.map((s) => s.id);
      const [{ data: logs }, { data: att }, { data: evals }] = await Promise.all([
        supabase.from("log_entries").select("student_id, status, hours").in("student_id", ids),
        supabase.from("attendance").select("student_id, hours").in("student_id", ids),
        supabase.from("evaluations").select("student_id, final_score").in("student_id", ids),
      ]);
      const rows = students.map((s) => {
        const sLogs = (logs ?? []).filter((l: any) => l.student_id === s.id);
        const sAtt = (att ?? []).filter((a: any) => a.student_id === s.id);
        const sEval = (evals ?? []).filter((e: any) => e.student_id === s.id && e.final_score != null);
        return {
          id: s.id,
          name: displayName(s),
          entries: sLogs.length,
          approved: sLogs.filter((l: any) => l.status === "approved").length,
          hours: sLogs.reduce((a: number, l: any) => a + Number(l.hours ?? 0), 0),
          attendanceHours: Math.round(sAtt.reduce((a: number, x: any) => a + Number(x.hours ?? 0), 0) * 10) / 10,
          avgFinal: sEval.length
            ? Math.round(sEval.reduce((a: number, e: any) => a + Number(e.final_score), 0) / sEval.length)
            : null,
        };
      });
      setPerStudent(rows);
    })();
  }, [students]);

  return (
    <AppShell>
      <PageHeader
        title="Reports & analytics"
        description="Programme-wide insights into submissions, scores, and placements."
        actions={<Button variant="outline">Export PDF</Button>}
      />

      <div className="mb-4 max-w-sm">
        <Label>Student</Label>
        <Select value={studentId} onValueChange={setStudentId}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All students</SelectItem>
            {students.map((s) => (
              <SelectItem key={s.id} value={s.id}>{displayName(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Logbook submissions</CardTitle>
            <CardDescription>Submitted vs approved (last 7 weeks)</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={submissionTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="week" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line dataKey="submitted" stroke="var(--color-chart-1)" strokeWidth={2} />
                <Line dataKey="approved" stroke="var(--color-chart-2)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Placements by sector</CardTitle>
            <CardDescription>Distribution of current interns</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sectorDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {sectorDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Average evaluation scores</CardTitle>
            <CardDescription>Mid-term vs final by criterion</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={evaluationScores}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="criterion" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="mid" fill="var(--color-chart-3)" radius={[4,4,0,0]} />
                <Bar dataKey="final" fill="var(--color-chart-2)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Per-student breakdown</CardTitle>
            <CardDescription>Logbook, attendance, and evaluation summary for each student</CardDescription>
          </CardHeader>
          <CardContent>
            {perStudent.length === 0 ? (
              <div className="text-sm text-muted-foreground">No students to report on yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b">
                      <th className="py-2 pr-4">Student</th>
                      <th className="py-2 pr-4">Entries</th>
                      <th className="py-2 pr-4">Approved</th>
                      <th className="py-2 pr-4">Logged hours</th>
                      <th className="py-2 pr-4">Attendance hrs</th>
                      <th className="py-2">Avg final score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perStudent.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b last:border-0 hover:bg-muted/40 cursor-pointer"
                        onClick={() => setStudentId(r.id)}
                      >
                        <td className="py-2 pr-4 font-medium">{r.name}</td>
                        <td className="py-2 pr-4">{r.entries}</td>
                        <td className="py-2 pr-4">{r.approved}</td>
                        <td className="py-2 pr-4">{r.hours}</td>
                        <td className="py-2 pr-4">{r.attendanceHours}</td>
                        <td className="py-2">{r.avgFinal ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}