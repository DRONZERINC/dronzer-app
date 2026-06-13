// ============================================================
// CENTRAL MOCK DATA FILE
// Swap this file to serve a different company/industry tenant.
// All company-specific details live here and nowhere else.
// ============================================================

export const company = {
  name: "Gulf Pioneer Petroleum Contractors",
  shortName: "GPPC",
  industry: "Oil & Gas",
  region: "Gulf Cooperation Council",
  currency: "USD",
  fiscalYearEnd: "December",
};

export const sites = [
  { id: "ruwais", name: "Ruwais", country: "UAE", flag: "🇦🇪", headcount: 98, color: "#f59e0b" },
  { id: "dammam", name: "Dammam", country: "Saudi Arabia", flag: "🇸🇦", headcount: 87, color: "#14b8a6" },
  { id: "duqm", name: "Duqm", country: "Oman", flag: "🇴🇲", headcount: 76, color: "#818cf8" },
  { id: "doha", name: "Doha", country: "Qatar", flag: "🇶🇦", headcount: 81, color: "#34d399" },
];

export const departments = [
  "Drilling Operations",
  "Pipeline Engineering",
  "HSE",
  "Procurement",
  "Finance",
  "Human Resources",
  "Maintenance",
  "Project Management",
];

export const employees = [
  {
    id: "emp-001",
    name: "Ahmed Al-Rashidi",
    email: "ahmed@gppc.com",
    role: "Senior Site Supervisor",
    department: "Drilling Operations",
    site: "dammam",
    salary: 14500,
    currency: "USD",
    joinDate: "2019-03-15",
    nextSalaryDate: "2026-07-01",
    leaveBalance: { annual: 21, annualTotal: 30, sick: 3, sickTotal: 10 },
  },
  {
    id: "emp-002",
    name: "Fatima Al-Mansoori",
    email: "fatima@gppc.com",
    role: "HSE Officer",
    department: "HSE",
    site: "ruwais",
    salary: 11200,
    currency: "USD",
    joinDate: "2020-07-01",
    nextSalaryDate: "2026-07-01",
    leaveBalance: { annual: 14, annualTotal: 30, sick: 0, sickTotal: 10 },
  },
  {
    id: "emp-003",
    name: "Khalid Al-Omari",
    email: "khalid@gppc.com",
    role: "Pipeline Engineer",
    department: "Pipeline Engineering",
    site: "doha",
    salary: 13800,
    currency: "USD",
    joinDate: "2018-11-20",
    nextSalaryDate: "2026-07-01",
    leaveBalance: { annual: 9, annualTotal: 30, sick: 5, sickTotal: 10 },
  },
];

// The "demo logged-in" employee (used for Employee Dashboard)
export const currentEmployee = employees[0];

export const adminUser = {
  id: "adm-001",
  name: "Noor Al-Khalidi",
  email: "noor@gppc.com",
  role: "Operations Manager",
  department: "Project Management",
};

export const tasks = [
  {
    id: "task-001",
    title: "Submit daily rig report — Dammam Well-7",
    priority: "high",
    due: "Today",
    status: "pending",
    assignedTo: "emp-001",
  },
  {
    id: "task-002",
    title: "Review HSE checklist for night shift",
    priority: "medium",
    due: "Today",
    status: "in_progress",
    assignedTo: "emp-001",
  },
  {
    id: "task-003",
    title: "Co-sign equipment maintenance log",
    priority: "low",
    due: "Today",
    status: "pending",
    assignedTo: "emp-001",
  },
  {
    id: "task-004",
    title: "Pipeline weld inspection — Section 4B",
    priority: "high",
    due: "Tomorrow",
    status: "pending",
    assignedTo: "emp-001",
  },
];

export const adminTasks = [
  { id: "at-001", title: "Approve leave requests (3 pending)", site: "Ruwais", priority: "high" },
  { id: "at-002", title: "Finalize Q3 procurement schedule", site: "Dammam", priority: "high" },
  { id: "at-003", title: "Review contractor onboarding docs", site: "Duqm", priority: "medium" },
  { id: "at-004", title: "Update headcount report for board", site: "All Sites", priority: "medium" },
  { id: "at-005", title: "Renew equipment certification — Crane #12", site: "Doha", priority: "low" },
];

export const projects = [
  {
    id: "proj-001",
    name: "Ruwais Gas Processing Expansion",
    site: "ruwais",
    country: "UAE",
    status: "on_track",
    phase: "Construction",
    deadline: "2026-11-30",
    pm: "Ibrahim Al-Sayed",
    milestones: [
      { name: "Site Preparation", done: true },
      { name: "Foundation Works", done: true },
      { name: "Equipment Installation", done: true },
      { name: "Piping & Instrumentation", done: false },
      { name: "Commissioning", done: false },
    ],
    budget: { total: 4200000, spent: 3010000 },
    description: "Expansion of gas processing capacity by 40% to meet increased upstream output.",
  },
  {
    id: "proj-002",
    name: "Dammam Pipeline Rehabilitation",
    site: "dammam",
    country: "Saudi Arabia",
    status: "on_track",
    phase: "Engineering",
    deadline: "2027-03-15",
    pm: "Samir Al-Harbi",
    milestones: [
      { name: "Condition Assessment", done: true },
      { name: "Engineering Design", done: true },
      { name: "Procurement", done: false },
      { name: "Installation", done: false },
      { name: "Testing & Handover", done: false },
    ],
    budget: { total: 2750000, spent: 980000 },
    description: "Full rehabilitation of 42 km pipeline corridor, including cathodic protection upgrade.",
  },
  {
    id: "proj-003",
    name: "Duqm Refinery Auxiliary Systems",
    site: "duqm",
    country: "Oman",
    status: "over_budget",
    phase: "Construction",
    deadline: "2026-09-01",
    pm: "Hessa Al-Balushi",
    milestones: [
      { name: "FEED Completion", done: true },
      { name: "Civil Works", done: true },
      { name: "Mechanical Installation", done: true },
      { name: "Electrical & Instrumentation", done: false },
      { name: "Commissioning", done: false },
    ],
    budget: { total: 3100000, spent: 3472000 }, // 12% over budget
    description: "Installation of auxiliary utility systems for the new refinery processing train.",
    overBudgetPct: 12,
  },
  {
    id: "proj-004",
    name: "Doha Compression Station Upgrade",
    site: "doha",
    country: "Qatar",
    status: "at_risk",
    phase: "Procurement",
    deadline: "2027-01-20",
    pm: "Jassim Al-Thani",
    milestones: [
      { name: "Feasibility Study", done: true },
      { name: "Detail Engineering", done: true },
      { name: "Procurement", done: false },
      { name: "Construction", done: false },
      { name: "Commissioning", done: false },
    ],
    budget: { total: 5600000, spent: 1540000 },
    description: "Capacity upgrade of main compression station to support LNG export ramp-up.",
  },
];

export const documentStats = {
  total: 1247,
  byType: [
    { type: "Contracts", count: 214, icon: "📋" },
    { type: "HSE Reports", count: 389, icon: "🛡️" },
    { type: "Engineering Drawings", count: 302, icon: "📐" },
    { type: "HR Documents", count: 198, icon: "👤" },
    { type: "Invoices", count: 144, icon: "💵" },
  ],
  recentUploads: [
    { name: "Dammam_Pipeline_Weld_Report_Jun2026.pdf", type: "HSE Report", site: "Dammam", date: "2026-06-11" },
    { name: "GPPC_Ruwais_Contract_Amendment_3.docx", type: "Contract", site: "Ruwais", date: "2026-06-10" },
    { name: "Duqm_BudgetRevision_Q2.xlsx", type: "Finance", site: "Duqm", date: "2026-06-09" },
  ],
};

export const aiChatCannedResponses: Record<string, string> = {
  default:
    "I'm your Dronzer AI assistant. I can help with leave requests, task updates, payroll queries, and site information. What do you need?",
  leave:
    "You have **21 annual leave days** remaining this year. To apply for leave, go to the Leave module and submit a request — your line manager will be notified automatically.",
  salary:
    "Your next salary payment is scheduled for **July 1, 2026**. Your current gross is $14,500/month. For payslip details, visit the Payroll section.",
  tasks:
    "You have **3 tasks due today**: a rig report, HSE checklist review, and co-signing the maintenance log. Which one would you like to update?",
  site:
    "You are currently assigned to the **Dammam, Saudi Arabia** site. Your site manager is Samir Al-Harbi. Emergency site contact: +966-13-555-0100.",
};
