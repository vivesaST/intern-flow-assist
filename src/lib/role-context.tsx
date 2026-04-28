import { createContext, useContext, useState, type ReactNode } from "react";
import type { Role } from "./mock-data";

type RoleCtx = {
  role: Role;
  setRole: (r: Role) => void;
};

const RoleContext = createContext<RoleCtx>({ role: "student", setRole: () => {} });

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("student");
  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>;
}

export function useRole() {
  return useContext(RoleContext);
}