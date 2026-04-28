import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { tasks, type Task } from "@/lib/mock-data";

export const Route = createFileRoute("/tasks")({
  head: () => ({ meta: [{ title: "Tasks · SIMS" }] }),
  component: TasksPage,
});

const COLUMNS: { key: Task["status"]; title: string }[] = [
  { key: "todo", title: "To do" },
  { key: "in-progress", title: "In progress" },
  { key: "submitted", title: "Submitted" },
  { key: "graded", title: "Graded" },
];

function TasksPage() {
  return (
    <AppShell>
      <PageHeader
        title="Tasks"
        description="Industry-assigned tasks tracked through to grading."
        actions={<Button className="bg-accent text-accent-foreground hover:bg-accent/90">+ Assign task</Button>}
      />
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const items = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="bg-muted/40 rounded-lg p-3">
              <div className="flex items-center justify-between px-2 mb-3">
                <h3 className="font-medium text-sm">{col.title}</h3>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
              <div className="space-y-2">
                {items.map((t) => (
                  <Card key={t.id}>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-medium leading-snug">{t.title}</div>
                        <Badge
                          variant="outline"
                          className={
                            t.priority === "high"
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : t.priority === "medium"
                              ? "bg-accent/15 text-accent-foreground border-accent/30"
                              : ""
                          }
                        >
                          {t.priority}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">Due {t.due}</div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{t.assignedBy}</span>
                        {t.grade && <Badge className="bg-emerald-100 text-emerald-700">{t.grade}</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}