import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, RadarChart, PolarAngleAxis, PolarGrid, Radar, Tooltip, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useRole } from "@/lib/role-context";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/evaluations")({
  head: () => ({ meta: [{ title: "Evaluations · SIMS" }] }),
  component: EvaluationsPage,
});

const RUBRIC = [
  { key: "technical", label: "Technical competence" },
  { key: "communication", label: "Communication" },
  { key: "teamwork", label: "Teamwork" },
  { key: "initiative", label: "Initiative & ownership" },
  { key: "punctuality", label: "Punctuality & attendance" },
  { key: "professionalism", label: "Professionalism" },
];

function EvaluationsPage() {
  const { user } = useAuth();
  const { role } = useRole();
  const canEvaluate = role === "admin" || role === "academic" || role === "industry";

  const [students, setStudents] = useState<{ id: string; full_name: string | null; email: string | null }[]>([]);
  const [studentId, setStudentId] = useState<string>("");
  const [scores, setScores] = useState<Record<string, { mid: number; final: number }>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (canEvaluate) {
        const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "student");
        const ids = (roles ?? []).map(r => r.user_id);
        if (ids.length) {
          const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
          setStudents(profs ?? []);
        }
      } else if (user) {
        setStudentId(user.id);
      }
    })();
  }, [canEvaluate, user?.id]);

  useEffect(() => {
    if (!studentId) return;
    (async () => {
      const { data } = await supabase.from("evaluations").select("criterion, mid_score, final_score").eq("student_id", studentId);
      const map: Record<string, { mid: number; final: number }> = {};
      RUBRIC.forEach(r => { map[r.key] = { mid: 0, final: 0 }; });
      (data ?? []).forEach((e: any) => {
        map[e.criterion] = { mid: e.mid_score ?? 0, final: e.final_score ?? 0 };
      });
      setScores(map);
    })();
  }, [studentId]);

  const setScore = (key: string, kind: "mid" | "final", v: number) => {
    setScores(s => ({ ...s, [key]: { ...(s[key] ?? { mid: 0, final: 0 }), [kind]: v } }));
  };

  const submit = async () => {
    if (!studentId || !user) return toast.error("Pick a student first");
    setSaving(true);
    for (const r of RUBRIC) {
      const sc = scores[r.key] ?? { mid: 0, final: 0 };
      // upsert by (student_id, criterion)
      const { data: existing } = await supabase
        .from("evaluations").select("id")
        .eq("student_id", studentId).eq("criterion", r.key).maybeSingle();
      const payload = {
        student_id: studentId, criterion: r.key,
        mid_score: sc.mid, final_score: sc.final,
        evaluator_id: user.id,
      };
      if (existing) await supabase.from("evaluations").update(payload).eq("id", existing.id);
      else await supabase.from("evaluations").insert(payload);
    }
    setSaving(false);
    toast.success("Evaluation saved");
  };

  const chartData = RUBRIC.map(r => ({
    criterion: r.label,
    mid: scores[r.key]?.mid ?? 0,
    final: scores[r.key]?.final ?? 0,
  }));

  return (
    <AppShell>
      <PageHeader
        title="Evaluations"
        description="Mid-term and final evaluations with structured rubrics."
        actions={canEvaluate ? (
          <Button onClick={submit} disabled={saving || !studentId} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {saving ? "Saving…" : "Submit evaluation"}
          </Button>
        ) : null}
      />

      {canEvaluate && (
        <div className="mb-4 max-w-sm">
          <Label>Student</Label>
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger><SelectValue placeholder="Pick student to evaluate" /></SelectTrigger>
            <SelectContent>
              {students.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.full_name ?? s.email ?? s.id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Final evaluation rubric</CardTitle>
            <CardDescription>Scored by industry supervisor, moderated by academic supervisor.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="final">
              <TabsList>
                <TabsTrigger value="mid">Mid-term</TabsTrigger>
                <TabsTrigger value="final">Final</TabsTrigger>
              </TabsList>
              <TabsContent value="mid" className="space-y-5 pt-4">
                {RUBRIC.map((r) => (
                  <div key={r.key}>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{r.label}</span>
                      <span className="text-muted-foreground">{scores[r.key]?.mid ?? 0}/100</span>
                    </div>
                    <Slider value={[scores[r.key]?.mid ?? 0]} max={100} step={1}
                      disabled={!canEvaluate || !studentId}
                      onValueChange={(v) => setScore(r.key, "mid", v[0])} />
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="final" className="space-y-5 pt-4">
                {RUBRIC.map((r) => (
                  <div key={r.key}>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{r.label}</span>
                      <span className="text-muted-foreground">{scores[r.key]?.final ?? 0}/100</span>
                    </div>
                    <Slider value={[scores[r.key]?.final ?? 0]} max={100} step={1}
                      disabled={!canEvaluate || !studentId}
                      onValueChange={(v) => setScore(r.key, "final", v[0])} />
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mid-term vs Final</CardTitle>
            <CardDescription>Score progression</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="criterion" fontSize={11} />
                <Radar name="Mid-term" dataKey="mid" stroke="var(--color-chart-3)" fill="var(--color-chart-3)" fillOpacity={0.25} />
                <Radar name="Final" dataKey="final" stroke="var(--color-chart-2)" fill="var(--color-chart-2)" fillOpacity={0.4} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}