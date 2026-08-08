-- 1. Notifications ---------------------------------------------------------
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX notifications_user_idx ON public.notifications (user_id, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- helper: de-duplicated notify
CREATE OR REPLACE FUNCTION public.notify_user(_user uuid, _type text, _title text, _body text, _link text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _user IS NULL THEN RETURN; END IF;
  IF EXISTS (
    SELECT 1 FROM public.notifications n
    WHERE n.user_id = _user AND n.type = _type AND n.title = _title
      AND coalesce(n.body,'') = coalesce(_body,'')
      AND n.created_at > now() - interval '2 minutes'
  ) THEN RETURN; END IF;
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (_user, _type, _title, _body, _link);
END; $$;

-- who is involved with a student (supervisor user ids + admins)
CREATE OR REPLACE FUNCTION public.student_stakeholders(_student_id uuid)
RETURNS TABLE (user_id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.user_id
  FROM public.placements p
  JOIN public.supervisors s
    ON s.id = p.academic_supervisor_id OR s.id = p.industry_supervisor_id
  WHERE p.student_id = _student_id AND s.user_id IS NOT NULL
  UNION
  SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'admin'
$$;

-- 2. Comment notifications --------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_on_log_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _student uuid; _author text; _week int; _title text;
BEGIN
  SELECT e.student_id, e.week, e.title INTO _student, _week, _title
  FROM public.log_entries e WHERE e.id = NEW.entry_id;
  SELECT coalesce(pr.full_name, pr.email, 'Someone') INTO _author
  FROM public.profiles pr WHERE pr.id = NEW.author_id;
  IF _student IS NOT NULL AND _student <> NEW.author_id THEN
    PERFORM public.notify_user(_student, 'comment',
      'New feedback on your logbook',
      _author || ' commented on W' || coalesce(_week::text,'?') || ' · ' || coalesce(_title,''),
      '/logbook');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER notify_log_comment AFTER INSERT ON public.log_comments
FOR EACH ROW EXECUTE FUNCTION public.notify_on_log_comment();

-- 3. Task assignment --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_on_task()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _by text;
BEGIN
  IF NEW.assigned_by IS NOT NULL AND NEW.assigned_by = NEW.student_id THEN RETURN NEW; END IF;
  SELECT coalesce(pr.full_name, pr.email, 'Your supervisor') INTO _by
  FROM public.profiles pr WHERE pr.id = NEW.assigned_by;
  PERFORM public.notify_user(NEW.student_id, 'task',
    'New task assigned',
    coalesce(_by,'Your supervisor') || ' assigned: ' || NEW.title, '/tasks');
  RETURN NEW;
END; $$;

CREATE TRIGGER notify_task_assigned AFTER INSERT ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.notify_on_task();

CREATE OR REPLACE FUNCTION public.notify_on_task_grade()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.grade IS DISTINCT FROM OLD.grade AND NEW.grade IS NOT NULL THEN
    PERFORM public.notify_user(NEW.student_id, 'task',
      'Task graded', NEW.title || ' — grade: ' || NEW.grade, '/tasks');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER notify_task_graded AFTER UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.notify_on_task_grade();

-- 4. Logbook review ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_on_log_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('approved','industry_approved','revision') THEN
    PERFORM public.notify_user(NEW.student_id, 'logbook',
      CASE NEW.status
        WHEN 'approved' THEN 'Logbook entry approved'
        WHEN 'industry_approved' THEN 'Industry supervisor approved your entry'
        ELSE 'Logbook entry sent back for revision' END,
      'W' || coalesce(NEW.week::text,'?') || ' · ' || coalesce(NEW.title,'') ||
        coalesce(' — ' || NEW.feedback, ''),
      '/logbook');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER notify_log_review AFTER UPDATE ON public.log_entries
FOR EACH ROW EXECUTE FUNCTION public.notify_on_log_review();

-- 5. Evaluations ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_on_evaluation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _by text; _student text; _uid uuid;
BEGIN
  SELECT coalesce(pr.full_name, pr.email, 'A supervisor') INTO _by
  FROM public.profiles pr WHERE pr.id = NEW.evaluator_id;
  SELECT coalesce(pr.full_name, pr.email, 'A student') INTO _student
  FROM public.profiles pr WHERE pr.id = NEW.student_id;

  PERFORM public.notify_user(NEW.student_id, 'evaluation',
    'Evaluation report received',
    'Submitted by ' || coalesce(_by,'a supervisor'), '/dashboard');

  FOR _uid IN SELECT s.user_id FROM public.student_stakeholders(NEW.student_id) s LOOP
    IF _uid <> NEW.student_id THEN
      PERFORM public.notify_user(_uid, 'evaluation',
        'Evaluation submitted for ' || _student,
        'Submitted by ' || coalesce(_by,'a supervisor'), '/evaluations');
    END IF;
  END LOOP;
  RETURN NEW;
END; $$;

CREATE TRIGGER notify_evaluation_insert AFTER INSERT ON public.evaluations
FOR EACH ROW EXECUTE FUNCTION public.notify_on_evaluation();
CREATE TRIGGER notify_evaluation_update AFTER UPDATE ON public.evaluations
FOR EACH ROW EXECUTE FUNCTION public.notify_on_evaluation();

-- 6. Placement approved -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_on_placement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _acad text; _ind text; _co text;
BEGIN
  IF NEW.status <> 'active' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'active'
     AND OLD.academic_supervisor_id IS NOT DISTINCT FROM NEW.academic_supervisor_id
     AND OLD.industry_supervisor_id IS NOT DISTINCT FROM NEW.industry_supervisor_id THEN
    RETURN NEW;
  END IF;
  SELECT name INTO _acad FROM public.supervisors WHERE id = NEW.academic_supervisor_id;
  SELECT name INTO _ind FROM public.supervisors WHERE id = NEW.industry_supervisor_id;
  SELECT name INTO _co FROM public.companies WHERE id = NEW.company_id;
  PERFORM public.notify_user(NEW.student_id, 'placement',
    'Placement approved — supervisors assigned',
    coalesce(_co,'Your host company') || ' · Academic: ' || coalesce(_acad,'—') ||
      ' · Industry: ' || coalesce(_ind,'—'), '/dashboard');
  RETURN NEW;
END; $$;

CREATE TRIGGER notify_placement_active AFTER INSERT OR UPDATE ON public.placements
FOR EACH ROW EXECUTE FUNCTION public.notify_on_placement();

-- 7. Link supervisor records to accounts by email ---------------------------
UPDATE public.supervisors s
SET user_id = u.id
FROM auth.users u
WHERE s.user_id IS NULL AND s.email IS NOT NULL AND lower(s.email) = lower(u.email);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role app_role;
  _existing uuid;
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
    SELECT id INTO _existing FROM public.supervisors
    WHERE user_id IS NULL AND email IS NOT NULL AND lower(email) = lower(NEW.email)
    LIMIT 1;

    IF _existing IS NOT NULL THEN
      UPDATE public.supervisors
      SET user_id = NEW.id,
          name = COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name',''), name)
      WHERE id = _existing;
    ELSIF NOT EXISTS (SELECT 1 FROM public.supervisors WHERE user_id = NEW.id) THEN
      INSERT INTO public.supervisors (user_id, name, email, type, affiliation)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        _role::text::supervisor_type,
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'company_name', ''), NULLIF(NEW.raw_user_meta_data->>'university', ''))
      );
    END IF;
  END IF;

  RETURN NEW;
END; $$;

-- 8. Admin management of supervisors/companies is already covered by
--    "Admins manage supervisors" / "Admins manage companies" ALL policies.
