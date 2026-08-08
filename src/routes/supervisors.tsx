import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/lib/role-context";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Supervisor = {
  id: string; name: string; affiliation: string | null; email: string | null; user_id: string | null;
  type: "academic" | "industry"; capacity: number; load: number; pending: number;
};

export const Route = createFileRoute("/supervisors")({
  head: () => ({ meta: [{ title: "Supervisors · SIMS" }] }),
  component: SupervisorsPage,
});

function SupervisorsPage() {
  const { role } = useRole();
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; affiliation: string; email: string; type: "academic" | "industry"; capacity: number }>({
    name: "", affiliation: "", email: "", type: "academic", capacity: 10,
  });
  const resetForm = () => setForm({ name: "", affiliation: "", email: "", type: "academic", capacity: 10 });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("supervisors").select("*").order("name");
    if (error) toast.error(error.message);
    else setSupervisors((data ?? []) as Supervisor[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name.trim()) return toast.error("Name required");
    const payload = {
      name: form.name,
      affiliation: form.affiliation || null,
      email: form.email.trim() ? form.email.trim().toLowerCase() : null,
      type: form.type,
      capacity: Number(form.capacity) || 0,
    };
    const { error } = editingId
      ? await supabase.from("supervisors").update(payload).eq("id", editingId)
      : await supabase.from("supervisors").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editingId ? "Supervisor updated" : "Supervisor added");
    setOpen(false);
    setEditingId(null);
    resetForm();
    load();
  };

  const startEdit = (sv: Supervisor) => {
    setEditingId(sv.id);
    setForm({
      name: sv.name,
      affiliation: sv.affiliation ?? "",
      email: sv.email ?? "",
      type: sv.type,
      capacity: sv.capacity ?? 0,
    });
    setOpen(true);
  };

  const remove = async (sv: Supervisor) => {
    if (!confirm(`Delete supervisor "${sv.name}"? Students assigned to them will need reassigning.`)) return;
    const { error } = await supabase.from("supervisors").delete().eq("id", sv.id);
    if (error) return toast.error(error.message);
    toast.success("Supervisor deleted");
    load();
  };

  return (
    <AppShell>
      <PageHeader
        title="Supervisors"
        description="Academic and industry supervisors with workload visibility."
        actions={role === "admin" ? (
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => { setEditingId(null); resetForm(); setOpen(true); }}
          >
            + Invite supervisor
          </Button>
        ) : null}
      />

      {role === "admin" && (
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditingId(null); resetForm(); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit supervisor" : "Add supervisor"}</DialogTitle>
              <DialogDescription>
                Academic or industry supervisor profile. The email links this record to their account when they sign up.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Affiliation</Label><Input value={form.affiliation} onChange={e => setForm({ ...form, affiliation: e.target.value })} /></div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "academic" | "industry" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="industry">Industry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {!loading && supervisors.length === 0 && (
        <div className="text-sm text-muted-foreground">No supervisors yet.</div>
      )}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {supervisors.map((sv) => (
          <Card key={sv.id}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-semibold">{sv.name}</div>
                  <div className="text-xs text-muted-foreground">{sv.affiliation}</div>
                  <div className="text-xs text-muted-foreground">{sv.email ?? "no email on file"}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={sv.type === "academic" ? "default" : "secondary"}>{sv.type}</Badge>
                  {!sv.user_id && (
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
                      no account yet
                    </Badge>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>Workload</span><span className="text-muted-foreground">{sv.load}/{sv.capacity}</span>
                </div>
                <Progress value={sv.capacity ? (sv.load / sv.capacity) * 100 : 0} />
              </div>
              <div className="flex justify-between items-center text-xs mt-4 pt-3 border-t">
                <span className="text-muted-foreground">Pending reviews: <span className="font-medium text-foreground">{sv.pending}</span></span>
                {role === "admin" && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(sv)}>Edit</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(sv)}>Delete</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}