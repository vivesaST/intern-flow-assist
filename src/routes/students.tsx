import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { students } from "@/lib/mock-data";

export const Route = createFileRoute("/students")({
  head: () => ({ meta: [{ title: "Students · SIMS" }] }),
  component: StudentsPage,
});

function StudentsPage() {
  return (
    <AppShell>
      <PageHeader title="Students" description="All students in the internship programme." />
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Directory</CardTitle>
          <Input placeholder="Search students…" className="w-64 h-9" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Matric</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>GPA</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-sm">{s.matric}</TableCell>
                  <TableCell className="text-sm">{s.department}</TableCell>
                  <TableCell>{s.gpa.toFixed(2)}</TableCell>
                  <TableCell className="text-sm">{s.company ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="w-40"><Progress value={s.progress} /></TableCell>
                  <TableCell><Badge variant="outline">{s.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}