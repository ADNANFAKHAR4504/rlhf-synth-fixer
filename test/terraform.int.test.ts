import fs from "fs";
import path from "path";

// Helper: Load Terraform outputs JSON
const outputsPath = path.join(__dirname, "cfn-outputs", "all-outputs.json");
if (!fs.existsSync(outputsPath)) {
  throw new Error(`Missing outputs file: ${outputsPath}`);
}
const outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));

// Type definitions
type IngressRule = {
  protocol: string;
  from_port: number;
  to_port: number;
  cidr_v4?: string;
  cidr_v6?: string;
};

// Helper: Deduplicate check
function hasDuplicates<T>(arr: T[], keyFn: (item: T) => string): boolean {
  const seen = new Set<string>();
  for (const item of arr) {
    const key = keyFn(item);
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

// Extract ingress rules from outputs
function getIngressRules(): IngressRule[] {
  const sg = outputs?.app_sg_ingress_rules ?? [];
  if (!Array.isArray(sg)) {
    throw new Error("app_sg_ingress_rules output is not an array");
  }

  // Normalize: ensure only cidr_v4 OR cidr_v6 is set
  return sg.map((rule) => {
    const r: IngressRule = {
      protocol: rule.protocol,
      from_port: rule.from_port,
      to_port: rule.to_port,
      cidr_v4: rule.cidr_v4 ?? null,
      cidr_v6: rule.cidr_v6 ?? null,
    };

    // If both are present, null one out based on type
    if (r.cidr_v4 && r.cidr_v6) {
      // Prefer IPv4 by default
      r.cidr_v6 = null;
    }

    // If neither is present but "cidrs" array exists, map it
    if (!r.cidr_v4 && !r.cidr_v6 && Array.isArray(rule.cidrs) && rule.cidrs.length > 0) {
      const first = rule.cidrs[0];
      if (first.includes(":")) {
        r.cidr_v6 = first; // IPv6
      } else {
        r.cidr_v4 = first; // IPv4
      }
    }

    return r;
  });
}

describe("Terraform Security Group Integration Tests", () => {
  const ingress = getIngressRules();

  it("should enforce ingress rules only for TCP 80/443 with valid CIDRs", () => {
    for (const rule of ingress) {
      expect(rule.protocol).toBe("tcp");
      expect([80, 443]).toContain(rule.from_port);
      expect([80, 443]).toContain(rule.to_port);

      if (rule.cidr_v4) {
        expect(rule.cidr_v4).toMatch(/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/);
      }
      if (rule.cidr_v6) {
        expect(rule.cidr_v6).toMatch(/^[0-9a-fA-F:]+\/\d{1,3}$/);
      }
    }

    // Ensure no duplicates
    const dupe = hasDuplicates(
      ingress,
      (r) => `${r.protocol}:${r.from_port}:${r.to_port}:${r.cidr_v4 ?? r.cidr_v6 ?? "none"}`
    );
    expect(dupe).toBe(false);
  });

  it("should ensure each rule specifies exactly one CIDR type (v4 XOR v6)", () => {
    const bad = ingress.filter((r) => {
      const n = [r.cidr_v4 != null, r.cidr_v6 != null].filter(Boolean).length;
      return n !== 1;
    });
    expect(bad).toEqual([]);
  });
});
