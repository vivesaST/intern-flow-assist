import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/role-context";

export type StudentPlacement = {
  id: string;
  company_id: string | null;
  academic_supervisor_id: string | null;
  industry_supervisor_id: string | null;
  status: string;
  progress: number;
  company_name?: string | null;
  academic_name?: string | null;
  industry_name?: string | null;
};

export function usePlacement() {
  const { user } = useAuth();
  const [placement, setPlacement] = useState<StudentPlacement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const { data: pl } = await supabase
        .from("placements")
        .select("id, company_id, academic_supervisor_id, industry_supervisor_id, status, progress")
        .eq("student_id", user.id)
        .maybeSingle();
      if (!pl) { setPlacement(null); setLoading(false); return; }
      const [{ data: c }, { data: a }, { data: i }] = await Promise.all([
        pl.company_id ? supabase.from("companies").select("name").eq("id", pl.company_id).maybeSingle() : Promise.resolve({ data: null } as any),
        pl.academic_supervisor_id ? supabase.from("supervisors").select("name").eq("id", pl.academic_supervisor_id).maybeSingle() : Promise.resolve({ data: null } as any),
        pl.industry_supervisor_id ? supabase.from("supervisors").select("name").eq("id", pl.industry_supervisor_id).maybeSingle() : Promise.resolve({ data: null } as any),
      ]);
      setPlacement({
        ...pl,
        company_name: c?.name ?? null,
        academic_name: a?.name ?? null,
        industry_name: i?.name ?? null,
      });
      setLoading(false);
    })();
  }, [user?.id]);

  const hasActivePlacement = !!placement && !!placement.company_id && (!!placement.academic_supervisor_id || !!placement.industry_supervisor_id);

  return { placement, loading, hasActivePlacement };
}