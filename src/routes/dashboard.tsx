import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth, useRole } from "@/lib/role-context";
import { supabase } from "@/integrations/supabase/client";
import {
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · SIMS" }] }),
  component: Dashboard,
});

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: any;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "accent";
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
          <div className={`h-8 w-8 rounded-md grid place-items-center ${tone === "accent" ? "bg-accent/15 text-accent" : "bg-primary/10 text-primary"}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl font-semibold mt-3">{value}</div>
        {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { role } = useRole();
  const { user } = useAuth();
  const [name, setName] = useState<string>("");
  const [stats, setStats] = useState({
    hoursLogged: 0, hoursTarget: 480,
    weeksCompleted: 0, totalWeeks: 24,
    tasksDone: 0, tasksOpen: 0,
    logsApprovedPending: 0,
    totalStudents: 0, totalCompanies: 0, totalSupervisors: 0, pendingPlacement: 0,
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [openTasks, setOpenTasks] = useState<any[]>([]);
  const [submissionTrend, setSubmissionTrend] = useState<{ week: string; submitted: number; approved: number }[]>([]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      if (role === "student") {
        const [{ data: logs }, { data: ts }] = await Promise.all([
          supabase.from("log_entries").select("*").eq("student_id", user.id).order("week", { ascending: false }),
          supabase.from("tasks").select("*").eq("student_id", user.id).order("created_at", { ascending: false }),
        ]);
        const { data: prof } = await supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle();
        setName((prof?.full_name ?? prof?.email ?? "").split(" ")[0] || "there");
        const hours = (logs ?? []).reduce((a, l) => a + (l.hours ?? 0), 0);
        const weeks = new Set((logs ?? []).map(l => l.week)).size;
        setStats(s => ({
          ...s,
          hoursLogged: hours, weeksCompleted: weeks,
          tasksDone: (ts ?? []).filter(t => t.status === "graded").length,
          tasksOpen: (ts ?? []).filter(t => t.status !== "graded").length,
        }));
        setRecentLogs((logs ?? []).slice(0, 4));
        setOpenTasks((ts ?? []).filter(t => t.status !== "graded").slice(0, 4));
      } else if (role === "admin") {
        const [{ count: cStud }, { count: cComp }, { count: cSup }, { data: pls }, { data: logs }] = await Promise.all([
          supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "student"),
          supabase.from("companies").select("*", { count: "exact", head: true }),
          supabase.from("supervisors").select("*", { count: "exact", head: true }),
          supabase.from("placements").select("status"),
          supabase.from("log_entries").select("week, status"),
        ]);
        setStats(s => ({
          ...s,
          totalStudents: cStud ?? 0, totalCompanies: cComp ?? 0, totalSupervisors: cSup ?? 0,
          pendingPlacement: (pls ?? []).filter(p => p.status === "pending").length,
        }));
        const byWeek = new Map<number, { submitted: number; approved: number }>();
        (logs ?? []).forEach((l: any) => {
          const w = byWeek.get(l.week) ?? { submitted: 0, approved: 0 };
          if (l.status !== "draft") w.submitted++;
          if (l.status === "approved") w.approved++;
          byWeek.set(l.week, w);
        });
        setSubmissionTrend(Array.from(byWeek.entries()).sort((a, b) => a[0] - b[0]).map(([w, v]) => ({ week: `W${w}`, ...v })));
      } else {
        // academic / industry: show pending logbook approvals + task counts
        const [{ count: pendingLogs }, { count: gradedTasks }] = await Promise.all([
          supabase.from("log_entries").select("*", { count: "exact", head: true }).eq("status", "submitted"),
          supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "graded"),
        ]);
        setStats(s => ({ ...s, logsApprovedPending: pendingLogs ?? 0, tasksDone: gradedTasks ?? 0 }));
      }
    })();
  }, [role, user?.id]);

  const heading =
    role === "student"
      ? `Welcome back, ${name || "there"}`
      : role === "academic"
      ? "Academic supervisor dashboard"
      : role === "industry"
      ? "Industry supervisor dashboard"
      : "Internship office dashboard";

  const description =
    role === "student"
      ? "Your internship progress at a glance."
      : role === "academic"
      ? "Review logbooks, moderate evaluations, monitor your supervisees."
      : role === "industry"
      ? "Assign tasks, approve logbook entries, evaluate interns."
      : "Manage placements, supervisors, and institution-wide reporting.";

  return (
    <AppShell>
      <PageHeader
        title={heading}
        description={description}
        actions={
          role === "student" ? (
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/logbook">+ New logbook entry</Link>
            </Button>
          ) : role === "admin" ? (
            <Button asChild><Link to="/placements">Manage placements</Link></Button>
          ) : null
        }
      />

      {role === "student" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Clock} label="Hours logged" value={`${stats.hoursLogged}`} hint={`of ${stats.hoursTarget} target`} />
            <StatCard icon={BookOpen} label="Weeks completed" value={`${stats.weeksCompleted}/${stats.totalWeeks}`} />
            <StatCard icon={CheckCircle2} label="Tasks done" value={`${stats.tasksDone}`} hint={`${stats.tasksOpen} open`} tone="accent" />
            <StatCard icon={TrendingUp} label="Open tasks" value={`${stats.tasksOpen}`} tone="accent" />
          </div>

          <div className="grid lg:grid-cols-3 gap-4 mt-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Internship progress</CardTitle>
                <CardDescription>Weeks and hours logged</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Weeks</span><span className="text-muted-foreground">{stats.weeksCompleted}/{stats.totalWeeks}</span>
                  </div>
                  <Progress value={(stats.weeksCompleted / stats.totalWeeks) * 100} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Hours</span><span className="text-muted-foreground">{stats.hoursLogged}/{stats.hoursTarget}</span>
                  </div>
                  <Progress value={(stats.hoursLogged / stats.hoursTarget) * 100} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Open tasks</CardTitle>
                <CardDescription>From your industry supervisor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {openTasks.map((t) => (
                  <div key={t.id} className="flex items-start gap-3 pb-3 border-b last:border-b-0 last:pb-0">
                    <div className={`h-2 w-2 rounded-full mt-1.5 ${t.priority === "high" ? "bg-destructive" : t.priority === "medium" ? "bg-accent" : "bg-muted-foreground"}`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{t.title}</div>
                      {t.due_date && <div className="text-xs text-muted-foreground">Due {t.due_date}</div>}
                    </div>
                    <Badge variant="outline" className="text-[10px]">{t.status}</Badge>
                  </div>
                ))}
                {openTasks.length === 0 && <div className="text-xs text-muted-foreground">No open tasks.</div>}
                <Button asChild variant="ghost" className="w-full"><Link to="/tasks">View all tasks →</Link></Button>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent logbook entries</CardTitle>
              <CardDescription>Latest weekly submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentLogs.map((e) => (
                  <div key={e.id} className="flex items-center gap-4 p-3 rounded-md hover:bg-muted/40">
                    <div className="text-xs font-mono text-muted-foreground w-16">W{e.week}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{e.title}</div>
                      <div className="text-xs text-muted-foreground">{e.entry_date} · {e.hours} hrs</div>
                    </div>
                    <StatusBadge status={e.status} />
                  </div>
                ))}
                {recentLogs.length === 0 && <div className="text-xs text-muted-foreground">No entries yet.</div>}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {role === "academic" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Supervisees" value={`${stats.totalStudents}`} />
            <StatCard icon={AlertCircle} label="Logbooks awaiting" value={`${stats.logsApprovedPending}`} tone="accent" />
            <StatCard icon={CheckCircle2} label="Tasks graded" value={`${stats.tasksDone}`} />
            <StatCard icon={TrendingUp} label="Companies" value={`${stats.totalCompanies}`} />
          </div>
        </>
      )}

      {role === "industry" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Briefcase} label="Active interns" value={`${stats.totalStudents}`} />
            <StatCard icon={AlertCircle} label="Logbook pending" value={`${stats.logsApprovedPending}`} tone="accent" />
            <StatCard icon={CheckCircle2} label="Tasks graded" value={`${stats.tasksDone}`} />
            <StatCard icon={TrendingUp} label="Companies" value={`${stats.totalCompanies}`} />
          </div>
        </>
      )}

      {role === "admin" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={GraduationCap} label="Students" value={`${stats.totalStudents}`} />
            <StatCard icon={Briefcase} label="Companies" value={`${stats.totalCompanies}`} />
            <StatCard icon={Users} label="Supervisors" value={`${stats.totalSupervisors}`} />
            <StatCard icon={AlertCircle} label="Pending placement" value={`${stats.pendingPlacement}`} tone="accent" />
          </div>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Submission trend (last 7 weeks)</CardTitle>
              <CardDescription>Logbook submissions vs. approvals across all interns</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={submissionTrend}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="week" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Area dataKey="submitted" stroke="var(--color-chart-1)" fill="url(#g1)" />
                  <Area dataKey="approved" stroke="var(--color-chart-2)" fill="url(#g2)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </AppShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
    submitted: "bg-blue-100 text-blue-700 border-blue-200",
    revision: "bg-amber-100 text-amber-700 border-amber-200",
    draft: "bg-muted text-muted-foreground",
  };
  return <Badge variant="outline" className={map[status] ?? ""}>{status}</Badge>;
}