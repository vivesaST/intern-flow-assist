import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/role-context";
import { ACTIVE_PLACEMENT_STATUSES } from "@/lib/scope";

export type StudentPlacement = {
  id: string;
  company_id: string | null;
  academic_supervisor_id: string | null;
  industry_supervisor_id: string | null;
  status: string;
  progress: number;
  start_date: string | null;
  end_date: string | null;
  company_name?: string | null;
  academic_name?: string | null;
  industry_name?: string | null;
};

export type PlacementRequest = {
  id: string;
  company_name: string;
  company_address: string | null;
  industry_supervisor_name: string;
  industry_supervisor_email: string;
  start_date: string;
  acceptance_letter_path: string | null;
  status: string;
  review_note: string | null;
  company_id: string | null;
};

export function usePlacement() {
  const { user } = useAuth();
  const [placement, setPlacement] = useState<StudentPlacement | null>(null);
  const [request, setRequest] = useState<PlacementRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) {
      setPlacement(null);
      setRequest(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    const [{ data: pl }, { data: req }] = await Promise.all([
      supabase
        .from("placements")
        .select("id, company_id, academic_supervisor_id, industry_supervisor_id, status, progress, start_date, end_date")
        .eq("student_id", user.id)
        .maybeSingle(),
      supabase
        .from("placement_requests")
        .select("*")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    setRequest((req ?? null) as PlacementRequest | null);

    if (!pl) {
      setPlacement(null);
      setLoading(false);
      return;
    }

    const [{ data: c }, { data: a }, { data: i }] = await Promise.all([
      pl.company_id
        ? supabase.from("companies").select("name").eq("id", pl.company_id).maybeSingle()
        : Promise.resolve({ data: null } as any),
      pl.academic_supervisor_id
        ? supabase.from("supervisors").select("name").eq("id", pl.academic_supervisor_id).maybeSingle()
        : Promise.resolve({ data: null } as any),
      pl.industry_supervisor_id
        ? supabase.from("supervisors").select("name").eq("id", pl.industry_supervisor_id).maybeSingle()
        : Promise.resolve({ data: null } as any),
    ]);

    setPlacement({
      ...pl,
      company_name: c?.name ?? null,
      academic_name: a?.name ?? null,
      industry_name: i?.name ?? null,
    });
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  // A placement only unlocks the workspace once the coordinator has approved it.
  const hasActivePlacement =
    !!placement &&
    (ACTIVE_PLACEMENT_STATUSES as readonly string[]).includes(placement.status) &&
    !!placement.company_id;

  return { placement, request, loading, hasActivePlacement, reload };
}
