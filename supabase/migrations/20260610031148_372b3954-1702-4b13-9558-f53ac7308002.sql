
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('student', 'academic', 'industry', 'admin');
CREATE TYPE public.log_status AS ENUM ('draft', 'submitted', 'approved', 'revision');
CREATE TYPE public.task_status AS ENUM ('todo', 'in-progress', 'submitted', 'graded');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.placement_status AS ENUM ('pending', 'placed', 'completed');
CREATE TYPE public.supervisor_type AS ENUM ('academic', 'industry');

-- ============ updated_at helper ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  matric TEXT,
  department TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles readable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ AUTO-CREATE PROFILE + DEFAULT STUDENT ROLE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'));

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ COMPANIES ============
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sector TEXT,
  slots INT NOT NULL DEFAULT 0,
  filled INT NOT NULL DEFAULT 0,
  contact TEXT,
  rating NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies viewable by authenticated" ON public.companies
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage companies" ON public.companies
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SUPERVISORS ============
CREATE TABLE public.supervisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type supervisor_type NOT NULL,
  affiliation TEXT,
  capacity INT NOT NULL DEFAULT 10,
  load INT NOT NULL DEFAULT 0,
  pending INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supervisors TO authenticated;
GRANT ALL ON public.supervisors TO service_role;
ALTER TABLE public.supervisors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Supervisors viewable by authenticated" ON public.supervisors
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage supervisors" ON public.supervisors
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER supervisors_updated_at BEFORE UPDATE ON public.supervisors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PLACEMENTS ============
CREATE TABLE public.placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  academic_supervisor_id UUID REFERENCES public.supervisors(id) ON DELETE SET NULL,
  industry_supervisor_id UUID REFERENCES public.supervisors(id) ON DELETE SET NULL,
  position TEXT,
  start_date DATE,
  end_date DATE,
  status placement_status NOT NULL DEFAULT 'pending',
  progress INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.placements TO authenticated;
GRANT ALL ON public.placements TO service_role;
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own placement" ON public.placements
  FOR SELECT TO authenticated USING (
    auth.uid() = student_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'academic')
    OR public.has_role(auth.uid(), 'industry')
  );
CREATE POLICY "Admins manage placements" ON public.placements
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER placements_updated_at BEFORE UPDATE ON public.placements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ LOG ENTRIES ============
CREATE TABLE public.log_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week INT NOT NULL,
  entry_date DATE NOT NULL,
  hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  activities TEXT,
  skills TEXT[] DEFAULT '{}',
  status log_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.log_entries TO authenticated;
GRANT ALL ON public.log_entries TO service_role;
ALTER TABLE public.log_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own entries" ON public.log_entries
  FOR ALL TO authenticated USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Supervisors and admins view entries" ON public.log_entries
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'academic')
    OR public.has_role(auth.uid(), 'industry')
  );
CREATE POLICY "Supervisors and admins update entries" ON public.log_entries
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'academic')
    OR public.has_role(auth.uid(), 'industry')
  );
CREATE TRIGGER log_entries_updated_at BEFORE UPDATE ON public.log_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ TASKS ============
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'medium',
  due_date DATE,
  grade TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own tasks" ON public.tasks
  FOR SELECT TO authenticated USING (
    auth.uid() = student_id
    OR auth.uid() = assigned_by
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Students update own tasks" ON public.tasks
  FOR UPDATE TO authenticated USING (auth.uid() = student_id OR auth.uid() = assigned_by);
CREATE POLICY "Supervisors and admins create tasks" ON public.tasks
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'academic')
    OR public.has_role(auth.uid(), 'industry')
  );
CREATE POLICY "Admins delete tasks" ON public.tasks
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ EVALUATIONS ============
CREATE TABLE public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evaluator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  criterion TEXT NOT NULL,
  mid_score INT,
  final_score INT,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluations TO authenticated;
GRANT ALL ON public.evaluations TO service_role;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own evaluations" ON public.evaluations
  FOR SELECT TO authenticated USING (
    auth.uid() = student_id
    OR auth.uid() = evaluator_id
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Supervisors and admins manage evaluations" ON public.evaluations
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'academic')
    OR public.has_role(auth.uid(), 'industry')
  ) WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'academic')
    OR public.has_role(auth.uid(), 'industry')
  );
CREATE TRIGGER evaluations_updated_at BEFORE UPDATE ON public.evaluations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
