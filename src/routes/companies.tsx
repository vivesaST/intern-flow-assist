import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/lib/role-context";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Company = {
  id: string; name: string; sector: string | null;
  slots: number; filled: number; contact: string | null; rating: number | null;
};

export const Route = createFileRoute("/companies")({
  head: () => ({ meta: [{ title: "Companies · SIMS" }] }),
  component: CompaniesPage,
});

function CompaniesPage() {
  const { role } = useRole();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", sector: "", slots: 5, contact: "" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("companies").select("*").order("name");
    if (error) toast.error(error.message);
    else setCompanies((data ?? []) as Company[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const addCompany = async () => {
    if (!form.name.trim()) return toast.error("Name required");
    const { error } = await supabase.from("companies").insert({
      name: form.name, sector: form.sector || null, slots: Number(form.slots) || 0,
      contact: form.contact || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Company added");
    setOpen(false);
    setForm({ name: "", sector: "", slots: 5, contact: "" });
    load();
  };

  return (
    <AppShell>
      <PageHeader
        title="Partner companies"
        description="Industry hosts with available internship slots."
        actions={role === "admin" ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">+ Add company</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add company</DialogTitle>
                <DialogDescription>Partner organisation hosting interns.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Sector</Label><Input value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })} /></div>
                <div><Label>Slots</Label><Input type="number" value={form.slots} onChange={e => setForm({ ...form, slots: Number(e.target.value) })} /></div>
                <div><Label>Contact</Label><Input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={addCompany}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null}
      />
      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {!loading && companies.length === 0 && (
        <div className="text-sm text-muted-foreground">No companies yet.</div>
      )}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{c.name}</div>
                  {c.sector && <Badge variant="secondary" className="mt-1">{c.sector}</Badge>}
                </div>
                {c.rating != null && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-3 w-3 fill-accent text-accent" /> {c.rating}
                  </div>
                )}
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>Slots filled</span><span className="text-muted-foreground">{c.filled}/{c.slots}</span>
                </div>
                <Progress value={c.slots ? (c.filled / c.slots) * 100 : 0} />
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