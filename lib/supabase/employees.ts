import { createClient } from "./client";

export interface Employee {
  id: string;
  name: string;
  email: string;
  job_title: string | null;
  department: string | null;
  site: string | null;
  salary: number | null;
  status: "active" | "inactive";
  hire_date: string | null;
  created_at: string;
  updated_at: string;
}

export type EmployeeInsert = Omit<Employee, "id" | "created_at" | "updated_at">;
export type EmployeeUpdate = Partial<EmployeeInsert>;

export async function getEmployees(): Promise<Employee[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return data;
}

export async function createEmployee(emp: EmployeeInsert): Promise<Employee> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("employees")
    .insert(emp)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateEmployee(id: string, updates: EmployeeUpdate): Promise<Employee> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("employees")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function archiveEmployee(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("employees")
    .update({ status: "inactive" })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteEmployee(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("employees").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
