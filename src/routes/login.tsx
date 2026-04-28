import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLES } from "@/lib/mock-data";
import { useRole } from "@/lib/role-context";
import { GraduationCap } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · SIMS" },
      { name: "description", content: "Sign in to the Smart Internship Management System." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { role, setRole } = useRole();
  const navigate = useNavigate();
  const [email, setEmail] = useState("amaka.okafor@university.edu");
  const [password, setPassword] = useState("demo1234");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex bg-primary text-primary-foreground p-12 flex-col justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-md bg-accent text-accent-foreground grid place-items-center font-bold">S</div>
          <span className="font-semibold">SIMS</span>
        </Link>
        <div>
          <GraduationCap className="h-10 w-10 text-accent mb-4" />
          <h2 className="text-3xl font-bold leading-tight">Smart Internship Management System</h2>
          <p className="mt-3 text-primary-foreground/80 max-w-md">
            Sign in to manage logbooks, evaluations, placements, and supervisor coordination.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/60">© 2026 SIMS · Final Year Project</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Demo mode — pick a role to explore the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label className="text-sm mb-2 block">Continue as</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((r) => (
                    <button
                      type="button"
                      key={r.value}
                      onClick={() => setRole(r.value)}
                      className={`text-left rounded-md border p-3 text-sm transition ${
                        role === r.value ? "border-accent bg-accent/10" : "hover:border-foreground/20"
                      }`}
                    >
                      <div className="font-medium">{r.label}</div>
                      <div className="text-xs text-muted-foreground">{r.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full bg-primary">Sign in to dashboard</Button>
              <p className="text-xs text-center text-muted-foreground">
                <Link to="/" className="hover:underline">← Back to home</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}