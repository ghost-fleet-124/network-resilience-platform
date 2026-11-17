import { NextResponse } from "next/server";
import { ZXCDDOS_METADATA, ZXCDDOS_FINDINGS } from "@/data/zxCDDoS-intelligence";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const severity = searchParams.get("severity");

  let findings = [...ZXCDDOS_FINDINGS];

  if (category) {
    findings = findings.filter((f) => f.category === category);
  }

  if (severity) {
    findings = findings.filter((f) => f.severity === severity);
  }

  return NextResponse.json({
    disclaimer: "BLACKSHIELD DEFENSIVE SECURITY NOTICE: Source code is strictly analyzed via static AST pattern matching for countermeasure generation. Zero attack functionality is ever compiled or executed.",
    metadata: ZXCDDOS_METADATA,
    findings,
    summary: {
      totalAnalyzedFiles: 8,
      criticalFindings: ZXCDDOS_FINDINGS.filter((f) => f.severity === "CRITICAL").length,
      highFindings: ZXCDDOS_FINDINGS.filter((f) => f.severity === "HIGH").length,
      categoriesCovered: [
        "C2_INFRASTRUCTURE",
        "LAYER_7_APPLICATION",
        "LAYER_4_TRANSPORT",
        "AMPLIFICATION_REFLECTION",
        "EVASION_TECHNIQUE",
      ],
      signaturesGenerated: {
        suricataCount: 2,
        cloudflareWafCount: 3,
        nginxSnippetsCount: 2,
        sysctlRulesCount: 4,
        iptablesCount: 3,
      },
    },
  });
}
