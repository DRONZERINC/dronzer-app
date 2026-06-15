import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(resolve(__dirname, "../.env.local"), "utf8");
const env = Object.fromEntries(
  envFile.split("\n").filter(Boolean).map((l) => l.split("="))
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const employees = [
  { name: "Ahmed Al-Rashidi",   email: "ahmed@gppc.com",  job_title: "Senior Site Supervisor", department: "Drilling Operations",  site: "dammam", salary: 14500, status: "active", hire_date: "2019-03-15" },
  { name: "Fatima Al-Mansoori", email: "fatima@gppc.com", job_title: "HSE Officer",            department: "HSE",                  site: "ruwais", salary: 11200, status: "active", hire_date: "2020-07-01" },
  { name: "Khalid Al-Omari",    email: "khalid@gppc.com", job_title: "Pipeline Engineer",      department: "Pipeline Engineering", site: "doha",   salary: 13800, status: "active", hire_date: "2018-11-20" },
  { name: "Noor Al-Khalidi",    email: "noor@gppc.com",   job_title: "Operations Manager",     department: "Project Management",   site: "dammam", salary: 16000, status: "active", hire_date: "2017-05-10" },
];

const { data, error } = await supabase.from("employees").insert(employees).select();

if (error) {
  console.error("Error:", error.message);
} else {
  console.log(`Inserted ${data.length} employees:`);
  data.forEach((e) => console.log(`  - ${e.name} (${e.email})`));
}
