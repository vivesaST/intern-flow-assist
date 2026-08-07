-- 1. Enum extensions (values cannot be used later in this same transaction)
ALTER TYPE public.placement_status ADD VALUE IF NOT EXISTS 'active';
ALTER TYPE public.placement_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE public.log_status ADD VALUE IF NOT EXISTS 'industry_approved';

-- 2. Companies: verification + address
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;

-- 3. Supervisors: email so they can be matched/invited
ALTER TABLE public.supervisors ADD COLUMN IF NOT EXISTS email text;
CREATE UNIQUE INDEX IF NOT EXISTS supervisors_email_key ON public.supervisors (lower(email)) WHERE email IS NOT NULL;

-- 4. Placements: start/end already exist; add position default nothing needed

-- 5. Log entries: two-stage review
ALTER TABLE public.log_entries ADD COLUMN IF NOT EXISTS industry_reviewed_by uuid;
ALTER TABLE public.log_entries ADD COLUMN IF NOT EXISTS industry_reviewed_at timestamptz;
ALTER TABLE public.log_entries ADD COLUMN IF NOT EXISTS academic_reviewed_by uuid;
ALTER TABLE public.log_entries ADD COLUMN IF NOT EXISTS academic_reviewed_at timestamptz;

-- 6. Placement requests
CREATE TABLE IF NOT EXISTS public.placement_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  company_name text NOT NULL,
  company_address text,
  industry_supervisor_name text NOT NULL,
  industry_supervisor_email text NOT NULL,
  start_date date NOT NULL,
  acceptance_letter_path text,
  status text NOT NULL DEFAULT 'pending',
  review_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.placement_requests TO authenticated;
GRANT ALL ON public.placement_requests TO service_role;
ALTER TABLE public.placement_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own placement requests"
  ON public.placement_requests FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Staff view placement requests"
  ON public.placement_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'academic'));

CREATE POLICY "Admins review placement requests"
  ON public.placement_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER placement_requests_updated_at BEFORE UPDATE ON public.placement_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS placement_requests_status_idx ON public.placement_requests (status);
CREATE INDEX IF NOT EXISTS placement_requests_student_idx ON public.placement_requests (student_id);

-- 7. Supervision helper: does the current user supervise this student?
CREATE OR REPLACE FUNCTION public.supervises_student(_student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.placements p
    JOIN public.supervisors s
      ON s.id = p.academic_supervisor_id OR s.id = p.industry_supervisor_id
    WHERE p.student_id = _student_id
      AND s.user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.can_view_student(_student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _student_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin')
      OR public.supervises_student(_student_id)
$$;

-- 8. Auto-create supervisor records on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role app_role;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student');

  INSERT INTO public.profiles (id, full_name, email, company_name, university)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'company_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'university', '')
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);

  IF _role IN ('academic', 'industry') THEN
    INSERT INTO public.supervisors (user_id, name, email, type, affiliation)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      NEW.email,
      _role::text::supervisor_type,
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'company_name', ''), NULLIF(NEW.raw_user_meta_data->>'university', ''))
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Backfill supervisor rows for existing supervisor accounts
INSERT INTO public.supervisors (user_id, name, email, type, affiliation)
SELECT p.id, COALESCE(p.full_name, p.email), p.email, ur.role::text::supervisor_type,
       COALESCE(p.company_name, p.university)
FROM public.user_roles ur
JOIN public.profiles p ON p.id = ur.user_id
WHERE ur.role IN ('academic','industry')
  AND NOT EXISTS (SELECT 1 FROM public.supervisors s WHERE s.user_id = p.id)
ON CONFLICT DO NOTHING;

-- 9. Tighten RLS: supervisors only see their own students
DROP POLICY IF EXISTS "Supervisors and admins view entries" ON public.log_entries;
CREATE POLICY "Supervisors and admins view entries"
  ON public.log_entries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.supervises_student(student_id));

DROP POLICY IF EXISTS "Supervisors and admins update entries" ON public.log_entries;
CREATE POLICY "Supervisors and admins update entries"
  ON public.log_entries FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.supervises_student(student_id));

DROP POLICY IF EXISTS "Staff view all attendance" ON public.attendance;
CREATE POLICY "Staff view scoped attendance"
  ON public.attendance FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.supervises_student(student_id));

DROP POLICY IF EXISTS "Students view own tasks" ON public.tasks;
CREATE POLICY "Scoped task visibility"
  ON public.tasks FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR assigned_by = auth.uid()
         OR public.has_role(auth.uid(), 'admin') OR public.supervises_student(student_id));

DROP POLICY IF EXISTS "Supervisors and admins create tasks" ON public.tasks;
CREATE POLICY "Supervisors create tasks for their students"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.supervises_student(student_id));

DROP POLICY IF EXISTS "Supervisors and admins manage evaluations" ON public.evaluations;
CREATE POLICY "Supervisors manage evaluations for their students"
  ON public.evaluations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.supervises_student(student_id))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.supervises_student(student_id));

DROP POLICY IF EXISTS "Students view own placement" ON public.placements;
CREATE POLICY "Scoped placement visibility"
  ON public.placements FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.supervises_student(student_id));

-- Profiles: keep readable by staff/self only
DROP POLICY IF EXISTS "Profiles readable by authenticated" ON public.profiles;
CREATE POLICY "Scoped profile visibility"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid()
         OR public.has_role(auth.uid(), 'admin')
         OR public.has_role(auth.uid(), 'academic')
         OR public.supervises_student(id));

-- 10. Companies: students may add an unverified company from a placement request
CREATE POLICY "Authenticated add unverified companies"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (verified = false);

-- 11. Attachment/log entry access helper needs to respect the new scoping
CREATE OR REPLACE FUNCTION public.can_access_log_entry(_entry_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.log_entries e
    WHERE e.id = _entry_id
      AND (e.student_id = auth.uid()
           OR public.has_role(auth.uid(), 'admin')
           OR public.supervises_student(e.student_id))
  )
$$;
