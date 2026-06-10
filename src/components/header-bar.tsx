import { Bell, LogOut, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/role-context";
import { ROLES, currentUser } from "@/lib/mock-data";
import { useNavigate } from "@tanstack/react-router";

export function HeaderBar() {
  const { role, setRole, user, signOut } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.user_metadata?.full_name || user?.email || currentUser.name;
  const initials = displayName.split(" ").map((n: string) => n[0]).slice(0, 2).join("");
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background px-4">
      <SidebarTrigger />
      <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search students, logbooks, tasks…" className="pl-8 h-9" />
        </div>
      </div>
      <div className="ml-auto flex items-center gap-3">
        {!user && <Badge variant="outline" className="hidden sm:inline-flex">Demo</Badge>}
        <Select value={role} onValueChange={(v) => setRole(v as any)}>
          <SelectTrigger className="w-[200px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col leading-tight">
            <span className="text-xs font-medium">{displayName}</span>
            <span className="text-[10px] text-muted-foreground">{user?.email ?? currentUser.matric}</span>
          </div>
        </div>
        {user && (
          <Button variant="ghost" size="icon" onClick={async () => { await signOut(); navigate({ to: "/auth" }); }} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  );
}