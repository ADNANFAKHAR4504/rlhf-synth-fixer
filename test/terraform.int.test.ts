/**
 * terraform.integration.test.ts
 *
 * Integration-style tests that validate the Terraform stack *purely* from the
 * pre-generated outputs JSON (no terraform init/plan/apply).
 *
 * Expected JSON path:
 *   const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
 *
 * The test suite validates:
 *  - Presence + shape of required outputs
 *  - Ingress rules conform to main.tf constraints:
 *      * only TCP 80/443
 *      * no 0.0.0.0/0 in IPv4 ingress
 *      * CIDR formats (v4/v6)
 *      * non-empty, de-duplicated rules
 *  - Basic "standards" checks (naming, IDs non-empty)
 *
 * How to run:
 *   npx jest terraform.integration.test.ts
 */

import * as fs from "fs";
import * as path from "path";

type IngressSummary = {
  from_port: number;
  to_port: number;
  protocol: string;
  cidr_v4: string | null;
  cidr_v6: string | null;
  description?: string | null;
};

type OutputsJson = {
  security_group_id?: { value: string };
  security_group_arn?: { value: string };
  security_group_name?: { value: string };
  ingress_rules?: { value: IngressSummary[] };
  // allow other fields too
  [k: string]: any;
};

/* ----------------------------- Helpers ---------------------------------- */

const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");

function loadOutputs(): OutputsJson {
  if (!fs.existsSync(p)) {
    throw new Error(
      `Outputs JSON not found at: ${p}\n` +
        `Make sure your pipeline wrote Terraform outputs to this path.`
    );
  }

  const raw = fs.readFileSync(p, "utf8");
  try {
    const data = JSON.parse(raw);
    return data as OutputsJson;
  } catch (e) {
    throw new Error(`Failed to parse JSON at ${p}: ${(e as Error).message}`);
  }
}

function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0;
}

function isValidName(x: string): boolean {
  // Terraform SG names commonly allow letters, numbers, '-', '_' and '.'
  return /^[A-Za-z0-9._-]+$/.test(x) && x.length <= 255;
}

function isValidAwsArn(x: string): boolean {
  return x.startsWith("arn:aws:") || x.startsWith("arn:aws-us-gov:") || x.startsWith("arn:aws-cn:");
}

function isValidSecurityGroupId(x: string): boolean {
  // Typical SG id: sg- followed by 8 or 17 hex chars (varies by region/account)
  return /^sg-[0-9a-fA-F]{8,}$/.test(x);
}

function isValidIPv4Cidr(c: string): boolean {
  // Simple but strong-ish check
  const m = c.match(/^(\d{1,3})(?:\.(\d{1,3})){3}\/(\d{1,2})$/);
  if (!m) return false;
  const parts = c.split("/")[0].split(".").map(Number);
  const prefix = Number(c.split("/")[1]);
  if (prefix < 0 || prefix > 32) return false;
  return parts.every((n) => n >= 0 && n <= 255);
}

function isValidIPv6Cidr(c: string): boolean {
  // Loose IPv6 CIDR validation: presence of ':' and numeric prefix length 0..128
  const m = c.match(/^([0-9a-fA-F:]+)\/(\d{1,3})$/);
  if (!m) return false;
  const prefix = Number(m[2]);
  return prefix >= 0 && prefix <= 128 && c.includes(":");
}

function hasDuplicates<T>(arr: T[], keyFn: (x: T) => string): boolean {
  const seen = new Set<string>();
  for (const item of arr) {
    const k = keyFn(item);
    if (seen.has(k)) return true;
    seen.add(k);
  }
  return false;
}

/* ------------------------------ Tests ----------------------------------- */

describe("Terraform Outputs JSON (integration checks)", () => {
  let outputs: OutputsJson;

  beforeAll(() => {
    outputs = loadOutputs();
  });

  it("should include all required outputs with correct types", () => {
    expect(outputs).toBeTruthy();

    // security_group_id
    expect(outputs.security_group_id).toBeDefined();
    expect(isNonEmptyString(outputs.security_group_id!.value)).toBe(true);
    expect(
      isValidSecurityGroupId(outputs.security_group_id!.value),
    ).toBe(true);

    // security_group_arn
    expect(outputs.security_group_arn).toBeDefined();
    expect(isNonEmptyString(outputs.security_group_arn!.value)).toBe(true);
    expect(isValidAwsArn(outputs.security_group_arn!.value)).toBe(true);

    // security_group_name
    expect(outputs.security_group_name).toBeDefined();
    expect(isNonEmptyString(outputs.security_group_name!.value)).toBe(true);
    expect(isValidName(outputs.security_group_name!.value)).toBe(true);

    // ingress_rules
    expect(outputs.ingress_rules).toBeDefined();
    expect(Array.isArray(outputs.ingress_rules!.value)).toBe(true);
    expect(outputs.ingress_rules!.value.length).toBeGreaterThan(0);
  });

  it("should enforce ingress rules only for TCP 80/443 with valid CIDRs (positive cases)", () => {
    const ingress = outputs.ingress_rules!.value;

    // No duplicates of (from_port,to_port,protocol,cidr)
    const dupe = hasDuplicates(
      ingress,
      (r) =>
        `${r.protocol}:${r.from_port}:${r.to_port}:${
          r.cidr_v4 ?? r.cidr_v6 ?? "none"
        }`
    );
    expect(dupe).toBe(false);

    for (const r of ingress) {
      // protocol
      expect(r.protocol).toBe("tcp");

      // ports must be 80 or 443
      expect([80, 443]).toContain(r.from_port);
      expect([80, 443]).toContain(r.to_port);

      // must have exactly one of cidr_v4 or cidr_v6 (your main.tf generates one per rule)
      const present = [r.cidr_v4 != null, r.cidr_v6 != null].filter(Boolean).length;
      expect(present).toBe(1);

      // validate formats + disallow 0.0.0.0/0 for ingress (per your description/notes)
      if (r.cidr_v4) {
        expect(isValidIPv4Cidr(r.cidr_v4)).toBe(true);
        expect(r.cidr_v4).not.toBe("0.0.0.0/0");
      }
      if (r.cidr_v6) {
        expect(isValidIPv6Cidr(r.cidr_v6)).toBe(true);
        // You can optionally disallow ::/0 for ingress as well (tighten if desired)
        expect(r.cidr_v6).not.toBe("::/0");
      }

      // optional: description should mention the TCP port and CIDR for traceability
      if (r.description && r.cidr_v4) {
        expect(r.description).toEqual(
          expect.stringContaining(`${r.from_port}`)
        );
        expect(r.description).toEqual(expect.stringContaining(r.cidr_v4));
      }
      if (r.description && r.cidr_v6) {
        expect(r.description).toEqual(
          expect.stringContaining(`${r.from_port}`)
        );
        expect(r.description).toEqual(expect.stringContaining(r.cidr_v6));
      }
    }
  });

  it("should reflect standards / naming expectations", () => {
    const name = outputs.security_group_name!.value;

    // Lower friction name checks — adjust to your org conventions if stricter
    expect(name.length).toBeGreaterThan(2);
    expect(name.length).toBeLessThanOrEqual(255);

    // No leading/trailing spaces
    expect(name).toBe(name.trim());

    // should not contain spaces (SG names typically avoid spaces)
    expect(/\s/.test(name)).toBe(false);
  });

  it("edge case: no ingress rule should allow 0.0.0.0/0 or ::/0", () => {
    const ingress = outputs.ingress_rules!.value;
    const hasOpenV4 = ingress.some((r) => r.cidr_v4 === "0.0.0.0/0");
    const hasOpenV6 = ingress.some((r) => r.cidr_v6 === "::/0");
    expect(hasOpenV4).toBe(false);
    expect(hasOpenV6).toBe(false);
  });

  it("edge case: all ingress rules must use only ports 80 or 443", () => {
    const ingress = outputs.ingress_rules!.value;
    const bad = ingress.filter(
      (r) => ![80, 443].includes(r.from_port) || ![80, 443].includes(r.to_port)
    );
    expect(bad).toEqual([]);
  });

  it("edge case: protocol must be tcp for all ingress rules", () => {
    const ingress = outputs.ingress_rules!.value;
    const bad = ingress.filter((r) => r.protocol !== "tcp");
    expect(bad).toEqual([]);
  });

  it("edge case: each rule must specify exactly one CIDR type (v4 XOR v6)", () => {
    const ingress = outputs.ingress_rules!.value;
    const bad = ingress.filter((r) => {
      const n = [r.cidr_v4 != null, r.cidr_v6 != null].filter(Boolean).length;
      return n !== 1;
    });
    expect(bad).toEqual([]);
  });

  it("edge case: IPv4/IPv6 CIDR formats are valid", () => {
    const ingress = outputs.ingress_rules!.value;

    const badV4 = ingress
      .filter((r) => r.cidr_v4)
      .map((r) => r.cidr_v4 as string)
      .filter((c) => !isValidIPv4Cidr(c));

    const badV6 = ingress
      .filter((r) => r.cidr_v6)
      .map((r) => r.cidr_v6 as string)
      .filter((c) => !isValidIPv6Cidr(c));

    expect(badV4).toEqual([]);
    expect(badV6).toEqual([]);
  });

  it("edge case: rule descriptions (if present) should not be empty and should be informative", () => {
    const ingress = outputs.ingress_rules!.value;
    const empties = ingress.filter(
      (r) => r.description !== undefined && String(r.description).trim() === ""
    );
    expect(empties).toEqual([]);
  });
});
