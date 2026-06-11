import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/role-context";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile · SIMS" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", matric: "", department: "" });

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data, error } = await supabase
        .from("profiles").select("full_name, email, matric, department").eq("id", user.id).maybeSingle();
      if (error) toast.error(error.message);
      else if (data) setForm({
        full_name: data.full_name ?? "", email: data.email ?? user.email ?? "",
        matric: data.matric ?? "", department: data.department ?? "",
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
    }).eq("id", user.id);
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
              <div><Label>Matric number</Label><Input value={form.matric} onChange={e => setForm({ ...form, matric: e.target.value })} /></div>
              <div><Label>Department</Label><Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
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