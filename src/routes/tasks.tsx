import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/lib/role-context";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePlacement } from "@/hooks/use-placement";
import { PlacementRequired } from "@/components/placement-required";

type TaskStatus = "todo" | "in-progress" | "submitted" | "graded";
type TaskPriority = "low" | "medium" | "high";
type Task = {
  id: string; title: string; description: string | null;
  status: TaskStatus; priority: TaskPriority;
  due_date: string | null; grade: string | null;
  student_id: string; assigned_by: string | null;
};

export const Route = createFileRoute("/tasks")({
  head: () => ({ meta: [{ title: "Tasks · SIMS" }] }),
  component: TasksPage,
});

const COLUMNS: { key: TaskStatus; title: string }[] = [
  { key: "todo", title: "To do" },
  { key: "in-progress", title: "In progress" },
  { key: "submitted", title: "Submitted" },
  { key: "graded", title: "Graded" },
];

function TasksPage() {
  const { user, role } = useRole();
  const { hasActivePlacement, loading: placementLoading } = usePlacement();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<{ id: string; full_name: string | null; email: string | null }[]>([]);
  const [form, setForm] = useState<{ title: string; description: string; priority: TaskPriority; due_date: string; student_id: string }>({
    title: "", description: "", priority: "medium", due_date: "", student_id: "",
  });

  const canCreate = role === "admin" || role === "academic" || role === "industry";
  const gated = role === "student" && !placementLoading && !hasActivePlacement;

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setTasks((data ?? []) as Task[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user?.id]);

  useEffect(() => {
    if (!canCreate) return;
    (async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "student");
      const ids = (roles ?? []).map(r => r.user_id);
      if (ids.length === 0) return;
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      setStudents(profs ?? []);
    })();
  }, [canCreate]);

  const createTask = async () => {
    if (!form.title.trim() || !form.student_id) return toast.error("Title and student required");
    const { error } = await supabase.from("tasks").insert({
      title: form.title,
      description: form.description || null,
      priority: form.priority,
      due_date: form.due_date || null,
      student_id: form.student_id,
      assigned_by: user?.id ?? null,
    });
    if (error) return toast.error(error.message);
    toast.success("Task assigned");
    setOpen(false);
    setForm({ title: "", description: "", priority: "medium", due_date: "", student_id: "" });
    load();
  };

  const advance = async (t: Task) => {
    const next: TaskStatus = t.status === "todo" ? "in-progress" : t.status === "in-progress" ? "submitted" : t.status;
    if (next === t.status) return;
    const { error } = await supabase.from("tasks").update({ status: next }).eq("id", t.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <AppShell>
      <PageHeader
        title="Tasks"
        description="Industry-assigned tasks tracked through to grading."
        actions={gated ? null : canCreate ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">+ Assign task</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign task</DialogTitle>
                <DialogDescription>Assign work to an intern.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                <div>
                  <Label>Student</Label>
                  <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Pick student" /></SelectTrigger>
                    <SelectContent>
                      {students.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.full_name ?? s.email ?? s.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Priority</Label>
                    <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as TaskPriority })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Due date</Label><Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={createTask}>Assign</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null}
      />
      {gated ? <PlacementRequired feature="task tracking" /> : (
      <>
      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
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
                  <Card key={t.id} className="cursor-pointer" onClick={() => advance(t)}>
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
                      {t.due_date && <div className="text-xs text-muted-foreground">Due {t.due_date}</div>}
                      {t.grade && <Badge className="bg-emerald-100 text-emerald-700">{t.grade}</Badge>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      </>
      )}
    </AppShell>
  );
}