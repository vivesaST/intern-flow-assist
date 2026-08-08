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
  verified: boolean; address: string | null;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", sector: "", slots: 5, contact: "", address: "" });

  const resetForm = () => setForm({ name: "", sector: "", slots: 5, contact: "", address: "" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("companies").select("*").order("name");
    if (error) toast.error(error.message);
    else setCompanies((data ?? []) as Company[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setVerified = async (id: string, verified: boolean) => {
    const { error } = await supabase.from("companies").update({ verified }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(verified ? "Company verified" : "Company marked unverified");
    load();
  };

  const saveCompany = async () => {
    if (!form.name.trim()) return toast.error("Name required");
    const payload = {
      name: form.name,
      sector: form.sector || null,
      slots: Number(form.slots) || 0,
      contact: form.contact || null,
      address: form.address || null,
    };
    const { error } = editingId
      ? await supabase.from("companies").update(payload).eq("id", editingId)
      : await supabase.from("companies").insert({ ...payload, verified: true });
    if (error) return toast.error(error.message);
    toast.success(editingId ? "Company updated" : "Company added");
    setOpen(false);
    setEditingId(null);
    resetForm();
    load();
  };

  const startEdit = (c: Company) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      sector: c.sector ?? "",
      slots: c.slots ?? 0,
      contact: c.contact ?? "",
      address: c.address ?? "",
    });
    setOpen(true);
  };

  const removeCompany = async (c: Company) => {
    if (!confirm(`Delete "${c.name}"? Placements linked to it will lose the company reference.`)) return;
    const { error } = await supabase.from("companies").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Company deleted");
    load();
  };

  return (
    <AppShell>
      <PageHeader
        title="Partner companies"
        description="Host organisations submitted by students, plus partners you add yourself. Verify each before placements go live."
        actions={role === "admin" ? (
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => { setEditingId(null); resetForm(); setOpen(true); }}
          >
            + Add company
          </Button>
        ) : null}
      />

      {role === "admin" && (
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditingId(null); resetForm(); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit company" : "Add company"}</DialogTitle>
              <DialogDescription>Partner organisation hosting interns.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Sector</Label><Input value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })} /></div>
              <div><Label>Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <div><Label>Slots</Label><Input type="number" value={form.slots} onChange={e => setForm({ ...form, slots: Number(e.target.value) })} /></div>
              <div><Label>Contact</Label><Input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={saveCompany}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
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
                  <div className="flex gap-1 mt-1">
                    {c.sector && <Badge variant="secondary">{c.sector}</Badge>}
                    <Badge variant="outline" className={c.verified
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : "bg-amber-100 text-amber-700 border-amber-200"}>
                      {c.verified ? "verified" : "unverified"}
                    </Badge>
                  </div>
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
              <div className="text-xs text-muted-foreground mt-4 pt-3 border-t flex items-center justify-between gap-2">
                <span>Contact: <span className="text-foreground">{c.contact ?? "—"}</span></span>
                {role === "admin" && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => setVerified(c.id, !c.verified)}>
                      {c.verified ? "Unverify" : "Verify"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => startEdit(c)}>Edit</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeCompany(c)}>
                      Delete
                    </Button>
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