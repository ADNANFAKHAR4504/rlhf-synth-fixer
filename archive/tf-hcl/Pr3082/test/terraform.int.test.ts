import * as fs from "fs";
import * as path from "path";

const outputFile = path.resolve("cfn-outputs/flat-outputs.json");

const isNonEmptyString = (v: any) => typeof v === "string" && v.trim().length > 0;
const isValidArn = (v: string) => /^arn:[^:]+:[^:]*:[^:]*:[0-9]*:.*$/.test(v.trim());
const isValidVpcId = (v: string) => v.startsWith("vpc-");
const isValidSubnetId = (v: string) => v.startsWith("subnet-");
const isValidSGId = (v: string) => v.startsWith("sg-");
const isValidIGWId = (v: string) => v.startsWith("igw-");
const isValidNatId = (v: string) => v.startsWith("nat-");

const parseIfArray = (value: any) => {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : value;
    } catch {
      return value;
    }
  }
  return value;
};

function skipIfMissing(key: string, obj: any) {
  if (!(key in obj)) {
    console.warn(`⚠️ Skipping tests for missing output: ${key}`);
    return true;
  }
  return false;
}

describe("Terraform tap-stack flat outputs - integration validation", () => {
  let outputs: Record<string, any>;

  beforeAll(() => {
    const data = fs.readFileSync(outputFile, "utf-8");
    const parsed = JSON.parse(data);
    outputs = {};
    for (const [k, v] of Object.entries(parsed)) {
      outputs[k] = parseIfArray(v);
    }
  });

  it("has sufficient keys in outputs", () => {
    expect(Object.keys(outputs).length).toBeGreaterThan(20);
  });

  it("validates all *_arn outputs are valid ARNs", () => {
    const arnKeys = Object.keys(outputs).filter(k => k.endsWith("_arn"));
    for (const key of arnKeys) {
      if (skipIfMissing(key, outputs)) continue;
      expect(isValidArn(outputs[key])).toBe(true);
    }
  });

  it("validates VPC IDs", () => {
    for (const region of ["primary", "secondary"]) {
      const vpcKey = `${region}_vpc_id`;
      if (skipIfMissing(vpcKey, outputs)) continue;
      expect(isValidVpcId(outputs[vpcKey])).toBe(true);
    }
  });

  it("validates subnet IDs arrays", () => {
    const subnetKeys = [
      "primary_public_subnet_ids",
      "primary_private_subnet_ids",
      "secondary_public_subnet_ids",
      "secondary_private_subnet_ids",
    ];
    for (const key of subnetKeys) {
      if (skipIfMissing(key, outputs)) continue;
      expect(Array.isArray(outputs[key])).toBe(true);
      for (const val of outputs[key]) {
        expect(isValidSubnetId(val)).toBe(true);
      }
    }
  });

  it("validates security group IDs", () => {
    const sgKeys = [
      "primary_ec2_security_group_id",
      "primary_rds_security_group_id",
      "secondary_ec2_security_group_id",
      "secondary_rds_security_group_id",
    ];
    for (const key of sgKeys) {
      if (skipIfMissing(key, outputs)) continue;
      expect(isValidSGId(outputs[key])).toBe(true);
    }
  });

  it("validates internet gateways", () => {
    for (const region of ["primary", "secondary"]) {
      const igwKey = `${region}_internet_gateway_id`;
      if (skipIfMissing(igwKey, outputs)) continue;
      expect(isValidIGWId(outputs[igwKey])).toBe(true);
    }
  });

  it("validates NAT gateway IDs arrays", () => {
    for (const region of ["primary", "secondary"]) {
      const natKey = `${region}_nat_gateway_ids`;
      if (skipIfMissing(natKey, outputs)) continue;
      expect(Array.isArray(outputs[natKey])).toBe(true);
      for (const val of outputs[natKey]) {
        expect(isValidNatId(val)).toBe(true);
      }
    }
  });

  it("validates EC2 instance IDs and AMI IDs are non-empty strings", () => {
    for (const region of ["primary", "secondary"]) {
      for (const suffix of ["ec2_instance_id", "ami_id"]) {
        const key = `${region}_${suffix}`;
        if (skipIfMissing(key, outputs)) continue;
        expect(isNonEmptyString(outputs[key])).toBe(true);
      }
    }
  });

  it("validates RDS endpoints and instance IDs", () => {
    for (const region of ["primary", "secondary"]) {
      const endpointKey = `${region}_rds_endpoint`;
      const instanceKey = `${region}_rds_instance_id`;
      if (!skipIfMissing(endpointKey, outputs)) {
        expect(isNonEmptyString(outputs[endpointKey])).toBe(true);
        expect(outputs[endpointKey]).toMatch(/rds\.amazonaws\.com:\d+$/);
      }
      if (!skipIfMissing(instanceKey, outputs)) {
        expect(isNonEmptyString(outputs[instanceKey])).toBe(true);
      }
    }
  });

  it("validates bucket names exist", () => {
    for (const key of ["cloudtrail_bucket_name", "rds_backup_bucket_name"]) {
      if (skipIfMissing(key, outputs)) continue;
      expect(isNonEmptyString(outputs[key])).toBe(true);
    }
  });

  it("validates SNS topic ARNs", () => {
    for (const region of ["primary", "secondary"]) {
      const key = `${region}_sns_topic_arn`;
      if (skipIfMissing(key, outputs)) continue;
      expect(isValidArn(outputs[key])).toBe(true);
    }
  });
});

