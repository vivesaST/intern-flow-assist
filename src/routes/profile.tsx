import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { currentUser } from "@/lib/mock-data";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile · SIMS" }] }),
  component: ProfilePage,
});

function ProfilePage() {
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
                  {currentUser.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" size="sm">Upload photo</Button>
                <p className="text-xs text-muted-foreground mt-1">PNG / JPG, max 2MB</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div><Label>Full name</Label><Input defaultValue={currentUser.name} /></div>
              <div><Label>Email</Label><Input defaultValue={currentUser.email} /></div>
              <div><Label>Matric number</Label><Input defaultValue={currentUser.matric} /></div>
              <div><Label>Department</Label><Input defaultValue={currentUser.department} /></div>
              <div><Label>Company</Label><Input defaultValue={currentUser.company} /></div>
              <div><Label>Position</Label><Input defaultValue={currentUser.position} /></div>
            </div>
            <Button>Save changes</Button>
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