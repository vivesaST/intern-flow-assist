import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  Building2,
  Users,
  GraduationCap,
  BarChart3,
  Settings,
  Briefcase,
  CheckSquare,
  ListChecks,
  Clock,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useRole } from "@/lib/role-context";
import type { Role } from "@/lib/mock-data";

type Item = { title: string; url: string; icon: any };

const ALL = {
  dashboard: { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  attendance: { title: "Attendance", url: "/attendance", icon: Clock },
  logbook: { title: "Logbook", url: "/logbook", icon: BookOpen },
  tasks: { title: "Tasks", url: "/tasks", icon: ListChecks },
  approvals: { title: "Approvals", url: "/approvals", icon: CheckSquare },
  evaluations: { title: "Evaluations", url: "/evaluations", icon: ClipboardCheck },
  placements: { title: "Placements", url: "/placements", icon: Briefcase },
  students: { title: "Students", url: "/students", icon: GraduationCap },
  supervisors: { title: "Supervisors", url: "/supervisors", icon: Users },
  companies: { title: "Companies", url: "/companies", icon: Building2 },
  reports: { title: "Reports", url: "/reports", icon: BarChart3 },
} satisfies Record<string, Item>;

/** Each role only sees nav for actions it actually performs. */
const NAV_BY_ROLE: Record<Role, Item[]> = {
  student: [ALL.dashboard, ALL.attendance, ALL.logbook, ALL.tasks],
  industry: [ALL.dashboard, ALL.attendance, ALL.tasks, ALL.approvals, ALL.evaluations],
  academic: [ALL.dashboard, ALL.attendance, ALL.approvals, ALL.evaluations, ALL.students, ALL.reports],
  admin: [
    ALL.dashboard,
    ALL.attendance,
    ALL.approvals,
    ALL.evaluations,
    ALL.placements,
    ALL.students,
    ALL.supervisors,
    ALL.companies,
    ALL.reports,
  ],
};

export function AppSidebar() {
  const { role } = useRole();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const visible = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.student;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-3">
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visible.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/profile"}>
              <Link to="/profile">
                <Settings className="h-4 w-4" />
                <span>Profile & Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
