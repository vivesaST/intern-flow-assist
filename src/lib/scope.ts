import { supabase } from "@/integrations/supabase/client";
import type { Role } from "./mock-data";

export type StudentLite = { id: string; full_name: string | null; email: string | null };

/** Placement statuses that count as a live, approved placement. */
export const ACTIVE_PLACEMENT_STATUSES = ["active", "placed"] as const;

/** Supervisor records owned by the signed-in user. */
export async function mySupervisorIds(userId: string): Promise<string[]> {
  const { data } = await supabase.from("supervisors").select("id").eq("user_id", userId);
  return (data ?? []).map((s) => s.id);
}

/**
 * Student ids the current role is allowed to work with.
 * Supervisors resolve to only the students assigned to them via an active placement.
 */
export async function scopedStudentIds(role: Role, userId: string): Promise<string[]> {
  if (role === "student") return [userId];

  if (role === "admin") {
    const { data } = await supabase.from("user_roles").select("user_id").eq("role", "student");
    return Array.from(new Set((data ?? []).map((r) => r.user_id)));
  }

  const supIds = await mySupervisorIds(userId);
  if (supIds.length === 0) return [];

  const column = role === "academic" ? "academic_supervisor_id" : "industry_supervisor_id";
  const { data } = await supabase
    .from("placements")
    .select("student_id")
    .in(column, supIds)
    .in("status", ACTIVE_PLACEMENT_STATUSES as unknown as string[]);

  return Array.from(new Set((data ?? []).map((p) => p.student_id)));
}

export async function studentProfiles(ids: string[]): Promise<StudentLite[]> {
  if (ids.length === 0) return [];
  const { data } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
  return (data ?? []) as StudentLite[];
}

export function displayName(p?: { full_name?: string | null; email?: string | null } | null) {
  return p?.full_name ?? p?.email ?? "—";
}
