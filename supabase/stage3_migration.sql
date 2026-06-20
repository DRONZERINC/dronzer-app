-- ================================================================
-- DRONZER  |  STAGE 3 OF 3  --  Data migration
--
-- Run this immediately after stage2_rls.sql.
-- This single DO block runs as one transaction:
--   1. Creates the Gulf Pioneer company
--   2. Assigns every existing employee / project / expense to it
--   3. Creates profiles for every existing auth user
-- The RAISE NOTICE lines print a summary in the Results panel.
-- ================================================================

DO $$
DECLARE
  gppc_id UUID;
BEGIN

  -- 1. Create the company row
  INSERT INTO public.companies (name, industry)
  VALUES ('Gulf Pioneer Petroleum Contractors', 'Oil & Gas')
  RETURNING id INTO gppc_id;

  -- 2. Assign all existing data rows to this company
  --    WHERE company_id IS NULL targets only pre-migration rows,
  --    so it is safe to re-run without double-assigning anything.
  UPDATE public.employees
    SET company_id = gppc_id
    WHERE company_id IS NULL;

  UPDATE public.projects
    SET company_id = gppc_id
    WHERE company_id IS NULL;

  UPDATE public.project_expenses
    SET company_id = gppc_id
    WHERE company_id IS NULL;

  -- 3. Create a profile for every existing auth user who does not
  --    already have one.  Inherits role from the signup metadata
  --    (admin / employee) that was already stored there.
  INSERT INTO public.profiles (id, company_id, role, full_name)
  SELECT
    u.id,
    gppc_id,
    COALESCE(u.raw_user_meta_data->>'role', 'employee'),
    COALESCE(u.raw_user_meta_data->>'name', u.email)
  FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
  );

  -- Summary printed in the Supabase SQL Editor Results panel
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'GPPC company_id  = %', gppc_id;
  RAISE NOTICE 'Employees linked = %', (SELECT COUNT(*) FROM public.employees        WHERE company_id = gppc_id);
  RAISE NOTICE 'Projects linked  = %', (SELECT COUNT(*) FROM public.projects         WHERE company_id = gppc_id);
  RAISE NOTICE 'Expenses linked  = %', (SELECT COUNT(*) FROM public.project_expenses WHERE company_id = gppc_id);
  RAISE NOTICE 'Profiles created = %', (SELECT COUNT(*) FROM public.profiles         WHERE company_id = gppc_id);
  RAISE NOTICE '==================================================';

END;
$$;
