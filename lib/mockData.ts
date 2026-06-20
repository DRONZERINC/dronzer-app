// ============================================================
// CENTRAL MOCK DATA FILE
// Reference/lookup data not yet backed by its own database table.
// ============================================================

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

export const aiChatCannedResponses: Record<string, string> = {
  default:
    "I'm your Dronzer AI assistant. I can help with leave requests, task updates, payroll queries, and site information. What do you need?",
  leave:
    "Your leave balance is shown in the **Leave Balance** card above. To apply for leave, go to the Leave module and submit a request — your line manager will be notified automatically.",
  salary:
    "Your gross monthly salary and next pay date are shown in the **Next Salary** card above. For payslip details, visit the Payroll section.",
  tasks:
    "Your assigned tasks are shown in the **Today's Tasks** card above. Let me know which one you'd like to update.",
  site:
    "Your assigned site is shown at the top of your dashboard. Contact your site manager for local emergency contact details.",
};
