-- ================================================================
-- DRONZER  |  STAGE 2 OF 3  --  Row Level Security
--
-- IMPORTANT: Run stage3_migration.sql immediately after this.
-- Between Stage 2 and Stage 3 the app will show blank data.
-- Run both files in the same Supabase session, one after the other.
-- ================================================================


-- ----------------------------------------------------------------
-- Helper functions
-- These two functions are called inside every policy below.
-- SECURITY DEFINER means they run as the database owner and bypass
-- RLS entirely when reading from profiles -- this is intentional.
-- Without it, the policies would read profiles, which reads profiles,
-- which reads profiles... infinite loop.
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS UUID
LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;


-- ----------------------------------------------------------------
-- Enable RLS on all five tables
-- Once enabled, every query from the browser client must pass
-- at least one policy or the row is invisible / operation blocked.
-- The service_role key (used in Supabase dashboard) bypasses RLS.
-- ----------------------------------------------------------------

ALTER TABLE public.companies        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_expenses ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- COMPANIES
-- ================================================================

-- WHAT IT DOES: You can only see the row for your own company.
-- WHY IT MATTERS: Stops any user from listing all companies in the
-- database or discovering that other tenants exist.

DROP POLICY IF EXISTS "companies: members can read own company" ON public.companies;
CREATE POLICY "companies: members can read own company"
  ON public.companies FOR SELECT
  USING (id = public.get_my_company_id());


-- ================================================================
-- PROFILES
-- ================================================================

-- WHAT IT DOES: You can always read your own profile row.
-- WHY IT MATTERS: The app fetches your profile on login to get your
-- company_id and role. Without this, login would get stuck loading.

DROP POLICY IF EXISTS "profiles: read own" ON public.profiles;
CREATE POLICY "profiles: read own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());


-- WHAT IT DOES: You can read profiles of anyone in your company.
-- WHY IT MATTERS: Admins can see who belongs to their company.
-- The company_id IS NOT NULL guard stops NULL from matching NULL --
-- a user with no company cannot see unassigned profiles.

DROP POLICY IF EXISTS "profiles: read same company" ON public.profiles;
CREATE POLICY "profiles: read same company"
  ON public.profiles FOR SELECT
  USING (
    company_id IS NOT NULL
    AND company_id = public.get_my_company_id()
  );


-- WHAT IT DOES: You can update your own profile row only.
-- WHY IT MATTERS: Nobody can change another person's role via the app.

DROP POLICY IF EXISTS "profiles: update own" ON public.profiles;
CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());


-- WHAT IT DOES: Admins can update any profile within their company.
-- WHY IT MATTERS: An admin can promote/demote users inside their tenant.
-- They cannot touch profiles in other companies.

DROP POLICY IF EXISTS "profiles: admins update company" ON public.profiles;
CREATE POLICY "profiles: admins update company"
  ON public.profiles FOR UPDATE
  USING (
    company_id IS NOT NULL
    AND company_id = public.get_my_company_id()
    AND public.get_my_role() = 'admin'
  );


-- ================================================================
-- EMPLOYEES
-- ================================================================

-- WHAT IT DOES: Anyone logged in to your company can see the employee list.
-- WHY IT MATTERS: Both admins and regular employees can view colleagues.
-- A user from Company B gets zero rows from Company A.

DROP POLICY IF EXISTS "employees: company can read" ON public.employees;
CREATE POLICY "employees: company can read"
  ON public.employees FOR SELECT
  USING (company_id = public.get_my_company_id());


-- WHAT IT DOES: Only admins can add employees, and only to their own company.
-- WITH CHECK runs on the new row being inserted -- the company_id in the row
-- must match the inserting user's company. An admin cannot plant a row
-- in another company's data even if they know that company's UUID.

DROP POLICY IF EXISTS "employees: admins can insert" ON public.employees;
CREATE POLICY "employees: admins can insert"
  ON public.employees FOR INSERT
  WITH CHECK (
    company_id = public.get_my_company_id()
    AND public.get_my_role() = 'admin'
  );


-- WHAT IT DOES: Only admins can edit employee records in their company.

DROP POLICY IF EXISTS "employees: admins can update" ON public.employees;
CREATE POLICY "employees: admins can update"
  ON public.employees FOR UPDATE
  USING (
    company_id = public.get_my_company_id()
    AND public.get_my_role() = 'admin'
  );


-- WHAT IT DOES: Only admins can delete employee records.

DROP POLICY IF EXISTS "employees: admins can delete" ON public.employees;
CREATE POLICY "employees: admins can delete"
  ON public.employees FOR DELETE
  USING (
    company_id = public.get_my_company_id()
    AND public.get_my_role() = 'admin'
  );


-- ================================================================
-- PROJECTS  (same pattern as employees)
-- ================================================================

DROP POLICY IF EXISTS "projects: company can read" ON public.projects;
CREATE POLICY "projects: company can read"
  ON public.projects FOR SELECT
  USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "projects: admins can insert" ON public.projects;
CREATE POLICY "projects: admins can insert"
  ON public.projects FOR INSERT
  WITH CHECK (
    company_id = public.get_my_company_id()
    AND public.get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS "projects: admins can update" ON public.projects;
CREATE POLICY "projects: admins can update"
  ON public.projects FOR UPDATE
  USING (
    company_id = public.get_my_company_id()
    AND public.get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS "projects: admins can delete" ON public.projects;
CREATE POLICY "projects: admins can delete"
  ON public.projects FOR DELETE
  USING (
    company_id = public.get_my_company_id()
    AND public.get_my_role() = 'admin'
  );


-- ================================================================
-- PROJECT EXPENSES  (same pattern -- no UPDATE, expenses are immutable)
-- ================================================================

DROP POLICY IF EXISTS "expenses: company can read" ON public.project_expenses;
CREATE POLICY "expenses: company can read"
  ON public.project_expenses FOR SELECT
  USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "expenses: admins can insert" ON public.project_expenses;
CREATE POLICY "expenses: admins can insert"
  ON public.project_expenses FOR INSERT
  WITH CHECK (
    company_id = public.get_my_company_id()
    AND public.get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS "expenses: admins can delete" ON public.project_expenses;
CREATE POLICY "expenses: admins can delete"
  ON public.project_expenses FOR DELETE
  USING (
    company_id = public.get_my_company_id()
    AND public.get_my_role() = 'admin'
  );
