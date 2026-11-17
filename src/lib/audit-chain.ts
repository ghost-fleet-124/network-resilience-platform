// BLACKSHIELD V2 — Cryptographic Audit Trail & Tamper-Evident Ledger
// Chained SHA-256 Event Hashes ensuring non-repudiation and audit log integrity.

import crypto from "crypto";
import { ForensicAuditEntry, UserRole } from "./types";

export interface ChainedAuditEvent extends ForensicAuditEntry {
  previousHash: string;
  eventHash: string;
}

export const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

let auditChain: ChainedAuditEvent[] = [];

/**
 * Calculates cryptographic SHA-256 hash of an audit event linked to its predecessor
 */
export function computeEventHash(
  previousHash: string,
  timestamp: string,
  userName: string,
  userRole: string,
  action: string,
  resource: string,
  details: any
): string {
  const payload = JSON.stringify({
    previousHash,
    timestamp,
    userName,
    userRole,
    action,
    resource,
    details,
  });

  return crypto.createHash("sha256").update(payload).digest("hex");
}

/**
 * Appends an event to the tamper-evident cryptographic chain
 */
export function appendAuditEvent(entry: Omit<ForensicAuditEntry, "id" | "timestamp">): ChainedAuditEvent {
  const previousHash = auditChain.length > 0 ? auditChain[0].eventHash : GENESIS_HASH;
  const timestamp = new Date().toISOString();
  const id = `aud_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

  const eventHash = computeEventHash(
    previousHash,
    timestamp,
    entry.userName,
    entry.userRole,
    entry.action,
    entry.resource,
    entry.details
  );

  const chainedEvent: ChainedAuditEvent = {
    id,
    timestamp,
    previousHash,
    eventHash,
    ...entry,
  };

  // Prepend to list (latest first)
  auditChain.unshift(chainedEvent);
  if (auditChain.length > 1000) auditChain.pop();

  return chainedEvent;
}

/**
 * Verifies cryptographic integrity of the entire audit chain
 */
export function verifyChainIntegrity(): { isValid: boolean; totalEvents: number; compromisedIndex?: number } {
  if (auditChain.length === 0) return { isValid: true, totalEvents: 0 };

  // Inspect in chronological order (reverse of storage)
  const chronological = [...auditChain].reverse();
  let expectedPrevHash = GENESIS_HASH;

  for (let i = 0; i < chronological.length; i++) {
    const event = chronological[i];
    if (event.previousHash !== expectedPrevHash) {
      return { isValid: false, totalEvents: chronological.length, compromisedIndex: i };
    }

    const calculatedHash = computeEventHash(
      event.previousHash,
      event.timestamp,
      event.userName,
      event.userRole,
      event.action,
      event.resource,
      event.details
    );

    if (calculatedHash !== event.eventHash) {
      return { isValid: false, totalEvents: chronological.length, compromisedIndex: i };
    }

    expectedPrevHash = event.eventHash;
  }

  return { isValid: true, totalEvents: chronological.length };
}

/**
 * Retrieves the cryptographic audit chain
 */
export function getAuditChain(): ChainedAuditEvent[] {
  return [...auditChain];
}

// Initialize seed events with verified hash chaining
(function initSeedChain() {
  if (auditChain.length === 0) {
    appendAuditEvent({
      userName: "SYSTEM_INIT",
      userRole: "ADMIN",
      action: "LEDGER_INITIALIZED",
      resource: "BLACKSHIELD Cryptographic Audit Engine",
      details: { genesisHash: GENESIS_HASH, securityPolicy: "FIPS-140-3-COMPLIANT" },
      ipAddress: "127.0.0.1",
      status: "SUCCESS",
    });

    appendAuditEvent({
      userName: "Marcus Kane",
      userRole: "SOC_LEAD",
      action: "MITIGATION_SHIELD_DEPLOYED",
      resource: "Global Emergency Defense Shield",
      details: { trigger: "INC-2026-0881", mode: "ACTIVE_MITIGATION" },
      ipAddress: "10.14.0.12",
      status: "SUCCESS",
    });

    appendAuditEvent({
      userName: "Sarah Vance",
      userRole: "ADMIN",
      action: "POLICY_RATE_LIMIT_TUNED",
      resource: "Emergency 911 Dispatch Token Bucket",
      details: { capacity: 1000, refillRate: 250 },
      ipAddress: "10.14.0.2",
      status: "SUCCESS",
    });
  }
})();
