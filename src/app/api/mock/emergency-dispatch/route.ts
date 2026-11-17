import { NextResponse } from "next/server";
import { inMemoryStore } from "@/lib/db";

// Rate limiting token bucket state for mock endpoint
let tokens = 1000;
let lastRefill = Date.now();
const MAX_CAPACITY = 1000;
const REFILL_RATE_PER_SEC = 250;

function refillTokens() {
  const now = Date.now();
  const elapsed = (now - lastRefill) / 1000;
  tokens = Math.min(MAX_CAPACITY, tokens + elapsed * REFILL_RATE_PER_SEC);
  lastRefill = now;
}

export async function GET(req: Request) {
  refillTokens();

  const userAgent = req.headers.get("user-agent") || "";
  const isZxCDDoS = /ZxCDDoS/i.test(userAgent);

  // WAF check: If mitigation active and signature matched, drop request with 403 Forbidden
  if (inMemoryStore.activeMitigationMode && isZxCDDoS) {
    return NextResponse.json(
      {
        error: "WAF_SIGNATURE_DROP",
        reason: "Request blocked by BLACKSHIELD WAF rule: ZxCDDoS signature detected.",
        timestamp: new Date().toISOString(),
      },
      { status: 403 }
    );
  }

  // Rate Limiting check
  if (tokens < 1) {
    return NextResponse.json(
      {
        error: "RATE_LIMIT_EXCEEDED",
        reason: "Emergency dispatch intake capacity reached. Token bucket empty.",
        retryAfterMs: 250,
      },
      {
        status: 429,
        headers: {
          "Retry-After": "1",
          "X-RateLimit-Limit": String(MAX_CAPACITY),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  tokens -= 1;

  // Add realistic simulated processing latency
  await new Promise((resolve) => setTimeout(resolve, Math.floor(10 + Math.random() * 25)));

  return NextResponse.json({
    status: "DISPATCH_HEALTHY",
    service: "National 911 Emergency Dispatch Intake",
    timestamp: new Date().toISOString(),
    intakeQueueStatus: "NOMINAL",
    activeOperators: 64,
    latencyMs: 18,
    rateLimitRemaining: Math.floor(tokens),
  });
}

export async function POST(req: Request) {
  return GET(req);
}
