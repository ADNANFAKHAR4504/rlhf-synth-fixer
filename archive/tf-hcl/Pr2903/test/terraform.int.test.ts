import * as fs from "fs";
import * as path from "path";

const outputsRaw: { [key: string]: any } = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../cfn-outputs/flat-outputs.json"), "utf8")
);

function asArray(val: any): string[] {
  if (Array.isArray(val)) return val;
  try {
    return JSON.parse(val);
  } catch {
    return [val];
  }
}

function isNonEmptyString(value: any): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

describe("Flat Outputs Integration Tests", () => {
  // Expected keys for this deployment (tailored to actual sample)
  const expectedKeys = [
    "availability_zones",
    "cloudtrail_name",
    "cloudtrail_s3_bucket_name",
    "ec2_iam_role_arn",
    "ec2_iam_role_name",
    "ec2_instance_profile_name",
    "elasticache_primary_endpoint",
    "elasticache_replication_group_id",
    "elasticache_security_group_id",
    "internet_gateway_id",
    "kms_key_id",
    "lambda_function_arn",
    "lambda_function_name",
    "lambda_security_group_id",
    "nat_gateway_ids",
    "private_subnet_ids",
    "public_subnet_ids",
    "rds_endpoint",
    "rds_instance_id",
    "rds_port",
    "rds_security_group_id",
    "s3_bucket_arn",
    "s3_bucket_name",
    "secrets_manager_arn",
    "ssm_document_name",
    "vpc_cidr",
    "vpc_flow_logs_log_group_name",
    "vpc_id",
    "web_security_group_id"
  ];

  it("contains all required flat output keys", () => {
    expectedKeys.forEach(key => {
      expect(outputsRaw).toHaveProperty(key);
    });
  });

  it("all outputs are non-empty strings", () => {
    expectedKeys.forEach(key => {
      expect(isNonEmptyString(outputsRaw[key])).toBe(true);
    });
  });

  it("availability_zones is correct array and region naming", () => {
    const azs = asArray(outputsRaw.availability_zones);
    expect(azs.length).toBeGreaterThanOrEqual(2);
    azs.forEach(az => expect(/^us-east-2[ab]$/.test(az)).toBe(true));
  });

  it("nat_gateway_ids, private_subnet_ids, public_subnet_ids contain 2 unique entries each", () => {
    ["nat_gateway_ids", "private_subnet_ids", "public_subnet_ids"].forEach(key => {
      const arr = asArray(outputsRaw[key]);
      expect(arr.length).toBe(2);
      expect(new Set(arr).size).toBe(2);
    });
  });

  it("resource IDs and ARNs have expected formats", () => {
    expect(outputsRaw.vpc_id).toMatch(/^vpc-[a-z0-9]+$/);
    expect(outputsRaw.internet_gateway_id).toMatch(/^igw-[a-z0-9]+$/);
    expect(outputsRaw.elasticache_security_group_id).toMatch(/^sg-[a-z0-9]+$/);
    expect(outputsRaw.s3_bucket_arn).toMatch(/^arn:aws:s3:::[\w\-.]+$/);
    expect(outputsRaw.lambda_function_arn).toMatch(/^arn:aws:lambda:us-east-2:[^:]+:function:[\w\-]+$/);
    expect(outputsRaw.secrets_manager_arn).toMatch(/^arn:aws:secretsmanager:us-east-2:[^:]+:secret:[\w\-]+/);
    expect(outputsRaw.rds_endpoint).toMatch(/^[a-z0-9\-\.]+\.us-east-2\.rds\.amazonaws\.com:3306$/);
    expect(outputsRaw.rds_instance_id).toContain("tap-stack");
  });

  it("vpc_cidr block matches expected architecture", () => {
    expect(outputsRaw.vpc_cidr).toBe("10.0.0.0/16");
  });

  it("RDS port is correct", () => {
    expect(outputsRaw.rds_port).toBe("3306");
  });

  it("CloudTrail and S3 bucket names have deployment prefix", () => {
    expect(outputsRaw.cloudtrail_name.startsWith("tap-stack-cloudtrail")).toBe(true);
    expect(outputsRaw.cloudtrail_s3_bucket_name.startsWith("tap-stack-cloudtrail")).toBe(true);
    expect(outputsRaw.s3_bucket_name.startsWith("tap-stack-app-data")).toBe(true);
  });

  it("outputs for security groups are unique and non-empty", () => {
    ["elasticache_security_group_id", "lambda_security_group_id", "rds_security_group_id", "web_security_group_id"].forEach(idKey => {
      expect(isNonEmptyString(outputsRaw[idKey])).toBe(true);
    });
    const sgIds = [
      outputsRaw.elasticache_security_group_id,
      outputsRaw.lambda_security_group_id,
      outputsRaw.rds_security_group_id,
      outputsRaw.web_security_group_id
    ];
    expect(new Set(sgIds).size).toBe(sgIds.length);
  });

  it("KMS key ID and SSM document name have valid formats", () => {
    expect(outputsRaw.kms_key_id).toMatch(/^[a-f0-9-]{36}$/);
    expect(outputsRaw.ssm_document_name.startsWith("tap-stack-maintenance-document")).toBe(true);
  });

  it("vpc_flow_logs_log_group_name has expected prefix", () => {
    expect(outputsRaw.vpc_flow_logs_log_group_name.startsWith("/aws/vpc/flowlogs")).toBe(true);
  });

  it("elasticache endpoint and replication group ID match conventions", () => {
    expect(outputsRaw.elasticache_primary_endpoint).toMatch(/^[\w\-\.]+\.cache\.amazonaws\.com$/);
    expect(outputsRaw.elasticache_replication_group_id.startsWith("tap-stack-cache")).toBe(true);
  });

  it("all major resource IDs are unique", () => {
    const ids = [
      outputsRaw.vpc_id,
      outputsRaw.internet_gateway_id,
      outputsRaw.elasticache_security_group_id,
      outputsRaw.lambda_security_group_id,
      outputsRaw.rds_security_group_id,
      outputsRaw.web_security_group_id,
      ...asArray(outputsRaw.nat_gateway_ids),
      ...asArray(outputsRaw.public_subnet_ids),
      ...asArray(outputsRaw.private_subnet_ids)
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  // Negative: Should not expose AWS secrets or keys
  it("no outputs contain hardcoded AWS credential keys", () => {
    Object.values(outputsRaw).forEach(val => {
      expect(typeof val).toBe("string");
      expect(!/aws_access_key_id|aws_secret_access_key|AKIA[0-9A-Z]+/.test(val)).toBe(true);
    });
  });
});
