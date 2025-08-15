// int-tests.ts
import * as fs from "fs";
import * as path from "path";

// Path to JSON outputs
const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");

// Load & parse stack outputs
let outputs: Record<string, any> = {};
try {
  const raw = fs.readFileSync(p, "utf8");
  outputs = JSON.parse(raw);
} catch (err) {
  throw new Error(`❌ Failed to read outputs file at ${p}: ${err}`);
}

// Utility regex patterns for validation
const ARN_REGEX = /^arn:aws:[a-z0-9-]+:[a-z0-9-]*:\d{12}:[\S]+$/;
const CIDR_REGEX =
  /^(?:\d{1,3}\.){3}\d{1,3}\/([0-9]|[1-2][0-9]|3[0-2])$/;
const DNS_REGEX =
  /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/;

// Helper: Check all tags follow the standard
function checkTags(tags: Record<string, string>, expectedKeys: string[]) {
  expectedKeys.forEach((key) => {
    if (!tags[key]) {
      throw new Error(`Missing expected tag: ${key}`);
    }
  });
}

// Jest test suite
describe("Terraform Stack Integration Tests", () => {
  // -------------------
  // Positive Case Tests
  // -------------------
  test("VPC ID should exist and follow AWS format", () => {
    expect(outputs.vpc_id).toMatch(/^vpc-[0-9a-f]{8,17}$/);
  });

  test("VPC CIDR should be valid", () => {
    expect(outputs.vpc_cidr).toMatch(CIDR_REGEX);
  });

  test("Public Subnets should be non-empty and have valid IDs", () => {
    expect(Array.isArray(outputs.public_subnet_ids)).toBe(true);
    expect(outputs.public_subnet_ids.length).toBeGreaterThan(0);
    outputs.public_subnet_ids.forEach((id: string) =>
      expect(id).toMatch(/^subnet-[0-9a-f]{8,17}$/)
    );
  });

  test("Private Subnets should be non-empty and have valid IDs", () => {
    expect(Array.isArray(outputs.private_subnet_ids)).toBe(true);
    expect(outputs.private_subnet_ids.length).toBeGreaterThan(0);
    outputs.private_subnet_ids.forEach((id: string) =>
      expect(id).toMatch(/^subnet-[0-9a-f]{8,17}$/)
    );
  });

  test("ALB DNS Name should look valid", () => {
    expect(outputs.alb_dns_name).toMatch(DNS_REGEX);
  });

  test("Target Group ARN should be valid", () => {
    expect(outputs.target_group_arn).toMatch(ARN_REGEX);
  });

  test("ASG Name should be non-empty string", () => {
    expect(typeof outputs.asg_name).toBe("string");
    expect(outputs.asg_name.length).toBeGreaterThan(3);
  });

  test("Security Group IDs should be valid", () => {
    expect(outputs.alb_sg_id).toMatch(/^sg-[0-9a-f]{8,17}$/);
    expect(outputs.ec2_sg_id).toMatch(/^sg-[0-9a-f]{8,17}$/);
  });

  test("ACM Certificate ARN should be valid", () => {
    expect(outputs.acm_certificate_arn).toMatch(ARN_REGEX);
  });

  // -------------------
  // Edge Case Tests
  // -------------------
  test("Should throw if any required output is missing", () => {
    const requiredKeys = [
      "vpc_id",
      "vpc_cidr",
      "public_subnet_ids",
      "private_subnet_ids",
      "alb_dns_name",
      "target_group_arn",
      "asg_name",
      "alb_sg_id",
      "ec2_sg_id",
      "acm_certificate_arn",
    ];
    requiredKeys.forEach((key) => {
      expect(outputs[key]).toBeDefined();
    });
  });

  test("Subnets should not contain duplicates", () => {
    const allSubnets = [
      ...outputs.public_subnet_ids,
      ...outputs.private_subnet_ids,
    ];
    const uniqueSubnets = new Set(allSubnets);
    expect(uniqueSubnets.size).toBe(allSubnets.length);
  });

  // -------------------
  // Standards & Compliance
  // -------------------
  test("Resource names should follow '<project>-<env>' prefix", () => {
    const projectEnvPrefix = /^myapp-dev/;
    expect(outputs.asg_name).toMatch(projectEnvPrefix);
  });

  test("All ARNs should be in 'us-west-2' or 'us-east-1'", () => {
    const validRegions = ["us-west-2", "us-east-1"];
    Object.values(outputs)
      .filter((val) => typeof val === "string" && val.startsWith("arn:aws"))
      .forEach((arn: string) => {
        const region = arn.split(":")[3];
        expect(validRegions).toContain(region);
      });
  });
});
