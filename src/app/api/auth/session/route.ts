import { NextResponse } from "next/server";
import { SOC_OPERATORS, getOperatorByRole, PERMISSIONS } from "@/lib/auth";
import { UserRole } from "@/lib/types";
import { logAuditEvent } from "@/lib/db";

// Active in-memory session (defaults to SOC Lead Marcus Kane)
let currentRole: UserRole = "SOC_LEAD";

export async function GET() {
  const operator = getOperatorByRole(currentRole);
  const permissions = PERMISSIONS[currentRole];

  return NextResponse.json({
    operator,
    permissions,
    availableOperators: SOC_OPERATORS,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { role } = body as { role: UserRole };

    if (!role || !PERMISSIONS[role]) {
      return NextResponse.json({ error: "Invalid role specified." }, { status: 400 });
    }

    const previousRole = currentRole;
    currentRole = role;
    const operator = getOperatorByRole(currentRole);

    logAuditEvent({
      userName: operator.name,
      userRole: operator.role,
      action: "OPERATOR_ROLE_SWITCHED",
      resource: "Session Authentication",
      details: { previousRole, newRole: role, badge: operator.badgeNumber },
      ipAddress: "127.0.0.1",
      status: "SUCCESS",
    });

    return NextResponse.json({
      message: `Role switched to ${role}`,
      operator,
      permissions: PERMISSIONS[currentRole],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
