-- ── project_expenses table ──────────────────────────────────────────────────

CREATE TABLE public.project_expenses (
  id          UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID          NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  amount      NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  date        DATE          NOT NULL DEFAULT CURRENT_DATE,
  category    TEXT          NOT NULL CHECK (category IN ('Labour', 'Equipment', 'Materials', 'Subcontractor', 'Other')),
  description TEXT,
  created_by  TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE public.project_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_select"
  ON public.project_expenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "expenses_insert"
  ON public.project_expenses FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "expenses_delete"
  ON public.project_expenses FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ── Trigger: auto-update actual_spend on projects ───────────────────────────
-- Fires on every INSERT, UPDATE, or DELETE in project_expenses.
-- Keeps projects.actual_spend = SUM of all expense amounts for that project.

CREATE OR REPLACE FUNCTION public.sync_project_actual_spend()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.projects
  SET actual_spend = (
    SELECT COALESCE(SUM(amount), 0)
    FROM public.project_expenses
    WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
  )
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  RETURN NULL;
END;
$$;

CREATE TRIGGER expenses_sync_on_insert
  AFTER INSERT ON public.project_expenses
  FOR EACH ROW EXECUTE FUNCTION public.sync_project_actual_spend();

CREATE TRIGGER expenses_sync_on_delete
  AFTER DELETE ON public.project_expenses
  FOR EACH ROW EXECUTE FUNCTION public.sync_project_actual_spend();

CREATE TRIGGER expenses_sync_on_update
  AFTER UPDATE ON public.project_expenses
  FOR EACH ROW EXECUTE FUNCTION public.sync_project_actual_spend();

-- ── Reset existing actual_spend to 0 ────────────────────────────────────────
-- The old values were mock data. Going forward, spend is driven by entries.

UPDATE public.projects SET actual_spend = 0;
