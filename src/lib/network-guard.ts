// BLACKSHIELD V2 — Deep Network Guard & SSRF Protection Engine
// Enforces Server-Side DNS Resolution, IP Canonicalization, DNS Rebinding Defense,
// Cloud Metadata Protection, and Strict Laboratory Authorization.

import dns from "dns";
import net from "net";

export interface NetworkValidationResult {
  allowed: boolean;
  resolvedIps: string[];
  canonicalUrl: string;
  rejectionReason?: string;
  violationCode?: 
    | "INVALID_URL"
    | "UNAPPROVED_PROTOCOL"
    | "UNAPPROVED_PORT"
    | "DNS_RESOLUTION_FAILED"
    | "CLOUD_METADATA_PROHIBITED"
    | "UNAUTHORIZED_PUBLIC_NETWORK"
    | "UNAUTHORIZED_PRIVATE_NETWORK"
    | "DNS_REBINDING_DETECTED"
    | "ZERO_ADDRESS_PROHIBITED";
}

// Approved Ports for Controlled Laboratory Testing
export const APPROVED_PORTS = new Set([80, 443, 3000, 8000, 8080, 8888]);

// Authorized Laboratory Target Domains
export const AUTHORIZED_LAB_DOMAINS = [
  "localhost",
  "127.0.0.1",
  "::1",
  "blackshield-web",
  "*.internal.local",
  "*.defense.test",
];

/**
 * Checks if an IPv4 address is in 169.254.0.0/16 (Link-Local / Cloud Metadata)
 */
function isLinkLocalIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  return parts[0] === 169 && parts[1] === 254;
}

/**
 * Checks if an IPv4 address is in 127.0.0.0/8 (Loopback)
 */
function isLoopbackIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  return parts[0] === 127;
}

/**
 * Checks if an IPv4 address is RFC 1918 Private
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts[0] === 10) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  return false;
}

/**
 * Normalizes IPv4-mapped IPv6 addresses (e.g., ::ffff:127.0.0.1 -> 127.0.0.1)
 */
export function normalizeIP(rawIp: string): { ip: string; isIPv6: boolean } {
  let ip = rawIp.toLowerCase().trim();

  // Strip IPv4-mapped prefix ::ffff:
  if (ip.startsWith("::ffff:") && ip.includes(".")) {
    return { ip: ip.substring(7), isIPv6: false };
  }

  // Detect IPv6 vs IPv4
  const isIPv6 = ip.includes(":");
  return { ip, isIPv6 };
}

/**
 * Deep validation of a load test target with DNS resolution & SSRF protection
 */
export async function validateTargetSecurity(urlStr: string): Promise<NetworkValidationResult> {
  let parsed: URL;

  // 1. Syntactic URL validation
  try {
    if (!urlStr.startsWith("http://") && !urlStr.startsWith("https://")) {
      parsed = new URL(`http://${urlStr}`);
    } else {
      parsed = new URL(urlStr);
    }
  } catch (err: any) {
    return {
      allowed: false,
      resolvedIps: [],
      canonicalUrl: urlStr,
      rejectionReason: `Malformed target URL: ${err.message}`,
      violationCode: "INVALID_URL",
    };
  }

  // 2. Protocol validation
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      allowed: false,
      resolvedIps: [],
      canonicalUrl: parsed.href,
      rejectionReason: `Protocol '${parsed.protocol}' is not permitted. Only HTTP and HTTPS laboratory endpoints are allowed.`,
      violationCode: "UNAPPROVED_PROTOCOL",
    };
  }

  // 3. Port validation (Default 80 for http, 443 for https)
  const port = parsed.port ? parseInt(parsed.port, 10) : parsed.protocol === "https:" ? 443 : 80;
  if (!APPROVED_PORTS.has(port)) {
    return {
      allowed: false,
      resolvedIps: [],
      canonicalUrl: parsed.href,
      rejectionReason: `Port ${port} is not in the approved laboratory testing port list (Approved: ${Array.from(APPROVED_PORTS).join(", ")}).`,
      violationCode: "UNAPPROVED_PORT",
    };
  }

  const hostname = parsed.hostname;

  // 4. Prohibit zero addresses (0.0.0.0, ::)
  if (hostname === "0.0.0.0" || hostname === "0" || hostname === "::") {
    return {
      allowed: false,
      resolvedIps: ["0.0.0.0"],
      canonicalUrl: parsed.href,
      rejectionReason: "Binding to unspecified zero address (0.0.0.0) is prohibited.",
      violationCode: "ZERO_ADDRESS_PROHIBITED",
    };
  }

  // 5. Server-side DNS resolution
  let resolvedIps: string[] = [];
  try {
    if (net.isIP(hostname)) {
      resolvedIps = [hostname];
    } else {
      const records = await dns.promises.lookup(hostname, { all: true });
      resolvedIps = records.map((r) => r.address);
    }
  } catch (err: any) {
    return {
      allowed: false,
      resolvedIps: [],
      canonicalUrl: parsed.href,
      rejectionReason: `DNS resolution failed for hostname '${hostname}': ${err.message}`,
      violationCode: "DNS_RESOLUTION_FAILED",
    };
  }

  if (resolvedIps.length === 0) {
    return {
      allowed: false,
      resolvedIps: [],
      canonicalUrl: parsed.href,
      rejectionReason: `No IP addresses resolved for hostname '${hostname}'.`,
      violationCode: "DNS_RESOLUTION_FAILED",
    };
  }

  // 6. Deep inspection of ALL resolved IP addresses (prevents DNS rebinding and dual-homed attacks)
  for (const rawIp of resolvedIps) {
    const { ip, isIPv6 } = normalizeIP(rawIp);

    // Check Cloud Metadata / Link-Local (CRITICAL SSRF DEFENSE: 169.254.169.254, fe80::)
    if (!isIPv6 && isLinkLocalIPv4(ip)) {
      return {
        allowed: false,
        resolvedIps,
        canonicalUrl: parsed.href,
        rejectionReason: `Target resolved to link-local / cloud metadata address '${ip}'. Access strictly prohibited by BLACKSHIELD SSRF policy.`,
        violationCode: "CLOUD_METADATA_PROHIBITED",
      };
    }
    if (isIPv6 && (ip.startsWith("fe80:") || ip.startsWith("fe8") || ip.startsWith("fe9") || ip.startsWith("fea") || ip.startsWith("feb"))) {
      return {
        allowed: false,
        resolvedIps,
        canonicalUrl: parsed.href,
        rejectionReason: `Target resolved to IPv6 link-local address '${ip}'. Prohibited.`,
        violationCode: "CLOUD_METADATA_PROHIBITED",
      };
    }

    // Check Zero / Broadcast
    if (ip === "0.0.0.0" || ip === "::") {
      return {
        allowed: false,
        resolvedIps,
        canonicalUrl: parsed.href,
        rejectionReason: "Target resolved to zero address.",
        violationCode: "ZERO_ADDRESS_PROHIBITED",
      };
    }

    // Check if target is an authorized laboratory environment:
    const isLoopback = (!isIPv6 && isLoopbackIPv4(ip)) || (isIPv6 && ip === "::1");
    const isMockLocalHost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "blackshield-web";
    const isInternalDomain = hostname.endsWith(".internal.local") || hostname.endsWith(".defense.test");

    if (isLoopback || isMockLocalHost || isInternalDomain) {
      // Loopback/Mock/Internal is allowed for controlled testing
      continue;
    }

    // If it's a private network that wasn't explicitly authorized as an internal testing domain
    if (!isIPv6 && isPrivateIPv4(ip)) {
      return {
        allowed: false,
        resolvedIps,
        canonicalUrl: parsed.href,
        rejectionReason: `Target '${hostname}' resolved to private network '${ip}', but domain is not an authorized staging zone (*.internal.local, *.defense.test).`,
        violationCode: "UNAUTHORIZED_PRIVATE_NETWORK",
      };
    }

    // Any public external internet IP (e.g. google.com, foreign servers)
    return {
      allowed: false,
      resolvedIps,
      canonicalUrl: parsed.href,
      rejectionReason: `Target '${hostname}' resolved to public external address '${ip}'. BLACKSHIELD policy strictly confines controlled load testing to isolated local sandbox environments. External stress testing is prohibited.`,
      violationCode: "UNAUTHORIZED_PUBLIC_NETWORK",
    };
  }

  return {
    allowed: true,
    resolvedIps,
    canonicalUrl: parsed.href,
  };
}
