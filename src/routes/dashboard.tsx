import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRole } from "@/lib/role-context";
import {
  currentUser,
  stats,
  logEntries,
  tasks,
  students,
  supervisors,
  submissionTrend,
} from "@/lib/mock-data";
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

  const heading =
    role === "student"
      ? `Welcome back, ${currentUser.name.split(" ")[0]}`
      : role === "academic"
      ? "Academic supervisor dashboard"
      : role === "industry"
      ? "Industry supervisor dashboard"
      : "Internship office dashboard";

  const description =
    role === "student"
      ? `${currentUser.position} · ${currentUser.company}`
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
            <StatCard icon={TrendingUp} label="Overall grade" value={stats.overallGrade} tone="accent" />
          </div>

          <div className="grid lg:grid-cols-3 gap-4 mt-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Internship progress</CardTitle>
                <CardDescription>{currentUser.startDate} → {currentUser.endDate}</CardDescription>
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
                <div className="grid grid-cols-2 gap-3 text-sm pt-3 border-t">
                  <div>
                    <div className="text-muted-foreground text-xs">Academic supervisor</div>
                    <div className="font-medium">{currentUser.academicSupervisor}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Industry supervisor</div>
                    <div className="font-medium">{currentUser.industrySupervisor}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Open tasks</CardTitle>
                <CardDescription>From your industry supervisor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {tasks.filter(t => t.status !== "graded").slice(0, 4).map((t) => (
                  <div key={t.id} className="flex items-start gap-3 pb-3 border-b last:border-b-0 last:pb-0">
                    <div className={`h-2 w-2 rounded-full mt-1.5 ${t.priority === "high" ? "bg-destructive" : t.priority === "medium" ? "bg-accent" : "bg-muted-foreground"}`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{t.title}</div>
                      <div className="text-xs text-muted-foreground">Due {t.due}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{t.status}</Badge>
                  </div>
                ))}
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
                {logEntries.slice(0, 4).map((e) => (
                  <div key={e.id} className="flex items-center gap-4 p-3 rounded-md hover:bg-muted/40">
                    <div className="text-xs font-mono text-muted-foreground w-16">W{e.week}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{e.title}</div>
                      <div className="text-xs text-muted-foreground">{e.date} · {e.hours} hrs</div>
                    </div>
                    <StatusBadge status={e.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {role === "academic" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Supervisees" value="12" hint="across 3 companies" />
            <StatCard icon={AlertCircle} label="Pending approvals" value="3" tone="accent" />
            <StatCard icon={CheckCircle2} label="Evaluations done" value="9/12" />
            <StatCard icon={TrendingUp} label="Avg. final score" value="84%" />
          </div>
          <Card className="mt-6">
            <CardHeader><CardTitle>My supervisees</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {students.filter(s => s.academicSupervisor === "Dr. Bola Adeyemi").map(s => (
                  <div key={s.id} className="flex items-center gap-4 p-3 rounded-md hover:bg-muted/40">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center text-sm font-medium">
                      {s.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.matric} · {s.company ?? "—"}</div>
                    </div>
                    <div className="w-32">
                      <Progress value={s.progress} />
                    </div>
                    <Badge variant="outline">{s.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {role === "industry" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Briefcase} label="Active interns" value="4" hint="across 2 teams" />
            <StatCard icon={AlertCircle} label="Logbook pending" value="2" tone="accent" />
            <StatCard icon={CheckCircle2} label="Tasks graded" value="23" />
            <StatCard icon={TrendingUp} label="Avg. score" value="89%" />
          </div>
          <Card className="mt-6">
            <CardHeader><CardTitle>Your assigned interns</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {students.filter(s => s.industrySupervisor === "Daniel Yusuf").map(s => (
                  <div key={s.id} className="flex items-center gap-4 p-3 rounded-md hover:bg-muted/40">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center text-sm font-medium">
                      {s.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.matric}</div>
                    </div>
                    <div className="w-32"><Progress value={s.progress} /></div>
                    <Badge variant="outline">{s.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {role === "admin" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={GraduationCap} label="Students" value={`${students.length}`} hint={`${students.filter(s => s.status === "placed").length} placed`} />
            <StatCard icon={Briefcase} label="Companies" value="6" />
            <StatCard icon={Users} label="Supervisors" value={`${supervisors.length}`} />
            <StatCard icon={AlertCircle} label="Pending placement" value={`${students.filter(s => s.status === "pending").length}`} tone="accent" />
          </div>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Submission trend (last 7 weeks)</CardTitle>
              <CardDescription>Logbook submissions vs. approvals across all interns (%)</CardDescription>
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