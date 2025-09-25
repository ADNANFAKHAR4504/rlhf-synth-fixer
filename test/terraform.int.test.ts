import * as fs from "fs";
import * as path from "path";

// Load flat outputs JSON from deployment result
const outputsRaw: { [key: string]: any } = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../cfn-outputs/flat-outputs.json"), "utf8")
);

// Helper to parse stringified arrays or objects
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
  const expectedKeys = [
    "ami_id",
    "ami_name",
    "cloudwatch_dashboard_name",
    "ec2_iam_role_arn",
    "ec2_iam_role_name",
    "ec2_instance_ids",
    "ec2_instance_profile_name",
    "ec2_private_ips",
    "flow_log_id",
    "internet_gateway_id",
    "kms_key_arn",
    "kms_key_id",
    "private_subnet_ids",
    "public_subnet_ids",
    "s3_bucket_arn",
    "s3_bucket_id",
    "s3_logs_bucket_id",
    "security_group_id",
    "vpc_cidr",
    "vpc_flow_logs_log_group",
    "vpc_id"
  ];

  it("should contain all expected output keys", () => {
    expectedKeys.forEach(key => {
      expect(outputsRaw).toHaveProperty(key);
    });
  });

  it("should have non-empty strings for all outputs", () => {
    expectedKeys.forEach(key => {
      expect(isNonEmptyString(outputsRaw[key])).toBe(true);
    });
  });

  it("Public and private subnet arrays should parse correctly", () => {
    expect(asArray(outputsRaw.public_subnet_ids).length).toBeGreaterThan(0);
    expect(asArray(outputsRaw.private_subnet_ids).length).toBeGreaterThan(0);
  });

  it("EC2 instance IDs and private IPs should parse into objects", () => {
    expect(typeof JSON.parse(outputsRaw.ec2_instance_ids)).toBe("object");
    expect(typeof JSON.parse(outputsRaw.ec2_private_ips)).toBe("object");
  });

  it("AMI ID and name formats are valid", () => {
    expect(/^ami-[a-z0-9]+$/.test(outputsRaw.ami_id)).toBe(true);
    expect(outputsRaw.ami_name.startsWith("amzn2-ami-hvm")).toBe(true);
  });

  it("VPC CIDR block is correct", () => {
    expect(outputsRaw.vpc_cidr).toBe("10.0.0.0/16");
  });

  it("Flow log, IGW, and security group IDs are non-empty strings", () => {
    ["flow_log_id", "internet_gateway_id", "security_group_id"].forEach(key => {
      expect(isNonEmptyString(outputsRaw[key])).toBe(true);
    });
  });

  it("KMS Key ARN and ID are valid", () => {
    expect(outputsRaw.kms_key_arn).toMatch(/^arn:aws:kms:us-east-1:\d{12}:key\/[a-f0-9-]+$/);
    expect(outputsRaw.kms_key_id).toMatch(/^[a-f0-9-]+$/);
  });

  it("S3 bucket ARNs and IDs are non-empty and consistent", () => {
    expect(isNonEmptyString(outputsRaw.s3_bucket_arn)).toBe(true);
    expect(isNonEmptyString(outputsRaw.s3_bucket_id)).toBe(true);
    expect(isNonEmptyString(outputsRaw.s3_logs_bucket_id)).toBe(true);
  });

  it("EC2 IAM role ARN and name formats are valid", () => {
    expect(outputsRaw.ec2_iam_role_arn).toMatch(/^arn:aws:iam::\d{12}:role\/.+$/);
    expect(isNonEmptyString(outputsRaw.ec2_iam_role_name)).toBe(true);
  });

  it("EC2 instance profile name is non-empty", () => {
    expect(isNonEmptyString(outputsRaw.ec2_instance_profile_name)).toBe(true);
  });

  it("VPC flow log group name is correctly set", () => {
    expect(outputsRaw.vpc_flow_logs_log_group).toMatch(/^\/aws\/vpc\/flowlogs/);
  });

  it("Public and private subnet IDs should not overlap", () => {
    const publicSubnets = asArray(outputsRaw.public_subnet_ids);
    const privateSubnets = asArray(outputsRaw.private_subnet_ids);
    const intersection = publicSubnets.filter(id => privateSubnets.includes(id));
    expect(intersection.length).toBe(0);
  });

  it("All major IDs are unique", () => {
    const ids = [
      outputsRaw.vpc_id,
      outputsRaw.internet_gateway_id,
      outputsRaw.flow_log_id,
      outputsRaw.security_group_id,
      ...asArray(outputsRaw.public_subnet_ids),
      ...asArray(outputsRaw.private_subnet_ids)
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });
});
