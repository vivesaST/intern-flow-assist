import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { deleteStudent, sendStudentPasswordReset } from "@/lib/admin-students.functions";
import { toast } from "sonner";

type Company = { id: string; name: string };
type Supervisor = { id: string; name: string; type: "academic" | "industry" };

export function StudentManageSheet({
  studentId, open, onOpenChange, isAdmin, onChanged,
}: {
  studentId: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  isAdmin: boolean;
  onChanged: () => void;
}) {
  const [profile, setProfile] = useState({ full_name: "", email: "", matric: "", department: "", level: "", semester: "" });
  const [placement, setPlacement] = useState<{ id: string | null; company_id: string; academic_supervisor_id: string; industry_supervisor_id: string; status: string; progress: number }>({
    id: null, company_id: "", academic_supervisor_id: "", industry_supervisor_id: "", status: "pending", progress: 0,
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const doDelete = useServerFn(deleteStudent);
  const doReset = useServerFn(sendStudentPasswordReset);

  useEffect(() => {
    if (!open || !studentId) return;
    (async () => {
      const [{ data: p }, { data: pl }, { data: c }, { data: s }] = await Promise.all([
        supabase.from("profiles").select("full_name, email, matric, department, level, semester").eq("id", studentId).maybeSingle(),
        supabase.from("placements").select("*").eq("student_id", studentId).maybeSingle(),
        supabase.from("companies").select("id, name").order("name"),
        supabase.from("supervisors").select("id, name, type").order("name"),
      ]);
      if (p) setProfile({
        full_name: p.full_name ?? "", email: p.email ?? "", matric: p.matric ?? "",
        department: p.department ?? "", level: (p as any).level ?? "", semester: (p as any).semester ?? "",
      });
      setPlacement({
        id: pl?.id ?? null,
        company_id: pl?.company_id ?? "",
        academic_supervisor_id: pl?.academic_supervisor_id ?? "",
        industry_supervisor_id: pl?.industry_supervisor_id ?? "",
        status: pl?.status ?? "pending",
        progress: pl?.progress ?? 0,
      });
      setCompanies((c ?? []) as Company[]);
      setSupervisors((s ?? []) as Supervisor[]);
    })();
  }, [open, studentId]);

  const saveProfile = async () => {
    if (!studentId) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name || null,
      email: profile.email || null,
      matric: profile.matric || null,
      department: profile.department || null,
      level: profile.level || null,
      semester: profile.semester || null,
    } as any).eq("id", studentId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    onChanged();
  };

  const savePlacement = async () => {
    if (!studentId) return;
    setSaving(true);
    const payload = {
      student_id: studentId,
      company_id: placement.company_id || null,
      academic_supervisor_id: placement.academic_supervisor_id || null,
      industry_supervisor_id: placement.industry_supervisor_id || null,
      status: placement.status as "pending" | "placed" | "completed",
      progress: placement.progress,
    };
    const { error } = placement.id
      ? await supabase.from("placements").update(payload).eq("id", placement.id)
      : await supabase.from("placements").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Placement updated");
    onChanged();
  };

  const handleDelete = async () => {
    if (!studentId) return;
    setBusy(true);
    try {
      await doDelete({ data: { userId: studentId } });
      toast.success("Student deleted");
      onOpenChange(false);
      onChanged();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete");
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    if (!profile.email) return toast.error("No email on file");
    setBusy(true);
    try {
      await doReset({ data: { email: profile.email } });
      toast.success("Password reset email sent");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to send reset");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Manage student</SheetTitle>
          <SheetDescription>{profile.full_name || profile.email}</SheetDescription>
        </SheetHeader>
        <Tabs defaultValue="profile" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
            <TabsTrigger value="placement" className="flex-1">Placement</TabsTrigger>
            {isAdmin && <TabsTrigger value="danger" className="flex-1">Danger</TabsTrigger>}
          </TabsList>

          <TabsContent value="profile" className="space-y-3 mt-4">
            <div><Label>Full name</Label><Input value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} /></div>
            <div><Label>Matric number</Label><Input value={profile.matric} onChange={e => setProfile({ ...profile, matric: e.target.value })} /></div>
            <div><Label>Department</Label><Input value={profile.department} onChange={e => setProfile({ ...profile, department: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Level</Label>
                <Select value={profile.level} onValueChange={(v) => setProfile({ ...profile, level: v })}>
                  <SelectTrigger><SelectValue placeholder="Level" /></SelectTrigger>
                  <SelectContent>
                    {["100","200","300","400","500"].map(l => <SelectItem key={l} value={l}>{l} Level</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Semester</Label>
                <Select value={profile.semester} onValueChange={(v) => setProfile({ ...profile, semester: v })}>
                  <SelectTrigger><SelectValue placeholder="Semester" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First">First</SelectItem>
                    <SelectItem value="Second">Second</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={saveProfile} disabled={saving} className="w-full">Save profile</Button>
          </TabsContent>

          <TabsContent value="placement" className="space-y-3 mt-4">
            <div>
              <Label>Company</Label>
              <Select value={placement.company_id} onValueChange={(v) => setPlacement({ ...placement, company_id: v })}>
                <SelectTrigger><SelectValue placeholder="Pick company" /></SelectTrigger>
                <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Academic supervisor</Label>
              <Select value={placement.academic_supervisor_id} onValueChange={(v) => setPlacement({ ...placement, academic_supervisor_id: v })}>
                <SelectTrigger><SelectValue placeholder="Pick supervisor" /></SelectTrigger>
                <SelectContent>{supervisors.filter(s => s.type === "academic").map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Industry supervisor</Label>
              <Select value={placement.industry_supervisor_id} onValueChange={(v) => setPlacement({ ...placement, industry_supervisor_id: v })}>
                <SelectTrigger><SelectValue placeholder="Pick mentor" /></SelectTrigger>
                <SelectContent>{supervisors.filter(s => s.type === "industry").map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={placement.status} onValueChange={(v) => setPlacement({ ...placement, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="placed">Placed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Progress: {placement.progress}%</Label>
              <Slider value={[placement.progress]} max={100} step={5} onValueChange={(v) => setPlacement({ ...placement, progress: v[0] })} />
            </div>
            <Button onClick={savePlacement} disabled={saving} className="w-full">Save placement</Button>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="danger" className="space-y-4 mt-4">
              <div className="rounded-md border p-3 space-y-2">
                <div className="font-medium text-sm">Send password reset</div>
                <p className="text-xs text-muted-foreground">Emails the student a password recovery link.</p>
                <Button variant="outline" disabled={busy} onClick={handleReset}>Send reset email</Button>
              </div>
              <div className="rounded-md border border-destructive/40 p-3 space-y-2">
                <div className="font-medium text-sm text-destructive">Delete student</div>
                <p className="text-xs text-muted-foreground">Permanently removes the user and cascades all related data. This cannot be undone.</p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={busy}>Delete student</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this student?</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently remove {profile.full_name || profile.email} and all their data.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TabsContent>
          )}
        </Tabs>
        <SheetFooter className="mt-4" />
      </SheetContent>
    </Sheet>
  );
}