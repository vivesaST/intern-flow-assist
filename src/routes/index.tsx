import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  ClipboardCheck,
  Briefcase,
  BarChart3,
  Users,
  GraduationCap,
  Building2,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SIMS — Smart Internship Management System" },
      { name: "description", content: "Automate internship logbooks, supervisor assignment, evaluations, and reporting in one platform built for institutions and industry." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: BookOpen, title: "Logbook tracking", desc: "Weekly entries with approval workflows for academic and industry supervisors." },
  { icon: Briefcase, title: "Placement matching", desc: "Match students to companies and supervisors with workload-aware assignment." },
  { icon: ClipboardCheck, title: "Evaluations & rubrics", desc: "Mid-term and final assessments with structured rubrics and moderation." },
  { icon: BarChart3, title: "Reports & analytics", desc: "Real-time dashboards on submissions, scores, and supervisor workload." },
  { icon: ShieldCheck, title: "Role-based access", desc: "Tailored experiences for students, supervisors, and coordinators." },
  { icon: Users, title: "Supervisor coordination", desc: "Assign, balance load, and moderate across academic and industry mentors." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md bg-primary text-primary-foreground grid place-items-center font-bold">S</div>
            <div className="leading-tight">
              <div className="font-semibold text-foreground">SIMS</div>
              <div className="text-xs text-muted-foreground">Smart Internship Management</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#audiences" className="hover:text-foreground">For institutions & industry</a>
            <a href="#stack" className="hover:text-foreground">Technology</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost"><Link to="/login">Sign in</Link></Button>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/dashboard">Open demo <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <Badge className="bg-accent text-accent-foreground mb-4">Final Year Project · 2026</Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              Automate the entire internship lifecycle — from placement to evaluation.
            </h1>
            <p className="mt-5 text-primary-foreground/80 text-lg">
              SIMS gives universities and host companies one platform to manage logbooks,
              supervisor assignments, tasks, and evaluations with full transparency.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/dashboard">Explore the demo</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/login">Sign in as another role</Link>
              </Button>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-6 max-w-md">
              {[
                { k: "60%", v: "Less paperwork" },
                { k: "4×", v: "Faster approvals" },
                { k: "100%", v: "Audit trail" },
              ].map((s) => (
                <div key={s.v}>
                  <div className="text-2xl font-bold text-accent">{s.k}</div>
                  <div className="text-xs text-primary-foreground/70">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 backdrop-blur p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium">This week · Logbook</div>
                <Badge className="bg-accent text-accent-foreground">Approved</Badge>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  ["Mon", "Sprint planning · 8 hrs"],
                  ["Tue", "Built form components · 9 hrs"],
                  ["Wed", "Code review · 7 hrs"],
                  ["Thu", "UAT prep · 8 hrs"],
                  ["Fri", "Demo + retro · 6 hrs"],
                ].map(([d, a]) => (
                  <div key={d} className="flex justify-between border-b border-primary-foreground/10 pb-2">
                    <span className="text-primary-foreground/60 w-10">{d}</span>
                    <span className="flex-1">{a}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-xs text-primary-foreground/70">
                Reviewed by Daniel Yusuf · Co-signed by Dr. Bola Adeyemi
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight">Everything an internship office needs</h2>
            <p className="text-muted-foreground mt-3">
              Replace spreadsheets, paper logbooks, and email threads with a single, role-aware system.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
            {features.map((f) => (
              <div key={f.title} className="rounded-lg border bg-card p-6 hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-md bg-accent/15 text-accent grid place-items-center mb-4">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audiences */}
      <section id="audiences" className="py-20 bg-muted/40">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border bg-card p-8">
            <GraduationCap className="h-8 w-8 text-primary mb-4" />
            <h3 className="text-xl font-semibold">For institutions</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground list-disc pl-5">
              <li>Coordinator dashboard for placement & supervisor assignment</li>
              <li>Workload-balanced supervisor matching</li>
              <li>Centralised evaluations and exportable reports</li>
              <li>Audit trail for accreditation & quality assurance</li>
            </ul>
          </div>
          <div className="rounded-xl border bg-card p-8">
            <Building2 className="h-8 w-8 text-primary mb-4" />
            <h3 className="text-xl font-semibold">For industry partners</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground list-disc pl-5">
              <li>Assign tasks and approve weekly logbook entries</li>
              <li>Structured mid-term & final evaluations with rubrics</li>
              <li>Track intern progress with one click</li>
              <li>Securely share feedback with the host institution</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Stack */}
      <section id="stack" className="py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Built on a modern stack</h2>
          <p className="text-muted-foreground mt-3">React · TypeScript · TanStack Start · Tailwind · shadcn/ui · Recharts</p>
        </div>
      </section>

      <footer className="border-t bg-primary text-primary-foreground/80">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm">
          <div>© 2026 SIMS · Final Year Project</div>
          <div>Smart Internship Management System</div>
        </div>
      </footer>
    </div>
  );
}
