CREATE TABLE public.projects (
  id             UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  name           TEXT          NOT NULL,
  site           TEXT,
  country        TEXT,
  status         TEXT          NOT NULL DEFAULT 'on_track'
                               CHECK (status IN ('on_track', 'at_risk', 'completed', 'archived')),
  phase          TEXT,
  deadline       DATE,
  pm             TEXT,
  description    TEXT,
  milestone_pct  INTEGER       NOT NULL DEFAULT 0 CHECK (milestone_pct BETWEEN 0 AND 100),
  budget_amount  NUMERIC(14,2) NOT NULL DEFAULT 0,
  actual_spend   NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select"
  ON public.projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "projects_insert"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "projects_update"
  ON public.projects FOR UPDATE
  TO authenticated
  USING  ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "projects_delete"
  ON public.projects FOR DELETE
  TO authenticated
  USING  ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

INSERT INTO public.projects (name, site, country, status, phase, deadline, pm, description, milestone_pct, budget_amount, actual_spend)
VALUES
  ('Ruwais Gas Processing Expansion', 'ruwais', 'UAE', 'on_track', 'Construction', '2026-11-30', 'Ibrahim Al-Sayed', 'Expansion of gas processing capacity by 40% to meet increased upstream output.', 60, 4200000, 3010000),
  ('Dammam Pipeline Rehabilitation', 'dammam', 'Saudi Arabia', 'on_track', 'Engineering', '2027-03-15', 'Samir Al-Harbi', 'Full rehabilitation of 42 km pipeline corridor, including cathodic protection upgrade.', 40, 2750000, 980000),
  ('Duqm Refinery Auxiliary Systems', 'duqm', 'Oman', 'on_track', 'Construction', '2026-09-01', 'Hessa Al-Balushi', 'Installation of auxiliary utility systems for the new refinery processing train.', 60, 3100000, 3472000),
  ('Doha Compression Station Upgrade', 'doha', 'Qatar', 'at_risk', 'Procurement', '2027-01-20', 'Jassim Al-Thani', 'Capacity upgrade of main compression station to support LNG export ramp-up.', 40, 5600000, 1540000);
