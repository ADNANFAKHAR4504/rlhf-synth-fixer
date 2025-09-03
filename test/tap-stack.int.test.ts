/**
 * Integration tests for TapStack stack
 *
 * Reads the final CloudFormation outputs from:
 *   const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
 *
 * Validates:
 *  - Presence & shape of critical outputs
 *  - S3 bucket naming compliance (lowercase, length, charset, edge rules)
 *  - RDS endpoint formatting (region-aware)
 *  - RDS port (expects 3306)
 *  - EC2 instance id & public DNS formatting (region-aware)
 *  - VPC id format
 *  - Cross-field coherence (region parsed from RDS endpoint vs EC2 DNS, when derivable)
 *
 * Notes:
 *  - No network calls or SDK usage (keeps the build/test environment simple & stable).
 *  - Tolerant to different JSON shapes for outputs (CFN CLI, CDK, custom scripts).
 */

import * as fs from "fs";
import * as path from "path";

type AnyRec = Record<string, any>;

// Location of the outputs file (as provided)
const outputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");

// Expected logical output keys from the stack
const REQUIRED_OUTPUT_KEYS = [
  "BucketName",
  "DBEndpointAddress",
  "DBPort",
  "InstanceId",
  "InstancePublicDnsName",
  "VpcId",
] as const;

type RequiredOutputKey = (typeof REQUIRED_OUTPUT_KEYS)[number];

// --------- Helpers ---------

function readJsonSafe(p: string): AnyRec {
  if (!fs.existsSync(p)) {
    throw new Error(
      `Outputs file not found at ${p}. Ensure your deployment wrote JSON outputs to this path.`
    );
  }
  const raw = fs.readFileSync(p, "utf8");
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`Failed to parse JSON at ${p}: ${(e as Error).message}`);
  }
}

/**
 * Normalize various output JSON shapes to a simple key/value map:
 * {
 *   BucketName: "...",
 *   DBEndpointAddress: "...",
 *   ...
 * }
 */
function normalizeOutputs(obj: AnyRec): Record<string, string> {
  // 1) Direct key/value shape
  const looksDirect = REQUIRED_OUTPUT_KEYS.every((k) => typeof obj?.[k] !== "undefined");
  if (looksDirect) {
    const out: Record<string, string> = {};
    REQUIRED_OUTPUT_KEYS.forEach((k) => (out[k] = String(obj[k])));
    return out;
  }

  // 2) CloudFormation "Stacks[0].Outputs[]" shape
  if (Array.isArray(obj?.Stacks) && obj.Stacks.length > 0) {
    const outs = obj.Stacks[0]?.Outputs ?? [];
    if (Array.isArray(outs)) {
      const map: Record<string, string> = {};
      outs.forEach((o: AnyRec) => {
        if (o?.OutputKey && typeof o.OutputValue !== "undefined") {
          map[o.OutputKey] = String(o.OutputValue);
        }
      });
      return map;
    }
  }

  // 3) CDK-like shape "Outputs": { "<stackName>.Key": "value", ... }
  if (obj?.Outputs && typeof obj.Outputs === "object") {
    const map: Record<string, string> = {};
    Object.entries(obj.Outputs as AnyRec).forEach(([k, v]) => {
      // Keys may be like "MyStack:BucketName" or "MyStack.BucketName"
      const normK = String(k).replace(/^.*[.:]/, "");
      map[normK] = String(v);
    });
    return map;
  }

  // 4) Generic array of outputs
  if (Array.isArray(obj?.Outputs)) {
    const map: Record<string, string> = {};
    (obj.Outputs as AnyRec[]).forEach((o) => {
      const k = o?.OutputKey ?? o?.Key ?? o?.Name;
      const v = o?.OutputValue ?? o?.Value ?? o?.Val;
      if (k && typeof v !== "undefined") {
        map[String(k)] = String(v);
      }
    });
    return map;
  }

  // Final fallback: flatten top-level string properties (best-effort)
  const map: Record<string, string> = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      map[k] = String(v);
    }
  });
  return map;
}

function expectHasAllOutputs(map: Record<string, string>) {
  REQUIRED_OUTPUT_KEYS.forEach((k) => {
    expect(map).toHaveProperty(k);
    expect(typeof map[k]).toBe("string");
    expect(String(map[k]).length).toBeGreaterThan(0);
  });
}

function isLowercaseLetterOrDigitOrHyphen(c: string): boolean {
  return /[a-z0-9-]/.test(c);
}

function isValidS3BucketName(name: string): { ok: boolean; reason?: string } {
  // Based on S3 DNS-compliant naming rules for virtual-hosted–style
  // - 3–63 chars
  // - lowercase letters, numbers, hyphen
  // - start/end with letter or number
  // - no adjacent periods (we avoid periods entirely in this rule)
  // - must not look like an IP address
  if (typeof name !== "string") return { ok: false, reason: "not a string" };
  if (name.length < 3 || name.length > 63) return { ok: false, reason: "length out of range" };
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(name))
    return { ok: false, reason: "must start/end with alphanumeric; only lowercase/digits/hyphen allowed" };
  if (name.includes("..") || name.includes("._") || name.includes("-.") || name.includes(".-"))
    return { ok: false, reason: "contains invalid sequences" };
  // No uppercase and no underscores
  for (const ch of name) {
    if (!isLowercaseLetterOrDigitOrHyphen(ch)) {
      return { ok: false, reason: `invalid character: ${ch}` };
    }
  }
  // Must not be formatted like an IP address
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(name)) {
    return { ok: false, reason: "looks like an IP address" };
  }
  return { ok: true };
}

function parseRegionFromEC2PublicDns(dns: string): string | undefined {
  // Examples:
  // ec2-54-218-1-2.us-west-2.compute.amazonaws.com
  // ec2-18-156-23-4.eu-central-1.compute.amazonaws.com
  const m = dns.match(/\.([a-z0-9-]+)\.compute\.amazonaws\.com\.?$/i);
  return m?.[1];
}

function parseRegionFromRDSEndpoint(host: string): string | undefined {
  // Examples:
  // abcdefghijklmnopq.us-west-2.rds.amazonaws.com
  // mydb.aaaaaaabbbbbbbbcccccc123.eu-central-1.rds.amazonaws.com
  const m = host.match(/\.([a-z0-9-]+)\.rds\.amazonaws\.com\.?$/i);
  return m?.[1];
}

function isValidRDSEndpoint(host: string): { ok: boolean; reason?: string } {
  if (typeof host !== "string" || host.length < 5) return { ok: false, reason: "not a string or too short" };
  if (!/^[a-z0-9.-]+$/.test(host)) return { ok: false, reason: "invalid characters in hostname" };
  if (!host.includes(".rds.amazonaws.com")) return { ok: false, reason: "missing .rds.amazonaws.com suffix" };
  if (!host.includes(".")) return { ok: false, reason: "no dots in hostname" };
  return { ok: true };
}

function isValidEC2InstanceId(id: string): boolean {
  // supports both 8 and 17 hex variants
  return /^i-([0-9a-f]{8}|[0-9a-f]{17})$/.test(id);
}

function isValidVpcId(id: string): boolean {
  return /^vpc-[0-9a-f]{8,17}$/.test(id);
}

function isValidEC2PublicDns(dns: string): { ok: boolean; reason?: string } {
  if (typeof dns !== "string" || dns.length < 5) return { ok: false, reason: "not a string or too short" };
  if (!/^[a-z0-9.-]+$/.test(dns)) return { ok: false, reason: "invalid characters" };
  if (!dns.includes(".compute.amazonaws.com")) return { ok: false, reason: "missing compute domain suffix" };
  return { ok: true };
}

// --------- Tests ---------

describe("Integration: read & normalize stack outputs", () => {
  it("loads outputs JSON and exposes required keys", () => {
    const json = readJsonSafe(outputsPath);
    const outputs = normalizeOutputs(json);
    expectHasAllOutputs(outputs);
  });
});

describe("Integration: S3 bucket output validation (positive + edge cases)", () => {
  const outputs = normalizeOutputs(readJsonSafe(outputsPath));
  const bucket = String(outputs["BucketName"] || "");

  it("BucketName must be present and non-empty", () => {
    expect(bucket).toBeTruthy();
  });

  it("BucketName satisfies DNS compliant rules (lowercase, 3–63 chars, allowed charset)", () => {
    const res = isValidS3BucketName(bucket);
    expect(res.ok).toBe(true);
  });

  it("BucketName should not end with '-' and not contain uppercase or underscores", () => {
    expect(bucket.endsWith("-")).toBe(false);
    expect(/[A-Z_]/.test(bucket)).toBe(false);
  });
});

describe("Integration: RDS endpoint & port validation (positive + edge cases)", () => {
  const outputs = normalizeOutputs(readJsonSafe(outputsPath));
  const host = String(outputs["DBEndpointAddress"] || "");
  const port = Number(outputs["DBPort"]);

  it("DBEndpointAddress must be present and well-formed", () => {
    const res = isValidRDSEndpoint(host);
    expect(res.ok).toBe(true);
  });

  it("DBPort must be 3306 (MySQL default) and within valid TCP range", () => {
    expect(Number.isFinite(port)).toBe(true);
    expect(port).toBe(3306);
    expect(port).toBeGreaterThanOrEqual(1);
    expect(port).toBeLessThanOrEqual(65535);
  });
});

describe("Integration: EC2 instance identity and DNS validation", () => {
  const outputs = normalizeOutputs(readJsonSafe(outputsPath));
  const iid = String(outputs["InstanceId"] || "");
  const dns = String(outputs["InstancePublicDnsName"] || "");

  it("InstanceId should follow i-[hex] pattern", () => {
    expect(isValidEC2InstanceId(iid)).toBe(true);
  });

  it("InstancePublicDnsName should look like an EC2 public hostname", () => {
    const res = isValidEC2PublicDns(dns);
    expect(res.ok).toBe(true);
  });
});

describe("Integration: VPC ID validation", () => {
  const outputs = normalizeOutputs(readJsonSafe(outputsPath));
  const vpcId = String(outputs["VpcId"] || "");

  it("VpcId should follow vpc-[hex] pattern", () => {
    expect(isValidVpcId(vpcId)).toBe(true);
  });
});

describe("Integration: Cross-field coherence (region parsing from outputs)", () => {
  const outputs = normalizeOutputs(readJsonSafe(outputsPath));
  const rdsHost = String(outputs["DBEndpointAddress"] || "");
  const ec2Dns = String(outputs["InstancePublicDnsName"] || "");

  it("Region inferred from RDS endpoint should match region inferred from EC2 public DNS (when both are derivable)", () => {
    const rdsRegion = parseRegionFromRDSEndpoint(rdsHost);
    const ec2Region = parseRegionFromEC2PublicDns(ec2Dns);

    // If either cannot be derived (edge case), don't fail the test outright—assert at least one is present
    // In normal AWS hostnames, both will resolve and should match
    expect(rdsRegion || ec2Region).toBeTruthy();

    if (rdsRegion && ec2Region) {
      expect(rdsRegion).toBe(ec2Region);
      // Validate allowed regions per requirement (us-west-2 | eu-central-1)
      expect(["us-west-2", "eu-central-1"]).toContain(rdsRegion);
    }
  });
});

describe("Integration: Output value hygiene checks", () => {
  const outputs = normalizeOutputs(readJsonSafe(outputsPath));

  it("no output values should be the string 'undefined' or 'null'", () => {
    for (const key of REQUIRED_OUTPUT_KEYS) {
      const v = String(outputs[key]);
      expect(v.toLowerCase()).not.toBe("undefined");
      expect(v.toLowerCase()).not.toBe("null");
      expect(v.trim().length).toBeGreaterThan(0);
    }
  });

  it("string lengths are within reasonable bounds", () => {
    // sanity caps to catch accidental giant blobs (e.g., policies accidentally dumped into outputs)
    for (const key of REQUIRED_OUTPUT_KEYS) {
      const v = String(outputs[key]);
      expect(v.length).toBeLessThanOrEqual(1024);
    }
  });
});
