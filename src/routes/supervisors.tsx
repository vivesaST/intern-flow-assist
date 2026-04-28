import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supervisors } from "@/lib/mock-data";

export const Route = createFileRoute("/supervisors")({
  head: () => ({ meta: [{ title: "Supervisors · SIMS" }] }),
  component: SupervisorsPage,
});

function SupervisorsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Supervisors"
        description="Academic and industry supervisors with workload visibility."
        actions={<Button className="bg-accent text-accent-foreground hover:bg-accent/90">+ Invite supervisor</Button>}
      />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {supervisors.map((sv) => (
          <Card key={sv.id}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-semibold">{sv.name}</div>
                  <div className="text-xs text-muted-foreground">{sv.affiliation}</div>
                </div>
                <Badge variant={sv.type === "academic" ? "default" : "secondary"}>{sv.type}</Badge>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>Workload</span><span className="text-muted-foreground">{sv.load}/{sv.capacity}</span>
                </div>
                <Progress value={(sv.load / sv.capacity) * 100} />
              </div>
              <div className="flex justify-between text-xs mt-4 pt-3 border-t">
                <span className="text-muted-foreground">Pending reviews</span>
                <span className="font-medium">{sv.pending}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}