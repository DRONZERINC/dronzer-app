CREATE TABLE public.employees (
  id          UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT          NOT NULL,
  email       TEXT          UNIQUE NOT NULL,
  job_title   TEXT,
  department  TEXT,
  site        TEXT,
  salary      NUMERIC(12,2),
  status      TEXT          NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  hire_date   DATE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees_select"
  ON public.employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "employees_insert"
  ON public.employees FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "employees_update"
  ON public.employees FOR UPDATE
  TO authenticated
  USING  ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "employees_delete"
  ON public.employees FOR DELETE
  TO authenticated
  USING  ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

INSERT INTO public.employees (name, email, job_title, department, site, salary, status, hire_date)
VALUES
  ('Ahmed Al-Rashidi', 'ahmed@gppc.com', 'Senior Site Supervisor', 'Drilling Operations', 'dammam', 14500, 'active', '2019-03-15'),
  ('Fatima Al-Mansoori', 'fatima@gppc.com', 'HSE Officer', 'HSE', 'ruwais', 11200, 'active', '2020-07-01'),
  ('Khalid Al-Omari', 'khalid@gppc.com', 'Pipeline Engineer', 'Pipeline Engineering', 'doha', 13800, 'active', '2018-11-20'),
  ('Noor Al-Khalidi', 'noor@gppc.com', 'Operations Manager', 'Project Management', 'dammam', 16000, 'active', '2017-05-10');
