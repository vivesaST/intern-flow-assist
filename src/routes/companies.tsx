import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { companies } from "@/lib/mock-data";
import { Star } from "lucide-react";

export const Route = createFileRoute("/companies")({
  head: () => ({ meta: [{ title: "Companies · SIMS" }] }),
  component: CompaniesPage,
});

function CompaniesPage() {
  return (
    <AppShell>
      <PageHeader
        title="Partner companies"
        description="Industry hosts with available internship slots."
        actions={<Button className="bg-accent text-accent-foreground hover:bg-accent/90">+ Add company</Button>}
      />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <Badge variant="secondary" className="mt-1">{c.sector}</Badge>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-3 w-3 fill-accent text-accent" /> {c.rating}
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>Slots filled</span><span className="text-muted-foreground">{c.filled}/{c.slots}</span>
                </div>
                <Progress value={(c.filled / c.slots) * 100} />
              </div>
              <div className="text-xs text-muted-foreground mt-4 pt-3 border-t">
                Contact: <span className="text-foreground">{c.contact}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}