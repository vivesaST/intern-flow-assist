import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  ClipboardCheck,
  Briefcase,
  BarChart3,
  Users,
  GraduationCap,
  Building2,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Internship (SI) — Internship Management Platform" },
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
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-end">
          <Button asChild variant="ghost"><Link to="/login">Sign in</Link></Button>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              Automate the entire internship lifecycle.
          </h1>
          <p className="mt-5 text-primary-foreground/80 text-lg max-w-2xl mx-auto">
              Smart Internship (SI) gives universities and host companies one platform to manage logbooks,
              supervisor assignments, tasks, and evaluations with full transparency.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="rounded-lg border bg-card p-6 hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-md bg-accent/15 text-accent grid place-items-center mb-4">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-serif font-semibold text-foreground">{f.title}</h3>
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
            <h3 className="font-serif text-xl font-semibold">For institutions</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground list-disc pl-5">
              <li>Coordinator dashboard for placement & supervisor assignment</li>
              <li>Workload-balanced supervisor matching</li>
              <li>Centralised evaluations and exportable reports</li>
              <li>Audit trail for accreditation & quality assurance</li>
            </ul>
          </div>
          <div className="rounded-xl border bg-card p-8">
            <Building2 className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-serif text-xl font-semibold">For industry partners</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground list-disc pl-5">
              <li>Assign tasks and approve weekly logbook entries</li>
              <li>Structured mid-term & final evaluations with rubrics</li>
              <li>Track intern progress with one click</li>
              <li>Securely share feedback with the host institution</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
