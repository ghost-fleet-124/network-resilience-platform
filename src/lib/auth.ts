// BLACKSHIELD V2 — SOC Authentication & Server-Side RBAC Engine
import { NextResponse } from "next/server";
import { SOCUser, UserRole } from "./types";
import { logAuditEvent } from "./db";

export const SOC_OPERATORS: SOCUser[] = [
  {
    id: "usr_admin_01",
    name: "Sarah Vance",
    email: "sarah.vance@blackshield.gov",
    role: "ADMIN",
    badgeNumber: "BS-001-ADM",
  },
  {
    id: "usr_lead_02",
    name: "Marcus Kane",
    email: "marcus.kane@blackshield.gov",
    role: "SOC_LEAD",
    badgeNumber: "BS-014-LEAD",
  },
  {
    id: "usr_analyst_03",
    name: "Elena Rostova",
    email: "elena.rostova@blackshield.gov",
    role: "ANALYST",
    badgeNumber: "BS-089-ANA",
  },
  {
    id: "usr_auditor_04",
    name: "David Chen",
    email: "david.chen@blackshield.gov",
    role: "AUDITOR",
    badgeNumber: "BS-102-AUD",
  },
];

export const PERMISSIONS: Record<UserRole, {
  canTriggerLoadTest: boolean;
  canEmergencyStop: boolean;
  canEditDefensePolicies: boolean;
  canToggleMitigationMode: boolean;
  canAcknowledgeAlerts: boolean;
  canExportForensicReport: boolean;
  canManageUsers: boolean;
}> = {
  ADMIN: {
    canTriggerLoadTest: true,
    canEmergencyStop: true,
    canEditDefensePolicies: true,
    canToggleMitigationMode: true,
    canAcknowledgeAlerts: true,
    canExportForensicReport: true,
    canManageUsers: true,
  },
  SOC_LEAD: {
    canTriggerLoadTest: true,
    canEmergencyStop: true,
    canEditDefensePolicies: true,
    canToggleMitigationMode: true,
    canAcknowledgeAlerts: true,
    canExportForensicReport: true,
    canManageUsers: false,
  },
  ANALYST: {
    canTriggerLoadTest: false,
    canEmergencyStop: false,
    canEditDefensePolicies: false,
    canToggleMitigationMode: false,
    canAcknowledgeAlerts: true,
    canExportForensicReport: true,
    canManageUsers: false,
  },
  AUDITOR: {
    canTriggerLoadTest: false,
    canEmergencyStop: false,
    canEditDefensePolicies: false,
    canToggleMitigationMode: false,
    canAcknowledgeAlerts: false,
    canExportForensicReport: true,
    canManageUsers: false,
  },
};

export function getOperatorByRole(role: UserRole): SOCUser {
  return SOC_OPERATORS.find((u) => u.role === role) || SOC_OPERATORS[1]; // Marcus Kane default
}

export function hasPermission(role: UserRole, permissionKey: keyof typeof PERMISSIONS["ADMIN"]): boolean {
  return PERMISSIONS[role]?.[permissionKey] ?? false;
}

/**
 * Server-Side RBAC verification enforcing role permissions on API requests
 */
export function verifyServerAuth(
  req: Request,
  requiredPermission?: keyof typeof PERMISSIONS["ADMIN"]
): { authorized: boolean; operator: SOCUser; errorResponse?: NextResponse } {
  const roleHeader = (req.headers.get("x-soc-role") || "SOC_LEAD") as UserRole;
  const operator = getOperatorByRole(roleHeader);

  if (requiredPermission && !hasPermission(operator.role, requiredPermission)) {
    logAuditEvent({
      userName: operator.name,
      userRole: operator.role,
      action: "UNAUTHORIZED_API_ACCESS_BLOCKED",
      resource: req.url,
      details: { requiredPermission, operatorRole: operator.role },
      ipAddress: "127.0.0.1",
      status: "DENIED",
    });

    return {
      authorized: false,
      operator,
      errorResponse: NextResponse.json(
        {
          error: "FORBIDDEN_RBAC_VIOLATION",
          message: `Operator role '${operator.role}' lacks the required permission: '${requiredPermission}'.`,
          requiredPermission,
        },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, operator };
}
