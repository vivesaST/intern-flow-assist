import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useRole } from "@/lib/role-context";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile · SIMS" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const { role } = useRole();
  const isStudent = role === "student";
  const showUniversity = isStudent || role === "academic";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", matric: "", department: "", level: "", semester: "", company_name: "", university: "" });

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data, error } = await supabase
        .from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (error) toast.error(error.message);
      else if (data) setForm({
        full_name: data.full_name ?? "", email: data.email ?? user.email ?? "",
        matric: data.matric ?? "", department: data.department ?? "",
        level: (data as any).level ?? "", semester: (data as any).semester ?? "",
        company_name: (data as any).company_name ?? "", university: (data as any).university ?? "",
      });
      setLoading(false);
    })();
  }, [user?.id]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name || null,
      matric: form.matric || null,
      department: form.department || null,
      level: form.level || null,
      semester: form.semester || null,
      company_name: form.company_name || null,
      university: form.university || null,
    } as any).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  };

  const initials = (form.full_name || form.email || "U").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  if (!user) return (
    <AppShell>
      <PageHeader title="Profile & settings" description="Sign in to manage your profile." />
    </AppShell>
  );

  return (
    <AppShell>
      <PageHeader title="Profile & settings" description="Your account and notification preferences." />
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Personal information visible to your supervisors.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" size="sm">Upload photo</Button>
                <p className="text-xs text-muted-foreground mt-1">PNG / JPG, max 2MB</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div><Label>Full name</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={form.email} disabled /></div>
              {isStudent && (
                <div><Label>Matric number</Label><Input value={form.matric} onChange={e => setForm({ ...form, matric: e.target.value })} /></div>
              )}
              {isStudent && (
                <div><Label>Department</Label><Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
              )}
              {showUniversity && (
                <div><Label>University</Label><Input value={form.university} placeholder="Your university" onChange={e => setForm({ ...form, university: e.target.value })} /></div>
              )}
              {role === "industry" && (
                <div><Label>Company / organisation</Label><Input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} /></div>
              )}
              {isStudent && (
              <div>
                <Label>Level</Label>
                <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    {["100","200","300","400","500"].map(l => <SelectItem key={l} value={l}>{l} Level</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              )}
              {isStudent && (
              <div>
                <Label>Semester</Label>
                <Select value={form.semester} onValueChange={(v) => setForm({ ...form, semester: v })}>
                  <SelectTrigger><SelectValue placeholder="Select semester" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First">First semester</SelectItem>
                    <SelectItem value="Second">Second semester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              )}
            </div>
            <Button onClick={save} disabled={saving || loading}>{saving ? "Saving…" : "Save changes"}</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Choose what you want to be notified about.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["Logbook approvals", true],
              ["New tasks assigned", true],
              ["Evaluation comments", true],
              ["Weekly digest", false],
              ["System announcements", false],
            ].map(([label, val]) => (
              <div key={label as string} className="flex items-center justify-between">
                <Label className="text-sm">{label as string}</Label>
                <Switch defaultChecked={val as boolean} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}