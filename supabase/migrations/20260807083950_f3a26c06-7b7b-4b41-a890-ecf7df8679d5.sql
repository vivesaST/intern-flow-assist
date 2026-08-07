CREATE POLICY "Students upload own acceptance letters"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'acceptance-letters' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Students update own acceptance letters"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'acceptance-letters' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Students delete own acceptance letters"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'acceptance-letters' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owner and staff read acceptance letters"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'acceptance-letters'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
      OR public.supervises_student(((storage.foldername(name))[1])::uuid)
    )
  );
