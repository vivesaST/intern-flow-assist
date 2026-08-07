import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useRole } from "@/lib/role-context";
import { usePlacement } from "@/hooks/use-placement";
import { toast } from "sonner";
import { CheckCircle2, FileUp, Building2 } from "lucide-react";

export const Route = createFileRoute("/placement-request")({
  head: () => ({
    meta: [
      { title: "Submit a placement request · Smart Internship" },
      {
        name: "description",
        content:
          "Students submit their host company details, industry supervisor and acceptance letter for coordinator approval.",
      },
      { property: "og:title", content: "Submit a placement request · Smart Internship" },
      {
        property: "og:description",
        content: "Send your company acceptance letter to the internship office for vetting.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlacementRequestPage,
});

type CompanyOption = { id: string; name: string; verified: boolean };

/** Cheap fuzzy score: normalised substring + token overlap. */
function matchScore(query: string, name: string) {
  const q = query.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const n = name.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  if (!q) return 0;
  if (n === q) return 100;
  if (n.startsWith(q)) return 90;
  if (n.includes(q)) return 75;
  const qt = new Set(q.split(/\s+/));
  const nt = n.split(/\s+/);
  const hits = nt.filter((t) => qt.has(t)).length;
  return hits > 0 ? 40 + hits * 10 : 0;
}

function PlacementRequestPage() {
  const { user, loading: authLoading } = useAuth();
  const { role } = useRole();
  const navigate = useNavigate();
  const { request, placement, hasActivePlacement, loading, reload } = usePlacement();

  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [supName, setSupName] = useState("");
  const [supEmail, setSupEmail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("companies").select("id, name, verified").order("name");
      setCompanies((data ?? []) as CompanyOption[]);
    })();
  }, []);

  // Prefill from an existing request so a rejected one can be edited and resubmitted.
  useEffect(() => {
    if (!request) return;
    setCompanyName(request.company_name);
    setCompanyId(request.company_id);
    setAddress(request.company_address ?? "");
    setSupName(request.industry_supervisor_name);
    setSupEmail(request.industry_supervisor_email);
    setStartDate(request.start_date);
  }, [request?.id]);

  const suggestions = useMemo(() => {
    return companies
      .map((c) => ({ c, s: matchScore(companyName, c.name) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 5)
      .map((x) => x.c);
  }, [companies, companyName]);

  const locked = request?.status === "pending" || request?.status === "approved" || hasActivePlacement;

  const submit = async () => {
    if (!user) return;
    if (!companyName.trim()) return toast.error("Company name is required");
    if (!supName.trim() || !supEmail.trim()) return toast.error("Industry supervisor name and email are required");
    if (!startDate) return toast.error("Pick your internship start date");
    if (!file && !request?.acceptance_letter_path) return toast.error("Upload the company acceptance letter");

    setBusy(true);
    try {
      // Link to an exact existing company, otherwise create it as unverified.
      let linkedId = companyId;
      if (!linkedId) {
        const exact = companies.find(
          (c) => c.name.trim().toLowerCase() === companyName.trim().toLowerCase(),
        );
        if (exact) {
          linkedId = exact.id;
        } else {
          const { data: created, error: cErr } = await supabase
            .from("companies")
            .insert({ name: companyName.trim(), address: address.trim() || null, verified: false })
            .select("id")
            .single();
          if (cErr) throw cErr;
          linkedId = created.id;
        }
      }

      let letterPath = request?.acceptance_letter_path ?? null;
      if (file) {
        const ext = file.name.split(".").pop() ?? "pdf";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("acceptance-letters")
          .upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        letterPath = path;
      }

      const payload = {
        student_id: user.id,
        company_id: linkedId,
        company_name: companyName.trim(),
        company_address: address.trim() || null,
        industry_supervisor_name: supName.trim(),
        industry_supervisor_email: supEmail.trim().toLowerCase(),
        start_date: startDate,
        acceptance_letter_path: letterPath,
        status: "pending",
        review_note: null,
        reviewed_by: null,
        reviewed_at: null,
      };

      const { error } = request
        ? await supabase.from("placement_requests").update(payload).eq("id", request.id)
        : await supabase.from("placement_requests").insert(payload);
      if (error) throw error;

      toast.success("Placement request submitted for review");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      reload();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not submit request");
    } finally {
      setBusy(false);
    }
  };

  if (role !== "student") {
    return (
      <AppShell>
        <PageHeader title="Placement request" description="Only students can submit placement requests." />
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Placement requests originate from students. Coordinators review them on the Placements screen.
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Placement request"
        description="Tell the internship office where you have been accepted, and attach your acceptance letter."
      />

      {request && (
        <Card className="mb-6">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Current request</CardTitle>
              <CardDescription>{request.company_name}</CardDescription>
            </div>
            <Badge variant="outline">{request.status.replace("_", " ")}</Badge>
          </CardHeader>
          {request.review_note && (
            <CardContent>
              <div className="text-xs uppercase text-muted-foreground mb-1">Coordinator note</div>
              <p className="text-sm">{request.review_note}</p>
            </CardContent>
          )}
        </Card>
      )}

      {hasActivePlacement && placement ? (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">Your placement is approved</h3>
            <p className="text-sm text-muted-foreground">
              {placement.company_name} · starts {placement.start_date ?? "—"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Company & supervisor details</CardTitle>
            <CardDescription>
              Your school issues the introduction letter offline. Once a company accepts you, submit their
              acceptance letter here for vetting.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Label htmlFor="co">Company name</Label>
              <Input
                id="co"
                value={companyName}
                disabled={locked}
                placeholder="Start typing to match a known company"
                onChange={(e) => {
                  setCompanyName(e.target.value);
                  setCompanyId(null);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              />
              {showSuggestions && !locked && suggestions.length > 0 && !companyId && (
                <div className="absolute z-20 mt-1 w-full rounded-md border bg-popover shadow-md overflow-hidden">
                  {suggestions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                      onMouseDown={() => {
                        setCompanyName(c.name);
                        setCompanyId(c.id);
                        setShowSuggestions(false);
                      }}
                    >
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="flex-1">{c.name}</span>
                      <Badge variant={c.verified ? "default" : "secondary"} className="text-[10px]">
                        {c.verified ? "verified" : "unverified"}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {companyId
                  ? "Linked to an existing company record."
                  : "No match selected — a new unverified company will be created for the coordinator to vet."}
              </p>
            </div>

            <div>
              <Label htmlFor="addr">Company address</Label>
              <Textarea
                id="addr"
                rows={2}
                value={address}
                disabled={locked}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sn">Industry supervisor name</Label>
                <Input id="sn" value={supName} disabled={locked} onChange={(e) => setSupName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="se">Industry supervisor email</Label>
                <Input
                  id="se"
                  type="email"
                  value={supEmail}
                  disabled={locked}
                  onChange={(e) => setSupEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sd">Internship start date</Label>
                <Input
                  id="sd"
                  type="date"
                  value={startDate}
                  disabled={locked}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="letter">Acceptance letter (PDF or image)</Label>
                <Input
                  id="letter"
                  ref={fileRef}
                  type="file"
                  accept="application/pdf,image/*"
                  disabled={locked}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                {request?.acceptance_letter_path && !file && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <FileUp className="h-3 w-3" /> A letter is already attached.
                  </p>
                )}
              </div>
            </div>

            <Button onClick={submit} disabled={busy || locked || loading}>
              {busy ? "Submitting…" : request ? "Resubmit request" : "Submit request"}
            </Button>
            {locked && (
              <p className="text-xs text-muted-foreground">
                Your request is locked while the coordinator reviews it.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
