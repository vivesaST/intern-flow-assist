import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
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
  const [submissionTrend, setSubmissionTrend] = useState<{ week: string; submitted: number; approved: number }[]>([]);
  const [sectorDistribution, setSectorDistribution] = useState<{ name: string; value: number }[]>([]);
  const [evaluationScores, setEvaluationScores] = useState<{ criterion: string; mid: number; final: number }[]>([]);

  useEffect(() => {
    (async () => {
      const { data: logs } = await supabase.from("log_entries").select("week, status");
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

      const { data: placements } = await supabase.from("placements").select("company_id, status").neq("status", "pending");
      const { data: companies } = await supabase.from("companies").select("id, sector");
      const sectorMap = new Map((companies ?? []).map((c: any) => [c.id, c.sector ?? "Other"]));
      const sectorCounts = new Map<string, number>();
      (placements ?? []).forEach((p: any) => {
        const s = sectorMap.get(p.company_id) ?? "Other";
        sectorCounts.set(s, (sectorCounts.get(s) ?? 0) + 1);
      });
      setSectorDistribution(Array.from(sectorCounts.entries()).map(([name, value]) => ({ name, value })));

      const { data: evals } = await supabase.from("evaluations").select("criterion, mid_score, final_score");
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
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="Reports & analytics"
        description="Programme-wide insights into submissions, scores, and placements."
        actions={<Button variant="outline">Export PDF</Button>}
      />

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
      </div>
    </AppShell>
  );
}