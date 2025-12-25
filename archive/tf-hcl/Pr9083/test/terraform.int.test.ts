// test/terraform.int.test.ts
import * as fs from "fs";
import * as path from "path";

// Try multiple possible output file locations (CI vs local deployment)
const possiblePaths = [
  path.resolve(process.cwd(), "cfn-outputs/all-outputs.json"),
  path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json"),
  path.resolve(process.cwd(), "cdk-outputs/flat-outputs.json"),
];
const p = possiblePaths.find((fp) => fs.existsSync(fp)) || possiblePaths[0];

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
    flat[k] = entry && typeof entry === "object" && "value" in entry ? entry.value : entry;
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
      "app_sg_id",
    ];
    required.forEach((k) => expect(outputs[k]).toBeDefined());
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

  test("public_subnet_ids is an array of two valid subnet IDs", () => {
    expect(Array.isArray(outputs.public_subnet_ids)).toBe(true);
    expect(outputs.public_subnet_ids.length).toBe(2);
    outputs.public_subnet_ids.forEach((s: any) => {
      expect(typeof s).toBe("string");
      expect(s).toMatch(SUBNET_ID_RE);
    });
  });

  test("private_subnet_ids is an array of two valid subnet IDs", () => {
    expect(Array.isArray(outputs.private_subnet_ids)).toBe(true);
    expect(outputs.private_subnet_ids.length).toBe(2);
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

  test("alb_dns_name looks like a valid DNS name or is empty when disabled", () => {
    expect(typeof outputs.alb_dns_name).toBe("string");
    // ALB may be disabled for LocalStack Community - allow empty string
    if (outputs.alb_dns_name !== "") {
      expect(outputs.alb_dns_name).toMatch(DNS_RE);
    }
  });

  test("target_group_arn is a valid ARN or empty when disabled", () => {
    expect(typeof outputs.target_group_arn).toBe("string");
    // Target group may be disabled for LocalStack Community - allow empty string
    if (outputs.target_group_arn !== "") {
      expect(outputs.target_group_arn).toMatch(ARN_RE);
    }
  });

  test("security group ids are valid", () => {
    expect(typeof outputs.alb_sg_id).toBe("string");
    expect(typeof outputs.app_sg_id).toBe("string");
    expect(outputs.alb_sg_id).toMatch(SG_ID_RE);
    expect(outputs.app_sg_id).toMatch(SG_ID_RE);
  });

  test("asg_name is a hyphenated string or empty when disabled", () => {
    expect(typeof outputs.asg_name).toBe("string");
    // ASG may be disabled for LocalStack Community - allow empty string
    if (outputs.asg_name !== "") {
      expect(outputs.asg_name.length).toBeGreaterThan(3);
      expect(outputs.asg_name).toMatch(/^[a-zA-Z0-9-]+$/);
      expect(outputs.asg_name).toMatch(/-/);
    }
  });

  // -------------------------
  // Edge-case validations
  // -------------------------
  test("no outputs should be unexpectedly typed (strings vs arrays)", () => {
    const arrayKeys = ["public_subnet_ids", "private_subnet_ids"];
    const stringKeys = [
      "vpc_id",
      "vpc_cidr",
      "alb_dns_name",
      "target_group_arn",
      "asg_name",
      "alb_sg_id",
      "app_sg_id",
    ];
    arrayKeys.forEach((k) => expect(Array.isArray(outputs[k])).toBe(true));
    stringKeys.forEach((k) => expect(typeof outputs[k]).toBe("string"));
  });

  test("acm_certificate_arn is optional/absent in HTTP-only stack", () => {
    // Expected to be undefined now (no ACM in the stack)
    expect(outputs.acm_certificate_arn).toBeUndefined();
  });

  test("malformed values report clear failure messages", () => {
    // Helpful shape assertions
    expect(outputs.vpc_id).toMatch(VPC_ID_RE);
    expect(outputs.vpc_cidr).toMatch(CIDR_RE);
    expect(outputs.public_subnet_ids.length).toBe(2);
    expect(outputs.private_subnet_ids.length).toBe(2);
  });

  // -------------------------
  // Sanity / standards checks
  // -------------------------
  test("Any ARNs present follow AWS partition/service patterns", () => {
    const possibleArnKeys = Object.keys(outputs).filter(
      (k) => typeof outputs[k] === "string" && outputs[k].startsWith("arn:")
    );
    possibleArnKeys.forEach((k) => {
      expect(outputs[k]).toMatch(/^arn:aws:[a-z0-9-]+:[a-z0-9-]*:/);
    });
  });

  test("CIDR ranges fall within RFC1918 space (basic check)", () => {
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
