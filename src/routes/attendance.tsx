import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, LogIn, LogOut, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useRole } from "@/lib/role-context";
import { usePlacement } from "@/hooks/use-placement";
import { PlacementRequired } from "@/components/placement-required";

export const Route = createFileRoute("/attendance")({
  head: () => ({ meta: [{ title: "Attendance · SI" }] }),
  component: AttendancePage,
});

type Record = {
  id: string;
  student_id: string;
  clock_in: string;
  clock_out: string | null;
  work_date: string;
  hours: number | null;
  notes: string | null;
};

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
  });
}
function weekOf(d: string) {
  const dt = new Date(d + "T00:00:00");
  const first = new Date(dt);
  first.setDate(dt.getDate() - dt.getDay());
  return first.toISOString().slice(0, 10);
}
function monthOf(d: string) {
  return d.slice(0, 7);
}
function computeHours(inIso: string, outIso: string) {
  const ms = new Date(outIso).getTime() - new Date(inIso).getTime();
  return Math.round((ms / 3600000) * 100) / 100;
}

function AttendancePage() {
  const { role } = useRole();
  const isStudent = role === "student";
  return isStudent ? <StudentView /> : <StaffView />;
}

function StudentView() {
  const { user } = useAuth();
  const { hasActivePlacement, loading: plLoading } = usePlacement();
  const [records, setRecords] = useState<Record[]>([]);
  const [active, setActive] = useState<Record | null>(null);
  const [notes, setNotes] = useState("");
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from("attendance")
      .select("*")
      .eq("student_id", user.id)
      .order("clock_in", { ascending: false });
    const list = (data ?? []) as Record[];
    setRecords(list);
    setActive(list.find((r) => !r.clock_out) ?? null);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  async function clockIn() {
    if (!user) return;
    const { error } = await (supabase as any).from("attendance").insert({
      student_id: user.id,
      notes: notes || null,
    });
    if (error) return toast.error(error.message);
    setNotes("");
    toast.success("Clocked in");
    load();
  }

  async function clockOut() {
    if (!active) return;
    const out = new Date().toISOString();
    const { error } = await (supabase as any).from("attendance").update({
      clock_out: out,
      hours: computeHours(active.clock_in, out),
      notes: notes || active.notes,
    }).eq("id", active.id);
    if (error) return toast.error(error.message);
    setNotes("");
    toast.success("Clocked out");
    load();
  }

  if (plLoading) return <AppShell><div className="p-6">Loading…</div></AppShell>;
  if (!hasActivePlacement) {
    return (
      <AppShell>
        <PageHeader title="Attendance" description="Clock in and out of your internship." />
        <PlacementRequired feature="attendance" />
      </AppShell>
    );
  }

  // Summaries
  const today = new Date().toISOString().slice(0, 10);
  const thisWeek = weekOf(today);
  const thisMonth = monthOf(today);
  const sumHours = (rs: Record[]) =>
    rs.reduce((a, r) => a + (r.hours ?? (r.clock_out ? 0 : (Date.now() - new Date(r.clock_in).getTime()) / 3600000)), 0);
  const todayHours = sumHours(records.filter((r) => r.work_date === today));
  const weekHours = sumHours(records.filter((r) => weekOf(r.work_date) === thisWeek));
  const monthHours = sumHours(records.filter((r) => monthOf(r.work_date) === thisMonth));

  const elapsed = active ? Math.floor((now.getTime() - new Date(active.clock_in).getTime()) / 1000) : 0;
  const hh = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <AppShell>
      <PageHeader title="Attendance" description="Clock in when you start work, and clock out when you finish." />

      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <StatCard label="Today" value={`${todayHours.toFixed(2)} h`} />
        <StatCard label="This week" value={`${weekHours.toFixed(2)} h`} />
        <StatCard label="This month" value={`${monthHours.toFixed(2)} h`} />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {active ? "Currently clocked in" : "Ready to clock in"}
          </CardTitle>
          <CardDescription>
            {active
              ? `Since ${fmtTime(active.clock_in)} · ${fmtDate(active.work_date)}`
              : now.toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {active && (
            <div className="text-4xl font-mono font-semibold tabular-nums">
              {hh}:{mm}:{ss}
            </div>
          )}
          <Textarea
            placeholder={active ? "Add end-of-session notes (optional)" : "What are you working on today? (optional)"}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
          {active ? (
            <Button onClick={clockOut} size="lg" variant="destructive">
              <LogOut className="h-4 w-4 mr-2" /> Clock out
            </Button>
          ) : (
            <Button onClick={clockIn} size="lg">
              <LogIn className="h-4 w-4 mr-2" /> Clock in
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" /> History
          </CardTitle>
          <CardDescription>{records.length} records</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <div>Loading…</div> : records.length === 0 ? (
            <div className="text-sm text-muted-foreground">No attendance yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Clock in</TableHead>
                  <TableHead>Clock out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{fmtDate(r.work_date)}</TableCell>
                    <TableCell>{fmtTime(r.clock_in)}</TableCell>
                    <TableCell>
                      {r.clock_out ? fmtTime(r.clock_out) : <Badge variant="secondary">Active</Badge>}
                    </TableCell>
                    <TableCell>{r.hours != null ? `${r.hours} h` : "—"}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground text-sm">{r.notes ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

type StaffRow = Record & { student_name?: string | null; student_email?: string | null };

function StaffView() {
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [students, setStudents] = useState<{ id: string; full_name: string | null }[]>([]);
  const [studentFilter, setStudentFilter] = useState<string>("all");
  const [rangeFilter, setRangeFilter] = useState<string>("week");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data: att } = await (supabase as any)
      .from("attendance")
      .select("*")
      .order("clock_in", { ascending: false })
      .limit(500);
    const list = (att ?? []) as Record[];
    const ids = Array.from(new Set(list.map((r) => r.student_id)));
    const { data: profs } = ids.length
      ? await supabase.from("profiles").select("id, full_name, email").in("id", ids)
      : { data: [] as any };
    const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
    setRows(list.map((r) => ({
      ...r,
      student_name: (map.get(r.student_id) as any)?.full_name ?? null,
      student_email: (map.get(r.student_id) as any)?.email ?? null,
    })));
    setStudents(Array.from(map.values()).map((p: any) => ({ id: p.id, full_name: p.full_name })));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const today = new Date().toISOString().slice(0, 10);
  const thisWeek = weekOf(today);
  const thisMonth = monthOf(today);

  const filtered = rows.filter((r) => {
    if (studentFilter !== "all" && r.student_id !== studentFilter) return false;
    if (rangeFilter === "today" && r.work_date !== today) return false;
    if (rangeFilter === "week" && weekOf(r.work_date) !== thisWeek) return false;
    if (rangeFilter === "month" && monthOf(r.work_date) !== thisMonth) return false;
    return true;
  });

  const totalHours = filtered.reduce((a, r) => a + (r.hours ?? 0), 0);
  const activeNow = rows.filter((r) => !r.clock_out).length;
  const uniqueStudents = new Set(filtered.map((r) => r.student_id)).size;

  return (
    <AppShell>
      <PageHeader title="Attendance monitoring" description="Track student clock-ins across all placements." />

      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <StatCard label="Currently clocked in" value={String(activeNow)} />
        <StatCard label="Students (filtered)" value={String(uniqueStudents)} />
        <StatCard label="Total hours (filtered)" value={`${totalHours.toFixed(2)} h`} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle>Attendance records</CardTitle>
              <CardDescription>Last 500 entries</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={rangeFilter} onValueChange={setRangeFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This week</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
              <Select value={studentFilter} onValueChange={setStudentFilter}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="All students" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All students</SelectItem>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.full_name ?? "Unnamed"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <div>Loading…</div> : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground">No records match.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>In</TableHead>
                  <TableHead>Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.student_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{r.student_email ?? ""}</div>
                    </TableCell>
                    <TableCell>{fmtDate(r.work_date)}</TableCell>
                    <TableCell>{fmtTime(r.clock_in)}</TableCell>
                    <TableCell>{r.clock_out ? fmtTime(r.clock_out) : <Badge variant="secondary">Active</Badge>}</TableCell>
                    <TableCell>{r.hours != null ? `${r.hours} h` : "—"}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground text-sm">{r.notes ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}