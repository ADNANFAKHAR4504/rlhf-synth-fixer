// test/terraform.int.test.ts
import * as fs from "fs";
import * as path from "path";

const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");

type RawTfOutput = {
  sensitive?: boolean;
  type?: any;
  value?: any;
  [k: string]: any;
};
type RawTfOutputs = Record<string, RawTfOutput>;

// Regex helpers
const VPC_ID_RE = /^vpc-[0-9a-f]{8,17}$/;
const SUBNET_ID_RE = /^subnet-[0-9a-f]{8,17}$/;
const SG_ID_RE = /^sg-[0-9a-f]{8,17}$/;
const ARN_RE = /^arn:aws:[a-z0-9-]+:[a-z0-9-]*:\*{0,3}\d{0,12}:.+$/; // permissive to allow redacted acct
const CIDR_RE = /^(25[0-5]|2[0-4]\d|1?\d{1,2})(\.(25[0-5]|2[0-4]\d|1?\d{1,2})){3}\/([0-9]|[1-2][0-9]|3[0-2])$/;
const DNS_RE = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,63}$/;
const ALLOWED_ARN_REGIONS = ["us-west-2", "us-east-1"];

// Flatten terraform "output -json" style: { key: { value: X, ... } } -> { key: X }
function loadAndFlattenOutputs(filePath: string): Record<string, any> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Outputs file not found at ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  let parsed: RawTfOutputs;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse JSON at ${filePath}: ${err}`);
  }

  const flat: Record<string, any> = {};
  for (const k of Object.keys(parsed)) {
    const entry = parsed[k];
    if (entry && typeof entry === "object" && "value" in entry) {
      flat[k] = entry.value;
    } else {
      // fallback: take the entry itself
      flat[k] = entry;
    }
  }

  return flat;
}

describe("Terraform Stack Integration (JSON-based) — full-stack validations", () => {
  let outputs: Record<string, any>;

  beforeAll(() => {
    outputs = loadAndFlattenOutputs(p);
  });

  // -------------------------
  // Basic presence & shape
  // -------------------------
  test("outputs JSON should load and flatten to an object", () => {
    expect(typeof outputs).toBe("object");
    expect(outputs).not.toBeNull();
  });

  test("required outputs exist (positive case)", () => {
    const required = [
      "vpc_id",
      "vpc_cidr",
      "public_subnet_ids",
      "private_subnet_ids",
      "alb_dns_name",
      "target_group_arn",
      "asg_name",
      "alb_sg_id",
      "ec2_sg_id",
    ];

    required.forEach((k) => {
      expect(outputs[k]).toBeDefined();
    });
  });

  // -------------------------
  // Positive format validations
  // -------------------------
  test("vpc_id is a valid VPC id", () => {
    expect(typeof outputs.vpc_id).toBe("string");
    expect(outputs.vpc_id).toMatch(VPC_ID_RE);
  });

  test("vpc_cidr is a valid CIDR block", () => {
    expect(typeof outputs.vpc_cidr).toBe("string");
    expect(outputs.vpc_cidr).toMatch(CIDR_RE);
  });

  test("public_subnet_ids is a non-empty array of valid subnet IDs", () => {
    expect(Array.isArray(outputs.public_subnet_ids)).toBe(true);
    expect(outputs.public_subnet_ids.length).toBeGreaterThan(0);
    outputs.public_subnet_ids.forEach((s: any) => {
      expect(typeof s).toBe("string");
      expect(s).toMatch(SUBNET_ID_RE);
    });
  });

  test("private_subnet_ids is a non-empty array of valid subnet IDs", () => {
    expect(Array.isArray(outputs.private_subnet_ids)).toBe(true);
    expect(outputs.private_subnet_ids.length).toBeGreaterThan(0);
    outputs.private_subnet_ids.forEach((s: any) => {
      expect(typeof s).toBe("string");
      expect(s).toMatch(SUBNET_ID_RE);
    });
  });

  test("no duplicate subnet IDs across public/private", () => {
    const combined = [...outputs.public_subnet_ids, ...outputs.private_subnet_ids];
    const uniq = Array.from(new Set(combined));
    expect(uniq.length).toBe(combined.length);
  });

  test("alb_dns_name looks like a valid DNS name", () => {
    expect(typeof outputs.alb_dns_name).toBe("string");
    // Most ELB names end with .elb.amazonaws.com, so a permissive dns regex is used
    expect(outputs.alb_dns_name).toMatch(DNS_RE);
  });

  test("target_group_arn and alarm ARNs are valid ARNs and use allowed regions", () => {
    const arnsToCheck = ["target_group_arn", "high_cpu_alarm_arn", "unhealthy_hosts_alarm_arn"];
    arnsToCheck.forEach((k) => {
      if (outputs[k] === undefined) {
        // acceptable for some alarms to be absent in certain setups — fail explicitly later if required
        return;
      }
      expect(typeof outputs[k]).toBe("string");
      expect(outputs[k]).toMatch(ARN_RE);

      // ensure the region part of ARN is one of the allowed regions (if ARN contains region)
      const parts = outputs[k].split(":");
      // arn:aws:service:region:account:...
      if (parts.length > 3) {
        const region = parts[3];
        if (region) {
          expect(ALLOWED_ARN_REGIONS).toContain(region);
        }
      }
    });
  });

  test("security group ids are valid", () => {
    expect(typeof outputs.alb_sg_id).toBe("string");
    expect(typeof outputs.ec2_sg_id).toBe("string");
    expect(outputs.alb_sg_id).toMatch(SG_ID_RE);
    expect(outputs.ec2_sg_id).toMatch(SG_ID_RE);
  });

  test("asg_name is a non-empty, hyphenated string (project-env style)", () => {
    expect(typeof outputs.asg_name).toBe("string");
    expect(outputs.asg_name.length).toBeGreaterThan(3);
    // ensure it contains at least one hyphen and only allowed chars
    expect(outputs.asg_name).toMatch(/^[a-zA-Z0-9-]+$/);
    expect(outputs.asg_name).toMatch(/-/);
  });

  // -------------------------
  // Edge-case validations
  // -------------------------
  test("no outputs should be unexpectedly typed (strings vs arrays)", () => {
    // Detect likely type-mismatches: public/private should be arrays, others strings
    const arrayKeys = ["public_subnet_ids", "private_subnet_ids"];
    const stringKeys = [
      "vpc_id",
      "vpc_cidr",
      "alb_dns_name",
      "target_group_arn",
      "asg_name",
      "alb_sg_id",
      "ec2_sg_id",
    ];
    arrayKeys.forEach((k) => expect(Array.isArray(outputs[k])).toBe(true));
    stringKeys.forEach((k) => expect(typeof outputs[k]).toBe("string"));
  });

  test("missing optional outputs handled gracefully (acm_certificate_arn)", () => {
    if (outputs.acm_certificate_arn === undefined) {
      // Pass and document the absence — this is an edge case but not a hard failure
      // If you want it to be required, change this test to assert defined.
      expect(outputs.acm_certificate_arn).toBeUndefined();
    } else {
      expect(typeof outputs.acm_certificate_arn).toBe("string");
      expect(outputs.acm_certificate_arn).toMatch(ARN_RE);
    }
  });

  test("malformed values report clear failure messages", () => {
    // This test asserts helpful error messages by intentionally checking shape and providing messages.
    // If one of the key fields is wrong, the assertion errors will show the offending value.
    expect(outputs.vpc_id).toMatch(VPC_ID_RE);
    expect(outputs.vpc_cidr).toMatch(CIDR_RE);
    expect(outputs.public_subnet_ids.length).toBeGreaterThan(0);
  });

  // -------------------------
  // Sanity / standards checks
  // -------------------------
  test("ARNs present should belong to expected AWS partition/service patterns", () => {
    const possibleArnKeys = Object.keys(outputs).filter((k) => typeof outputs[k] === "string" && outputs[k].startsWith("arn:"));
    possibleArnKeys.forEach((k) => {
      expect(outputs[k]).toMatch(/^arn:aws:[a-z0-9-]+:[a-z0-9-]*:/);
    });
  });

  test("CIDR ranges fall within private RFC1918 space (basic check)", () => {
    // Basic check for the VPC CIDR to be inside 10.0.0.0/8, 172.16.0.0/12 or 192.168.0.0/16
    const cidr = outputs.vpc_cidr;
    const [addr] = cidr.split("/");
    const octets = addr.split(".").map((o: string) => parseInt(o, 10));
    expect(octets.length).toBe(4);
    const inPrivate =
      octets[0] === 10 ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168);
    expect(inPrivate).toBe(true);
  });
});
