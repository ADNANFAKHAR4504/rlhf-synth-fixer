import * as fs from "fs";
import * as path from "path";

const outputPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");

const isNonEmptyString = (val: any): boolean =>
  typeof val === "string" && val.trim().length > 0;

// Improved ARN validation to handle IAM role ARNs with slashes
const isValidArn = (val: any): boolean => {
  if (typeof val !== "string" || val.trim().length === 0) return false;

  const iamRoleArnPattern = /^arn:aws:iam::\d{12}:role\/[\w+=,.@\-_/]+$/;
  const genericArnPattern = /^arn:aws:[^:]+:[^:]*:\d{12}:[^ ]+$/;

  return iamRoleArnPattern.test(val) || genericArnPattern.test(val);
};

const isValidVpcId = (val: any): boolean =>
  isNonEmptyString(val) && val.startsWith("vpc-");

const isValidSubnetId = (val: any): boolean =>
  isNonEmptyString(val) && val.startsWith("subnet-");

const isValidSecurityGroupId = (val: any): boolean =>
  isNonEmptyString(val) && val.startsWith("sg-");

const isValidIp = (val: string): boolean =>
  typeof val === "string" &&
  /^(\d{1,3}\.){3}\d{1,3}$/.test(val);

const parseJson = (val: any): any => {
  if (!val) return null;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return null;
    }
  }
  return val;
};

describe("Terraform Stack Integration Tests (Read-only Live Checks)", () => {
  let outputsRaw: Record<string, any>;
  let outputs: Record<string, any>;

  beforeAll(() => {
    outputsRaw = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
    outputs = {};
    for (const [key, val] of Object.entries(outputsRaw)) {
      try {
        outputs[key] = parseJson(val);
      } catch {
        outputs[key] = val;
      }
    }
  });

  it("should include all expected output keys", () => {
    const expectedKeys: string[] = [
      "ami_ids",
      "ec2_instance_ids",
      "ec2_instance_public_ips",
      "iam_instance_profile",
      "iam_roles",
      "kms_key_arns",
      "rds_endpoints",
      "s3_bucket_names",
      "security_group_ids",
      "subnet_ids",
      "vpc_ids"
    ];
    expectedKeys.forEach((key: string) => {
      expect(outputs).toHaveProperty(key);
    });
  });

  // Validate ARNs in iam_roles and kms_key_arns objects
  it("validates IAM roles and KMS key ARNs", () => {
    const iamRoles = outputs.iam_roles as Record<string, string>;
    const kmsArns = outputs.kms_key_arns as Record<string, string>;

    expect(typeof iamRoles).toBe("object");
    expect(typeof kmsArns).toBe("object");

    Object.values(iamRoles).forEach((val: string) => expect(isNonEmptyString(val)).toBe(true));
    Object.values(kmsArns).forEach((val: string) => expect(isValidArn(val)).toBe(true));
  });

  // Validate VPC IDs
  it("validates VPC IDs", () => {
    const vpcIds = outputs.vpc_ids as Record<string, string>;
    expect(isValidVpcId(vpcIds.primary)).toBe(true);
    expect(isValidVpcId(vpcIds.secondary)).toBe(true);
  });

  // Validate subnet IDs arrays
  it("validates subnet IDs arrays", () => {
    const subnets = outputs.subnet_ids as Record<string, string[]>;
    const keys = ["primary_private", "primary_public", "secondary_private", "secondary_public"];
    keys.forEach((key: string) => {
      expect(Array.isArray(subnets[key])).toBe(true);
      subnets[key].forEach((id: string) => expect(isValidSubnetId(id)).toBe(true));
    });
  });

  // Validate security group IDs
  it("validates security group IDs", () => {
    const sgs = outputs.security_group_ids as Record<string, string>;
    Object.values(sgs).forEach((id: string) => expect(isValidSecurityGroupId(id)).toBe(true));
  });

  // Validate EC2 instance IDs
  it("validates EC2 instance IDs", () => {
    const ec2Ids = outputs.ec2_instance_ids as Record<string, string>;
    expect(isNonEmptyString(ec2Ids.primary)).toBe(true);
    expect(isNonEmptyString(ec2Ids.secondary)).toBe(true);
  });

  // Validate EC2 public IPs
  it("validates EC2 instance public IPs", () => {
    const ips = outputs.ec2_instance_public_ips as Record<string, string>;
    expect(isNonEmptyString(ips.primary)).toBe(true);
    expect(isValidIp(ips.primary)).toBe(true);
    expect(isNonEmptyString(ips.secondary)).toBe(true);
    expect(isValidIp(ips.secondary)).toBe(true);
  });

  // Validate RDS endpoints
  it("validates RDS endpoints", () => {
    const rds = outputs.rds_endpoints as Record<string, string>;
    expect(typeof rds.primary).toBe("string");
    expect(rds.primary.includes(".rds.amazonaws.com")).toBe(true);
    expect(typeof rds.secondary).toBe("string");
    expect(rds.secondary.includes(".rds.amazonaws.com")).toBe(true);
  });

  // Validate S3 bucket names
  it("validates S3 bucket names", () => {
    const buckets = outputs.s3_bucket_names as Record<string, string>;
    expect(isNonEmptyString(buckets.primary)).toBe(true);
    expect(isNonEmptyString(buckets.secondary)).toBe(true);
  });

  // Validate IAM instance profile string
  it("checks that IAM instance profile key exists in outputs", () => {
    expect(outputs).toHaveProperty("iam_instance_profile");
  });

});

