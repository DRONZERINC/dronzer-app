-- ================================================================
-- DRONZER  |  STAGE 1 OF 3  --  Multi-tenant schema
-- Paste this entire block into: Supabase -> SQL Editor -> Run
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE throughout
-- ================================================================


-- 1. companies
-- One row per tenant. Everything else links back here.

CREATE TABLE IF NOT EXISTS public.companies (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  industry    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 2. profiles
-- One row per Supabase auth user.
-- Ties a user to a company and stores their role.
-- This becomes the authoritative source for role
-- (replaces user_metadata.role which only lives inside the JWT).

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id  UUID        REFERENCES public.companies(id) ON DELETE SET NULL,
  role        TEXT        NOT NULL DEFAULT 'employee'
                          CHECK (role IN ('admin', 'employee')),
  full_name   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- Auto-stamp updated_at on every UPDATE to profiles

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- Auto-create a profile row the moment a new user signs up.
-- Reads role and name from the signup metadata we already set.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee'),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 3. Add company_id to the three data tables
-- Nullable for now -- Stage 3 will backfill all existing rows.
-- ON DELETE CASCADE: deleting a company removes all its data.

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS company_id UUID
  REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS company_id UUID
  REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.project_expenses
  ADD COLUMN IF NOT EXISTS company_id UUID
  REFERENCES public.companies(id) ON DELETE CASCADE;


-- 4. Indexes
-- company_id will appear in every WHERE clause -- index it everywhere.

CREATE INDEX IF NOT EXISTS idx_profiles_company         ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_company        ON public.employees(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_company         ON public.projects(company_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_company ON public.project_expenses(company_id);
