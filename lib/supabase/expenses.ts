import { createClient } from "./client";

export type ExpenseCategory = "Labour" | "Equipment" | "Materials" | "Subcontractor" | "Other";

export interface ProjectExpense {
  id: string;
  project_id: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  description: string | null;
  created_by: string | null;
  company_id: string | null;
  created_at: string;
}

export type ExpenseInsert = Omit<ProjectExpense, "id" | "created_at">;

export const CATEGORIES: ExpenseCategory[] = [
  "Labour", "Equipment", "Materials", "Subcontractor", "Other",
];

export const categoryColor: Record<ExpenseCategory, string> = {
  Labour:        "#14b8a6",
  Equipment:     "#f59e0b",
  Materials:     "#818cf8",
  Subcontractor: "#22c55e",
  Other:         "#64748b",
};

export async function getProjectExpenses(projectId: string): Promise<ProjectExpense[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("project_expenses")
    .select("*")
    .eq("project_id", projectId)
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function addExpense(expense: ExpenseInsert): Promise<ProjectExpense> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("project_expenses")
    .insert(expense)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteExpense(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("project_expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
