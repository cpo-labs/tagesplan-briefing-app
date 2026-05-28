/**
 * SSRF guard for outbound HTTP fetches against user-supplied URLs.
 *
 * The threat: a user pastes an iCal URL that resolves to an internal IP
 * range (RFC1918, loopback, link-local incl. AWS metadata endpoint
 * 169.254.169.254, CGNAT, IPv6 ULA/link-local). Without a DNS-level guard
 * the request would happily traverse into the hosting infrastructure.
 *
 * Approach: resolve the hostname VOR dem fetch, reject if the resolved IP
 * falls into any forbidden range. `redirect: "error"` blocks the fetch
 * layer from silently following a 30x into a different (potentially
 * internal) host without us re-validating.
 */

import dns, { type LookupAddress } from "node:dns";
import { isIP } from "node:net";

const dnsLookup = dns.promises.lookup;

/**
 * Public surface: validates a URL's hostname resolves to a non-private,
 * non-reserved address. Throws a user-facing error otherwise.
 */
export async function assertPublicHost(url: URL): Promise<void> {
  const host = url.hostname;
  if (!host) {
    throw new Error(REJECT_MSG);
  }

  // If the host is already a literal IP, validate it directly.
  if (isIP(host) !== 0) {
    if (isPrivateIp(host)) {
      throw new Error(REJECT_MSG);
    }
    return;
  }

  // Block bare hostnames like "localhost" / "metadata" that some resolvers
  // map to loopback or which only exist on internal DNS.
  if (isSuspiciousHostname(host)) {
    throw new Error(REJECT_MSG);
  }

  let addrs: LookupAddress[];
  try {
    addrs = await dnsLookup(host, { all: true, verbatim: true });
  } catch {
    throw new Error(REJECT_MSG);
  }

  if (addrs.length === 0) {
    throw new Error(REJECT_MSG);
  }

  for (const a of addrs) {
    if (isPrivateIp(a.address)) {
      throw new Error(REJECT_MSG);
    }
  }
}

export const REJECT_MSG =
  "Diese URL kann nicht gelesen werden. Bitte eine oeffentliche iCal-URL verwenden.";

/* ─── IP classification ─────────────────────────────────────────────── */

/**
 * Returns true if the given IP (v4 or v6) falls inside a private,
 * loopback, link-local, multicast, CGNAT, reserved or IPv6 ULA range.
 */
export function isPrivateIp(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 4) return isPrivateIpv4(ip);
  if (kind === 6) return isPrivateIpv6(ip);
  return true; // not a valid IP literal — be safe and reject
}

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) {
    return true;
  }
  const [a, b] = parts;

  // 0.0.0.0/8 — "this network"
  if (a === 0) return true;
  // 10.0.0.0/8 — RFC1918 private
  if (a === 10) return true;
  // 127.0.0.0/8 — loopback
  if (a === 127) return true;
  // 169.254.0.0/16 — link-local incl. AWS metadata (169.254.169.254)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12 — RFC1918 private
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16 — RFC1918 private
  if (a === 192 && b === 168) return true;
  // 192.0.0.0/24 — IETF protocol assignments
  if (a === 192 && b === 0 && parts[2] === 0) return true;
  // 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 — TEST-NET, documentation
  if (a === 192 && b === 0 && parts[2] === 2) return true;
  if (a === 198 && b === 51 && parts[2] === 100) return true;
  if (a === 203 && b === 0 && parts[2] === 113) return true;
  // 100.64.0.0/10 — CGNAT
  if (a === 100 && b >= 64 && b <= 127) return true;
  // 198.18.0.0/15 — benchmark
  if (a === 198 && (b === 18 || b === 19)) return true;
  // 224.0.0.0/4 — multicast
  if (a >= 224 && a <= 239) return true;
  // 240.0.0.0/4 — reserved (incl. 255.255.255.255 broadcast)
  if (a >= 240) return true;

  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();

  // ::1 loopback (also "0:0:0:0:0:0:0:1")
  if (lower === "::1" || lower === "0:0:0:0:0:0:0:1") return true;
  // :: unspecified
  if (lower === "::" || lower === "0:0:0:0:0:0:0:0") return true;

  // IPv4-mapped IPv6 ::ffff:a.b.c.d — re-check the embedded IPv4
  const mapped = lower.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (mapped) return isPrivateIpv4(mapped[1]);

  // IPv4-compatible IPv6 (deprecated but be safe)
  const compat = lower.match(/^::(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (compat) return isPrivateIpv4(compat[1]);

  // Expand groups for prefix matching
  const first = lower.split(":")[0] ?? "";
  const firstHex = parseInt(first || "0", 16);

  // fc00::/7 — Unique Local Address (ULA)
  if ((firstHex & 0xfe00) === 0xfc00) return true;
  // fe80::/10 — link-local
  if ((firstHex & 0xffc0) === 0xfe80) return true;
  // ff00::/8 — multicast
  if ((firstHex & 0xff00) === 0xff00) return true;
  // 2001:db8::/32 — documentation
  if (lower.startsWith("2001:db8:") || lower === "2001:db8::") return true;

  return false;
}

/**
 * Hostnames that are either bare loopback aliases or commonly resolved
 * inside cloud networks to metadata endpoints. We reject these before
 * even hitting DNS — saves a round-trip and closes split-horizon DNS
 * holes (an internal resolver could map "metadata" → 169.254.169.254).
 */
function isSuspiciousHostname(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") || // mDNS
    h.endsWith(".internal") ||
    h === "metadata" ||
    h === "metadata.google.internal" ||
    h === "instance-data" ||
    h === "instance-data.ec2.internal"
  );
}
