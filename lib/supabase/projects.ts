import { createClient } from "./client";

export interface Project {
  id: string;
  name: string;
  site: string | null;
  country: string | null;
  status: "on_track" | "at_risk" | "completed" | "archived";
  phase: string | null;
  deadline: string | null;
  pm: string | null;
  description: string | null;
  milestone_pct: number;
  budget_amount: number;
  actual_spend: number;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

export type ProjectInsert = Omit<Project, "id" | "created_at" | "updated_at">;
export type ProjectUpdate = Partial<ProjectInsert>;

export function isOverBudget(p: Project): boolean {
  return p.actual_spend > p.budget_amount;
}

export async function getProjects(): Promise<Project[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at");
  if (error) throw new Error(error.message);
  return data;
}

export async function createProject(p: ProjectInsert): Promise<Project> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert(p)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateProject(id: string, updates: ProjectUpdate): Promise<Project> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function archiveProject(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("projects")
    .update({ status: "archived" })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
