export type Role = "student" | "academic" | "industry" | "admin";

export const ROLES: { value: Role; label: string; description: string }[] = [
  { value: "student", label: "Student", description: "Intern" },
  { value: "academic", label: "Academic Supervisor", description: "Faculty" },
  { value: "industry", label: "Industry Supervisor", description: "Company mentor" },
  { value: "admin", label: "Admin / Coordinator", description: "Internship office" },
];

export const currentUser = {
  name: "Amaka Okafor",
  email: "amaka.okafor@university.edu",
  matric: "CS/2021/0142",
  department: "Computer Science",
  company: "NorthBridge Technologies",
  position: "Frontend Engineering Intern",
  startDate: "2026-01-12",
  endDate: "2026-07-10",
  academicSupervisor: "Dr. Bola Adeyemi",
  industrySupervisor: "Mr. Daniel Yusuf",
};

export const stats = {
  weeksCompleted: 14,
  totalWeeks: 26,
  hoursLogged: 412,
  hoursTarget: 780,
  tasksDone: 23,
  tasksOpen: 5,
  pendingApprovals: 2,
  overallGrade: "A-",
};

export type LogStatus = "draft" | "submitted" | "approved" | "revision";
export type LogEntry = {
  id: string;
  week: number;
  date: string;
  hours: number;
  title: string;
  activities: string;
  skills: string[];
  status: LogStatus;
  comments: number;
};

export const logEntries: LogEntry[] = [
  { id: "L-014", week: 14, date: "2026-04-24", hours: 38, title: "Built reusable form components", activities: "Implemented React Hook Form wrappers, added Zod validation, wrote 12 unit tests.", skills: ["React", "TypeScript", "Testing"], status: "submitted", comments: 1 },
  { id: "L-013", week: 13, date: "2026-04-17", hours: 36, title: "Refactored authentication flow", activities: "Migrated auth to JWT refresh rotation, fixed two security findings.", skills: ["Security", "Node.js"], status: "approved", comments: 3 },
  { id: "L-012", week: 12, date: "2026-04-10", hours: 40, title: "Sprint review & UAT prep", activities: "Demoed sprint outcomes to PM, wrote UAT scripts.", skills: ["Agile", "QA"], status: "approved", comments: 2 },
  { id: "L-011", week: 11, date: "2026-04-03", hours: 34, title: "Database performance tuning", activities: "Added indices to reports tables, reduced query time by 62%.", skills: ["PostgreSQL"], status: "revision", comments: 4 },
  { id: "L-010", week: 10, date: "2026-03-27", hours: 38, title: "Onboarding new intern", activities: "Paired with new joiner, documented dev setup.", skills: ["Mentoring", "Docs"], status: "approved", comments: 1 },
  { id: "L-009", week: 9, date: "2026-03-20", hours: 32, title: "Customer feedback dashboard", activities: "Built charts using Recharts, exported PDF reports.", skills: ["React", "Recharts"], status: "approved", comments: 0 },
  { id: "L-015", week: 15, date: "2026-05-01", hours: 0, title: "Draft — sprint planning", activities: "Notes from planning meeting...", skills: [], status: "draft", comments: 0 },
];

export type Task = {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "submitted" | "graded";
  priority: "low" | "medium" | "high";
  due: string;
  assignedBy: string;
  grade?: string;
};

export const tasks: Task[] = [
  { id: "T-031", title: "Implement password reset flow", status: "in-progress", priority: "high", due: "2026-05-02", assignedBy: "Daniel Yusuf" },
  { id: "T-030", title: "Write API documentation for billing module", status: "todo", priority: "medium", due: "2026-05-05", assignedBy: "Daniel Yusuf" },
  { id: "T-029", title: "Sprint demo deck", status: "submitted", priority: "medium", due: "2026-04-29", assignedBy: "Daniel Yusuf" },
  { id: "T-028", title: "Refactor settings page", status: "graded", priority: "low", due: "2026-04-22", assignedBy: "Daniel Yusuf", grade: "92/100" },
  { id: "T-027", title: "Add audit logs to admin panel", status: "graded", priority: "high", due: "2026-04-15", assignedBy: "Daniel Yusuf", grade: "88/100" },
  { id: "T-026", title: "Pair on database migration", status: "graded", priority: "medium", due: "2026-04-08", assignedBy: "Daniel Yusuf", grade: "95/100" },
];

export type Student = {
  id: string;
  name: string;
  matric: string;
  department: string;
  gpa: number;
  company?: string;
  academicSupervisor?: string;
  industrySupervisor?: string;
  status: "placed" | "pending" | "completed";
  progress: number;
};

export const students: Student[] = [
  { id: "S-001", name: "Amaka Okafor", matric: "CS/2021/0142", department: "Computer Science", gpa: 4.42, company: "NorthBridge Technologies", academicSupervisor: "Dr. Bola Adeyemi", industrySupervisor: "Daniel Yusuf", status: "placed", progress: 54 },
  { id: "S-002", name: "Tunde Ibrahim", matric: "CS/2021/0157", department: "Computer Science", gpa: 4.10, company: "Helix Analytics", academicSupervisor: "Dr. Bola Adeyemi", industrySupervisor: "Sarah Chen", status: "placed", progress: 61 },
  { id: "S-003", name: "Chioma Eze", matric: "SE/2021/0088", department: "Software Engineering", gpa: 4.71, company: "Orbit Labs", academicSupervisor: "Prof. Femi Lawal", industrySupervisor: "Marco Rossi", status: "placed", progress: 48 },
  { id: "S-004", name: "Yusuf Bello", matric: "IT/2021/0231", department: "Information Tech.", gpa: 3.85, status: "pending", progress: 0 },
  { id: "S-005", name: "Halima Aliyu", matric: "CS/2021/0190", department: "Computer Science", gpa: 4.05, company: "Vertex Cloud", academicSupervisor: "Dr. Bola Adeyemi", industrySupervisor: "Anita Mensah", status: "placed", progress: 72 },
  { id: "S-006", name: "Emeka Obi", matric: "SE/2021/0102", department: "Software Engineering", gpa: 3.95, company: "ByteForge", academicSupervisor: "Prof. Femi Lawal", industrySupervisor: "Liam Walker", status: "placed", progress: 39 },
  { id: "S-007", name: "Ngozi Uche", matric: "CS/2021/0210", department: "Computer Science", gpa: 4.55, status: "completed", progress: 100, company: "NorthBridge Technologies", academicSupervisor: "Dr. Bola Adeyemi", industrySupervisor: "Daniel Yusuf" },
  { id: "S-008", name: "Ibrahim Sani", matric: "IT/2021/0245", department: "Information Tech.", gpa: 3.60, status: "pending", progress: 0 },
];

export type Company = {
  id: string;
  name: string;
  sector: string;
  slots: number;
  filled: number;
  contact: string;
  rating: number;
};

export const companies: Company[] = [
  { id: "C-01", name: "NorthBridge Technologies", sector: "Software", slots: 5, filled: 4, contact: "Daniel Yusuf", rating: 4.7 },
  { id: "C-02", name: "Helix Analytics", sector: "Data", slots: 3, filled: 2, contact: "Sarah Chen", rating: 4.5 },
  { id: "C-03", name: "Orbit Labs", sector: "AI / ML", slots: 4, filled: 3, contact: "Marco Rossi", rating: 4.8 },
  { id: "C-04", name: "Vertex Cloud", sector: "Cloud Infra", slots: 6, filled: 4, contact: "Anita Mensah", rating: 4.6 },
  { id: "C-05", name: "ByteForge", sector: "Fintech", slots: 4, filled: 2, contact: "Liam Walker", rating: 4.3 },
  { id: "C-06", name: "PixelGrid Studios", sector: "Design / Web", slots: 2, filled: 0, contact: "Yara Khalil", rating: 4.4 },
];

export type Supervisor = {
  id: string;
  name: string;
  type: "academic" | "industry";
  affiliation: string;
  load: number;
  capacity: number;
  pending: number;
};

export const supervisors: Supervisor[] = [
  { id: "SV-01", name: "Dr. Bola Adeyemi", type: "academic", affiliation: "Dept. of Computer Science", load: 12, capacity: 15, pending: 3 },
  { id: "SV-02", name: "Prof. Femi Lawal", type: "academic", affiliation: "Dept. of Software Eng.", load: 9, capacity: 12, pending: 1 },
  { id: "SV-03", name: "Dr. Aisha Bako", type: "academic", affiliation: "Dept. of Information Tech.", load: 7, capacity: 10, pending: 2 },
  { id: "SV-04", name: "Daniel Yusuf", type: "industry", affiliation: "NorthBridge Technologies", load: 4, capacity: 5, pending: 2 },
  { id: "SV-05", name: "Sarah Chen", type: "industry", affiliation: "Helix Analytics", load: 2, capacity: 3, pending: 0 },
  { id: "SV-06", name: "Marco Rossi", type: "industry", affiliation: "Orbit Labs", load: 3, capacity: 4, pending: 1 },
];

export const submissionTrend = [
  { week: "W8", submitted: 78, approved: 70 },
  { week: "W9", submitted: 82, approved: 76 },
  { week: "W10", submitted: 88, approved: 80 },
  { week: "W11", submitted: 75, approved: 68 },
  { week: "W12", submitted: 91, approved: 85 },
  { week: "W13", submitted: 86, approved: 82 },
  { week: "W14", submitted: 93, approved: 88 },
];

export const sectorDistribution = [
  { name: "Software", value: 32 },
  { name: "Data / AI", value: 18 },
  { name: "Cloud", value: 14 },
  { name: "Fintech", value: 11 },
  { name: "Design", value: 8 },
];

export const evaluationScores = [
  { criterion: "Technical", mid: 78, final: 86 },
  { criterion: "Communication", mid: 72, final: 84 },
  { criterion: "Teamwork", mid: 80, final: 88 },
  { criterion: "Initiative", mid: 70, final: 82 },
  { criterion: "Punctuality", mid: 85, final: 90 },
];