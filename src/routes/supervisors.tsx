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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Supervisor = {
  id: string; name: string; affiliation: string | null;
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
  const [form, setForm] = useState<{ name: string; affiliation: string; type: "academic" | "industry"; capacity: number }>({
    name: "", affiliation: "", type: "academic", capacity: 10,
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("supervisors").select("*").order("name");
    if (error) toast.error(error.message);
    else setSupervisors((data ?? []) as Supervisor[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const invite = async () => {
    if (!form.name.trim()) return toast.error("Name required");
    const { error } = await supabase.from("supervisors").insert({
      name: form.name, affiliation: form.affiliation || null,
      type: form.type, capacity: Number(form.capacity) || 0,
    });
    if (error) return toast.error(error.message);
    toast.success("Supervisor added");
    setOpen(false);
    setForm({ name: "", affiliation: "", type: "academic", capacity: 10 });
    load();
  };

  return (
    <AppShell>
      <PageHeader
        title="Supervisors"
        description="Academic and industry supervisors with workload visibility."
        actions={role === "admin" ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">+ Invite supervisor</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add supervisor</DialogTitle>
                <DialogDescription>Academic or industry supervisor profile.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
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
                <Button onClick={invite}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null}
      />
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
                </div>
                <Badge variant={sv.type === "academic" ? "default" : "secondary"}>{sv.type}</Badge>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>Workload</span><span className="text-muted-foreground">{sv.load}/{sv.capacity}</span>
                </div>
                <Progress value={sv.capacity ? (sv.load / sv.capacity) * 100 : 0} />
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