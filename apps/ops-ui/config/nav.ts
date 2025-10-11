import { 
  type LucideIcon, 
  Home, 
  ListChecks, 
  Workflow, 
  Plug, 
  Scale, 
  CheckSquare, 
  TriangleAlert, 
  Settings 
} from "lucide-react";

export type Role = "Owner" | "Admin" | "Manager" | "Analyst" | "User" | "Service";

export type NavItem = {
  path: string;
  label: string;
  icon: LucideIcon;
  requiredRole?: Role;
  featureFlag?: string;
  children?: NavItem[];
};

export const NAV_ITEMS: NavItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: Home },
  { path: "/runs", label: "Runs", icon: ListChecks },
  { path: "/workflows", label: "Workflows", icon: Workflow },
  { path: "/connectors", label: "Connectors", icon: Plug, requiredRole: "Admin" },
  { path: "/rules", label: "Rules", icon: Scale, requiredRole: "Manager" },
  { path: "/approvals", label: "Approvals", icon: CheckSquare },
  { path: "/dlq", label: "DLQ", icon: TriangleAlert, requiredRole: "Manager" },
  { path: "/settings", label: "Settings", icon: Settings, requiredRole: "Admin" },
  { 
    path: "/prioritization", 
    label: "Prioritization", 
    icon: Workflow, 
    requiredRole: "Manager", 
    featureFlag: "ENABLE_PRIORITIZATION" 
  }
];

// Role hierarchy for permission checking
export const ROLE_HIERARCHY: Record<Role, number> = {
  Owner: 6,
  Admin: 5,
  Manager: 4,
  Analyst: 3,
  User: 2,
  Service: 1,
};

export function hasPermission(userRole: Role, requiredRole?: Role): boolean {
  if (!requiredRole) return true;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function getVisibleNavItems(userRole: Role, featureFlags: Record<string, boolean> = {}): NavItem[] {
  return NAV_ITEMS.filter(item => {
    // Check role permission
    if (!hasPermission(userRole, item.requiredRole)) {
      return false;
    }
    
    // Check feature flag
    if (item.featureFlag && !featureFlags[item.featureFlag]) {
      return false;
    }
    
    return true;
  });
}
