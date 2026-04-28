import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { students, companies, supervisors, type Student } from "@/lib/mock-data";
import { AlertCircle } from "lucide-react";

export const Route = createFileRoute("/placements")({
  head: () => ({ meta: [{ title: "Placements · SIMS" }] }),
  component: PlacementsPage,
});

function PlacementsPage() {
  const [filter, setFilter] = useState<"all" | Student["status"]>("all");
  const [active, setActive] = useState<Student | null>(null);
  const filtered = students.filter((s) => filter === "all" || s.status === filter);

  return (
    <AppShell>
      <PageHeader
        title="Placements"
        description="Match students to companies and supervisors."
        actions={<Button className="bg-accent text-accent-foreground hover:bg-accent/90">Bulk assign</Button>}
      />

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground uppercase">Placement rate</div>
            <div className="text-2xl font-semibold mt-2">{Math.round((students.filter(s => s.status !== "pending").length / students.length) * 100)}%</div>
            <Progress className="mt-3" value={(students.filter(s => s.status !== "pending").length / students.length) * 100} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground uppercase">Open slots</div>
            <div className="text-2xl font-semibold mt-2">{companies.reduce((a, c) => a + (c.slots - c.filled), 0)}</div>
            <div className="text-xs text-muted-foreground mt-1">across {companies.length} partners</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground uppercase flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Awaiting placement</div>
            <div className="text-2xl font-semibold mt-2">{students.filter(s => s.status === "pending").length}</div>
            <div className="text-xs text-muted-foreground mt-1">need supervisor + company</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Students</CardTitle>
            <CardDescription>Click a row to assign company & supervisor.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Input placeholder="Search…" className="w-48 h-9" />
            <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
              <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="placed">Placed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>GPA</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Academic</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.matric}</div>
                  </TableCell>
                  <TableCell className="text-sm">{s.department}</TableCell>
                  <TableCell>{s.gpa.toFixed(2)}</TableCell>
                  <TableCell className="text-sm">{s.company ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-sm">{s.academicSupervisor ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell><Badge variant="outline">{s.status}</Badge></TableCell>
                  <TableCell>
                    <Sheet open={active?.id === s.id} onOpenChange={(o) => !o && setActive(null)}>
                      <SheetTrigger asChild>
                        <Button size="sm" variant="ghost" onClick={() => setActive(s)}>Assign</Button>
                      </SheetTrigger>
                      <SheetContent className="w-[420px]">
                        <SheetHeader>
                          <SheetTitle>Assign placement</SheetTitle>
                          <SheetDescription>{s.name} · {s.matric}</SheetDescription>
                        </SheetHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label>Host company</Label>
                            <Select defaultValue={s.company ?? undefined}>
                              <SelectTrigger><SelectValue placeholder="Pick company" /></SelectTrigger>
                              <SelectContent>
                                {companies.map((c) => (
                                  <SelectItem key={c.id} value={c.name} disabled={c.filled >= c.slots}>
                                    {c.name} <span className="text-xs text-muted-foreground">({c.slots - c.filled} slots)</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Academic supervisor</Label>
                            <Select defaultValue={s.academicSupervisor ?? undefined}>
                              <SelectTrigger><SelectValue placeholder="Pick supervisor" /></SelectTrigger>
                              <SelectContent>
                                {supervisors.filter(sv => sv.type === "academic").map((sv) => (
                                  <SelectItem key={sv.id} value={sv.name}>
                                    {sv.name} <span className="text-xs text-muted-foreground">({sv.load}/{sv.capacity})</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Industry supervisor</Label>
                            <Select defaultValue={s.industrySupervisor ?? undefined}>
                              <SelectTrigger><SelectValue placeholder="Pick mentor" /></SelectTrigger>
                              <SelectContent>
                                {supervisors.filter(sv => sv.type === "industry").map((sv) => (
                                  <SelectItem key={sv.id} value={sv.name}>{sv.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                            ⚠ Workload check: assigning will bring Dr. Bola Adeyemi to 13/15.
                          </div>
                        </div>
                        <SheetFooter>
                          <Button variant="outline" onClick={() => setActive(null)}>Cancel</Button>
                          <Button>Confirm assignment</Button>
                        </SheetFooter>
                      </SheetContent>
                    </Sheet>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}