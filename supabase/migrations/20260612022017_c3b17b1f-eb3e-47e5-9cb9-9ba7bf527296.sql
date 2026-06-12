
ALTER TABLE public.log_entries
  ADD COLUMN IF NOT EXISTS attachments text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS feedback text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

CREATE TABLE IF NOT EXISTS public.log_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.log_entries(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.log_comments TO authenticated;
GRANT ALL ON public.log_comments TO service_role;

ALTER TABLE public.log_comments ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_access_log_entry(_entry_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.log_entries e
    WHERE e.id = _entry_id
      AND (
        e.student_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin'::app_role)
        OR public.has_role(auth.uid(), 'academic'::app_role)
        OR public.has_role(auth.uid(), 'industry'::app_role)
      )
  )
$$;

CREATE POLICY "View comments on accessible entries"
  ON public.log_comments FOR SELECT
  USING (public.can_access_log_entry(entry_id));

CREATE POLICY "Insert own comments on accessible entries"
  ON public.log_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id AND public.can_access_log_entry(entry_id));

CREATE POLICY "Delete own comments"
  ON public.log_comments FOR DELETE
  USING (auth.uid() = author_id);

-- Storage policies for the logbook-attachments bucket (bucket created via dashboard).
CREATE POLICY "Students upload own logbook files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'logbook-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Students delete own logbook files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'logbook-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Read logbook files for owner, supervisors, admins"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'logbook-attachments'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'academic'::app_role)
      OR public.has_role(auth.uid(), 'industry'::app_role)
    )
  );
