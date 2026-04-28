import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { evaluationScores } from "@/lib/mock-data";
import { ResponsiveContainer, RadarChart, PolarAngleAxis, PolarGrid, Radar, Tooltip, Legend } from "recharts";

export const Route = createFileRoute("/evaluations")({
  head: () => ({ meta: [{ title: "Evaluations · SIMS" }] }),
  component: EvaluationsPage,
});

const RUBRIC = [
  { key: "technical", label: "Technical competence", value: 86 },
  { key: "communication", label: "Communication", value: 84 },
  { key: "teamwork", label: "Teamwork", value: 88 },
  { key: "initiative", label: "Initiative & ownership", value: 82 },
  { key: "punctuality", label: "Punctuality & attendance", value: 90 },
  { key: "professionalism", label: "Professionalism", value: 87 },
];

function EvaluationsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Evaluations"
        description="Mid-term and final evaluations with structured rubrics."
        actions={<Button className="bg-accent text-accent-foreground hover:bg-accent/90">Submit evaluation</Button>}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Final evaluation rubric</CardTitle>
            <CardDescription>Scored by industry supervisor, moderated by academic supervisor.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="industry">
              <TabsList>
                <TabsTrigger value="industry">Industry</TabsTrigger>
                <TabsTrigger value="academic">Academic</TabsTrigger>
              </TabsList>
              <TabsContent value="industry" className="space-y-5 pt-4">
                {RUBRIC.map((r) => (
                  <div key={r.key}>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{r.label}</span>
                      <span className="text-muted-foreground">{r.value}/100</span>
                    </div>
                    <Slider defaultValue={[r.value]} max={100} step={1} />
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="academic" className="pt-4 text-sm text-muted-foreground">
                Academic moderation panel: review industry score, add reflection notes, approve final grade.
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
              <RadarChart data={evaluationScores}>
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