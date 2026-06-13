
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS semester text;

-- Enable realtime on log_comments
ALTER TABLE public.log_comments REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.log_comments;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admin policies on profiles
DROP POLICY IF EXISTS "Admins manage all profiles" ON public.profiles;
CREATE POLICY "Admins manage all profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin policies on placements
DROP POLICY IF EXISTS "Admins manage all placements" ON public.placements;
CREATE POLICY "Admins manage all placements" ON public.placements
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
