import * as fs from "fs";
import * as path from "path";

const outputPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");

// Load JSON outputs
const rawOutputs = JSON.parse(fs.readFileSync(outputPath, "utf-8"));

// Parse JSON-string fields from outputs (like EC2 instance structs)
const outputs: Record<string, any> = {};
for (const [key, val] of Object.entries(rawOutputs)) {
  try {
    outputs[key] = JSON.parse(val as string);
  } catch {
    outputs[key] = val;
  }
}

// Helpers for validation
function isNonEmptyString(val: any): boolean {
  return typeof val === "string" && val.trim().length > 0;
}
function isArrayOfNonEmptyStrings(val: any): boolean {
  return Array.isArray(val) && val.every(v => isNonEmptyString(v));
}
function isValidIPv4(ip: any): boolean {
  if (typeof ip !== "string") return false;
  const regex = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
  return regex.test(ip);
}

describe("Terraform Full Stack Integration Tests", () => {
  it("outputs JSON must have all expected keys", () => {
    const expectedKeys = [
      "primary_ec2_instance",
      "secondary_ec2_instance",
      "primary_route53_zone_id",
      "secondary_route53_zone_id",
      "primary_subnet_ids",
      "secondary_subnet_ids",
      "primary_vpc_id",
      "secondary_vpc_id",
      "vpc_peering_id",
      "route53_record"
    ];
    expectedKeys.forEach(key => {
      expect(Object.keys(outputs)).toContain(key);
    });
  });

  it("validate primary_ec2_instance structure and IPs", () => {
    const ec2 = outputs.primary_ec2_instance;
    expect(ec2).toHaveProperty("id");
    expect(isNonEmptyString(ec2.id)).toBe(true);
    expect(ec2).toHaveProperty("eip_id");
    expect(isNonEmptyString(ec2.eip_id)).toBe(true);
    expect(ec2).toHaveProperty("private_ip");
    expect(isValidIPv4(ec2.private_ip)).toBe(true);
    expect(ec2).toHaveProperty("public_ip");
    expect(isValidIPv4(ec2.public_ip)).toBe(true);
  });

  it("validate secondary_ec2_instance structure and IPs", () => {
    const ec2 = outputs.secondary_ec2_instance;
    expect(ec2).toHaveProperty("id");
    expect(isNonEmptyString(ec2.id)).toBe(true);
    expect(ec2).toHaveProperty("eip_id");
    expect(isNonEmptyString(ec2.eip_id)).toBe(true);
    expect(ec2).toHaveProperty("private_ip");
    expect(isValidIPv4(ec2.private_ip)).toBe(true);
    expect(ec2).toHaveProperty("public_ip");
    expect(isValidIPv4(ec2.public_ip)).toBe(true);
  });

  it("should have valid Route53 Hosted Zone IDs", () => {
    expect(isNonEmptyString(outputs.primary_route53_zone_id)).toBe(true);
    expect(isNonEmptyString(outputs.secondary_route53_zone_id)).toBe(true);
  });

  it("should have valid VPC IDs in both regions", () => {
    expect(isNonEmptyString(outputs.primary_vpc_id)).toBe(true);
    expect(isNonEmptyString(outputs.secondary_vpc_id)).toBe(true);
  });

  it("should have exactly 4 subnet IDs for primary and secondary", () => {
    expect(isArrayOfNonEmptyStrings(outputs.primary_subnet_ids)).toBe(true);
    expect(outputs.primary_subnet_ids.length).toBe(4); // 2 public + 2 private

    expect(isArrayOfNonEmptyStrings(outputs.secondary_subnet_ids)).toBe(true);
    expect(outputs.secondary_subnet_ids.length).toBe(4);
  });

  it("should have a valid VPC peering ID", () => {
    expect(isNonEmptyString(outputs.vpc_peering_id)).toBe(true);
    expect(outputs.vpc_peering_id.startsWith("pcx-")).toBe(true);
  });

  it("route53_record must be a valid hostname with subdomain", () => {
    expect(isNonEmptyString(outputs.route53_record)).toBe(true);
    expect(outputs.route53_record).toMatch(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i);
    expect(outputs.route53_record.startsWith(outputs.route53_record.split(".").slice(1).join("."))).toBe(false);
  });

  // Edge case: Public and private IPs must not overlap
  it("primary and secondary EC2 private IPs must be from respective VPC CIDRs", () => {
    const primaryPrivateIp = outputs.primary_ec2_instance.private_ip;
    const secondaryPrivateIp = outputs.secondary_ec2_instance.private_ip;
    expect(primaryPrivateIp.startsWith("10.0.")).toBe(true);
    expect(secondaryPrivateIp.startsWith("10.1.")).toBe(true);
  });

  // Additional cross-resource consistency
  it("all subnet IDs must be unique across primary and secondary", () => {
    const allSubs = [...outputs.primary_subnet_ids, ...outputs.secondary_subnet_ids];
    const uniqueSubs = new Set(allSubs);
    expect(uniqueSubs.size).toBe(allSubs.length);
  });

  it("EC2 instance IDs must be unique across primary and secondary", () => {
    const ids = [outputs.primary_ec2_instance.id, outputs.secondary_ec2_instance.id];
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  // You can add more custom validation rules as needed...
});
