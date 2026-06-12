import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  BookOpen,
  ListChecks,
  ClipboardCheck,
  Building2,
  Users,
  GraduationCap,
  BarChart3,
  Settings,
  Briefcase,
  CheckSquare,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useRole } from "@/lib/role-context";
import type { Role } from "@/lib/mock-data";

type Item = { title: string; url: string; icon: any; roles: Role[] };

const items: Item[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["student", "academic", "industry", "admin"] },
  { title: "Logbook", url: "/logbook", icon: BookOpen, roles: ["student", "academic", "industry"] },
  { title: "Approvals", url: "/approvals", icon: CheckSquare, roles: ["academic", "industry", "admin"] },
  { title: "Tasks", url: "/tasks", icon: ListChecks, roles: ["student", "industry"] },
  { title: "Evaluations", url: "/evaluations", icon: ClipboardCheck, roles: ["student", "academic", "industry", "admin"] },
  { title: "Placements", url: "/placements", icon: Briefcase, roles: ["admin"] },
  { title: "Students", url: "/students", icon: GraduationCap, roles: ["academic", "admin"] },
  { title: "Supervisors", url: "/supervisors", icon: Users, roles: ["admin"] },
  { title: "Companies", url: "/companies", icon: Building2, roles: ["admin"] },
  { title: "Reports", url: "/reports", icon: BarChart3, roles: ["academic", "admin"] },
];

export function AppSidebar() {
  const { role } = useRole();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const visible = items.filter((i) => i.roles.includes(role));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground font-bold text-xs">
            SI
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground">Smart Internship</span>
            <span className="text-xs text-sidebar-foreground/70">SI Platform</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
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