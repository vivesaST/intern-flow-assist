import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { logEntries, type LogEntry } from "@/lib/mock-data";
import { MessageSquare, Paperclip } from "lucide-react";

export const Route = createFileRoute("/logbook")({
  head: () => ({ meta: [{ title: "Logbook · SIMS" }] }),
  component: LogbookPage,
});

function StatusBadge({ s }: { s: LogEntry["status"] }) {
  const map = {
    approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
    submitted: "bg-blue-100 text-blue-700 border-blue-200",
    revision: "bg-amber-100 text-amber-700 border-amber-200",
    draft: "bg-muted text-muted-foreground",
  } as const;
  return <Badge variant="outline" className={map[s]}>{s}</Badge>;
}

function LogbookPage() {
  const [selected, setSelected] = useState<LogEntry | null>(null);

  return (
    <AppShell>
      <PageHeader
        title="Logbook"
        description="Weekly entries with industry and academic supervisor approvals."
        actions={
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">+ New entry</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New logbook entry</DialogTitle>
                <DialogDescription>Record activities for the current week.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Week</Label><Input placeholder="15" /></div>
                  <div><Label>Date</Label><Input type="date" /></div>
                </div>
                <div><Label>Hours</Label><Input type="number" placeholder="40" /></div>
                <div><Label>Title</Label><Input placeholder="Sprint planning & component refactor" /></div>
                <div><Label>Activities</Label><Textarea placeholder="Describe what you did this week..." rows={4} /></div>
                <div><Label>Skills practised</Label><Input placeholder="React, TypeScript, Testing" /></div>
              </div>
              <DialogFooter>
                <Button variant="outline">Save draft</Button>
                <Button>Submit for approval</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Submitted", value: logEntries.filter(e => e.status === "submitted").length },
          { label: "Approved", value: logEntries.filter(e => e.status === "approved").length },
          { label: "Revision", value: logEntries.filter(e => e.status === "revision").length },
          { label: "Drafts", value: logEntries.filter(e => e.status === "draft").length },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="text-xs text-muted-foreground uppercase">{s.label}</div>
              <div className="text-2xl font-semibold mt-2">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>All entries</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Week</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Comments</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logEntries.map((e) => (
                <TableRow key={e.id} className="cursor-pointer" onClick={() => setSelected(e)}>
                  <TableCell className="font-mono text-xs">W{e.week}</TableCell>
                  <TableCell>{e.date}</TableCell>
                  <TableCell className="font-medium">{e.title}</TableCell>
                  <TableCell>{e.hours}</TableCell>
                  <TableCell><MessageSquare className="h-3 w-3 inline mr-1" />{e.comments}</TableCell>
                  <TableCell><StatusBadge s={e.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Week {selected.week} · {selected.title}</DialogTitle>
                <DialogDescription>{selected.date} · {selected.hours} hours</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase mb-1">Activities</div>
                  <p className="text-sm">{selected.activities}</p>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase mb-1">Skills practised</div>
                  <div className="flex gap-2 flex-wrap">
                    {selected.skills.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase mb-2">Supervisor feedback</div>
                  <div className="space-y-2 max-h-48 overflow-auto">
                    <div className="rounded-md border p-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">Daniel Yusuf · Industry</span>
                        <span className="text-muted-foreground">2 days ago</span>
                      </div>
                      <p className="text-sm">Solid week. Make sure form components have proper a11y labels.</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">Dr. Bola Adeyemi · Academic</span>
                        <span className="text-muted-foreground">1 day ago</span>
                      </div>
                      <p className="text-sm">Co-signed. Reflect on testing coverage in next entry.</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">2 attachments</span>
                  <StatusBadge s={selected.status} />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}