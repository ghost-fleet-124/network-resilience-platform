import { NextResponse } from "next/server";
import {
  VERIFIED_REPO_METADATA,
  VERIFIED_FINDINGS,
  VERIFIED_FILE_INVENTORY,
} from "@/data/zxCDDoS-verified";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const provenance = searchParams.get("provenance");

  let findings = [...VERIFIED_FINDINGS];

  if (category) {
    findings = findings.filter((f) => f.category === category);
  }

  if (provenance) {
    findings = findings.filter((f) => f.provenance === provenance);
  }

  return NextResponse.json({
    disclaimer: "BLACKSHIELD DEFENSIVE INTELLIGENCE NOTICE: Source files analyzed statically via AST parsing and lexical signature extraction from verified checkout commit db7c335ca1eb1a3871f167a521807b0ffc943d60. Zero attack functionality is ever executed.",
    metadata: VERIFIED_REPO_METADATA,
    fileInventory: VERIFIED_FILE_INVENTORY,
    findings,
    provenanceBreakdown: {
      verifiedSourceCount: VERIFIED_FINDINGS.filter((f) => f.provenance === "VERIFIED_SOURCE").length,
      verifiedArtifactCount: VERIFIED_FINDINGS.filter((f) => f.provenance === "VERIFIED_FILE_ARTIFACT").length,
      inferredBinaryCount: VERIFIED_FINDINGS.filter((f) => f.provenance === "INFERRED_BINARY_ANALYSIS").length,
    },
    summary: {
      totalAnalyzedFiles: VERIFIED_FILE_INVENTORY.length,
      criticalFindings: VERIFIED_FINDINGS.filter((f) => f.severity === "CRITICAL").length,
      highFindings: VERIFIED_FINDINGS.filter((f) => f.severity === "HIGH").length,
      signaturesGenerated: {
        suricataCount: VERIFIED_FINDINGS.filter((f) => f.defensiveSignatures.suricataRule).length,
        cloudflareWafCount: VERIFIED_FINDINGS.filter((f) => f.defensiveSignatures.cloudflareWafExpression).length,
        nginxSnippetsCount: VERIFIED_FINDINGS.filter((f) => f.defensiveSignatures.nginxMitigation).length,
        sysctlRulesCount: VERIFIED_FINDINGS.filter((f) => f.defensiveSignatures.linuxKernelSysctl).length,
        iptablesCount: VERIFIED_FINDINGS.filter((f) => f.defensiveSignatures.iptablesRule).length,
      },
    },
  });
}
