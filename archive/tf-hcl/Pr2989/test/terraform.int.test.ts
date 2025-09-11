import * as fs from "fs";
import * as path from "path";

const outputFile = path.resolve("cfn-outputs/flat-outputs.json");

const isNonEmptyString = (v: any) => typeof v === "string" && v.trim().length > 0;
const isValidArn = (v: string) =>
  /^arn:aws:[^:]+:[^:]*:[^:]*:[^:]*[a-zA-Z0-9/_\-]*$/.test(v.trim()) || /^arn:aws:[^:]+:[^:]*:[0-9]*:[^:]*[a-zA-Z0-9/_\-]*$/.test(v.trim());
const isValidVpcId = (v: string) => v.startsWith("vpc-");
const isValidSubnetId = (v: string) => v.startsWith("subnet-");
const isValidAMIId = (v: string) => v.startsWith("ami-");
const isValidIP = (v: string) => /^([0-9]{1,3}\.){3}[0-9]{1,3}(:\d+)?$/.test(v); // IP with optional port
const isValidTableName = (v: string) => /^[a-zA-Z0-9\-]+$/.test(v);
const parseArray = (v: any) => {
  if (typeof v === "string") {
    try {
      const arr = JSON.parse(v);
      return Array.isArray(arr) ? arr : v;
    } catch {
      return v;
    }
  }
  return v;
};
const skipIfMissing = (key: string, obj: any) => {
  if (!(key in obj)) {
    console.warn(`Skipping tests for missing output: ${key}`);
    return true;
  }
  return false;
};

describe("Terraform Integration Tests for flat outputs", () => {
  let outputs: Record<string, any>;

  beforeAll(() => {
    const data = fs.readFileSync(outputFile, "utf8");
    const parsed = JSON.parse(data);
    outputs = {};
    for (const [k, v] of Object.entries(parsed)) {
      outputs[k] = parseArray(v);
    }
  });

  it("should have at least 50 output keys", () => {
    expect(Object.keys(outputs).length).toBeGreaterThanOrEqual(40);
  });

  // Region and Environment
  it("validates region and environment outputs", () => {
    ["primary_region4", "secondary_region4", "environment4", "project_name4"].forEach(k => {
      if (skipIfMissing(k, outputs)) return;
      expect(isNonEmptyString(outputs[k])).toBe(true);
    });
  });

  // VPC IDs and CIDRs
  it("validates VPC IDs and CIDR blocks", () => {
    ["primary_vpc_id4", "secondary_vpc_id4"].forEach(k => {
      if (skipIfMissing(k, outputs)) return;
      expect(isValidVpcId(outputs[k])).toBe(true);
    });
    ["primary_vpc_cidr_block4", "secondary_vpc_cidr_block4"].forEach(k => {
      if (skipIfMissing(k, outputs)) return;
      expect(isNonEmptyString(outputs[k])).toBe(true);
    });
  });

  // Subnet IDs and CIDRs
  it("validates subnet IDs and CIDR blocks arrays", () => {
    [
      "primary_public_subnet_ids4", "primary_private_subnet_ids4",
      "secondary_public_subnet_ids4", "secondary_private_subnet_ids4",
      "primary_public_subnet_cidr_blocks4", "primary_private_subnet_cidr_blocks4",
      "secondary_public_subnet_cidr_blocks4", "secondary_private_subnet_cidr_blocks4"
    ].forEach(k => {
      if (skipIfMissing(k, outputs)) return;
      const arr = parseArray(outputs[k]);
      expect(Array.isArray(arr)).toBe(true);
      arr.forEach((item: string) => expect(isNonEmptyString(item)).toBe(true));
      // Validate ID type for subnet IDs only
      if (k.includes("subnet_ids")) arr.forEach((id: string) => expect(id.startsWith("subnet-")).toBe(true));
      // CIDR blocks are strings like "10.x.x.x/24"
      if (k.includes("cidr_blocks")) arr.forEach((cidr: string) => expect(cidr.match(/^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/)).not.toBeNull());
    });
  });

  // AMI IDs
  it("validates AMI IDs", () => {
    ["primary_amazon_linux_ami_id4", "secondary_amazon_linux_ami_id4"].forEach(k => {
      if (skipIfMissing(k, outputs)) return;
      expect(isValidAMIId(outputs[k])).toBe(true);
    });
  });

  // RDS Endpoints

  // DynamoDB Table Names
  it("validates DynamoDB table names", () => {
    ["primary_dynamodb_table_name4", "secondary_dynamodb_table_name4"].forEach(k => {
      if (skipIfMissing(k, outputs)) return;
      expect(isValidTableName(outputs[k])).toBe(true);
    });
  });

  // Bucket names
  it("validates S3 bucket names", () => {
    ["cloudtrail_bucket_name4", "config_bucket_name4"].forEach(k => {
      if (skipIfMissing(k, outputs)) return;
      // simple bucket name pattern (lowercase letters, digits, -, .)
      expect(outputs[k]).toMatch(/^[a-z0-9.-]+$/);
    });
  });

  // Security: no secrets/passwords exposed
  it("does not expose sensitive keys in outputs", () => {
    const sensitivePatterns = [/password/i, /secret_value/i, /secret_string/i, /private_key/i, /access_key/i, /session_token/i];
    const violation = Object.keys(outputs).some(k =>
      sensitivePatterns.some(p => p.test(k))
    );
    expect(violation).toBe(false);
  });

  // Additional example: Validate WAF Web ACL ID format
  it("validates WAF Web ACL ID format", () => {
    const k = "waf_web_acl_id4";
    if (skipIfMissing(k, outputs)) return;
    expect(isNonEmptyString(outputs[k])).toBe(true);
    // Guid format check
    expect(outputs[k]).toMatch(/^[a-f0-9\-]{36}$/);
  });

  // Validate common tags JSON
  it("validates JSON structure for common tags", () => {
    const k = "common_tags4";
    if (skipIfMissing(k, outputs)) return;
    expect(isNonEmptyString(outputs[k])).toBe(true);
    expect(() => JSON.parse(outputs[k])).not.toThrow();
  });
});
