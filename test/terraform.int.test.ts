import * as fs from "fs";
import * as path from "path";

const outputPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");

const isNonEmptyString = (val: any): boolean =>
  typeof val === "string" && val.trim().length > 0;

const isValidArn = (val: any): boolean => {
  if (typeof val !== "string" || val.trim().length === 0) return false;
  // Basic ARN pattern (aws:service:region:account-id:resource)
  return /^arn:aws:[\w-]+:[\w-]*:\d{12}:[\w\-\/:.]+$/.test(val)
    || /^arn:aws:[\w-]+:[\w-]*:\d{12}:trail\/[\w\-]+$/.test(val)
    || /^arn:aws:s3:::[\w\-./]+$/.test(val); // For S3 bucket arn
};

const isValidVpcId = (val: any): boolean =>
  isNonEmptyString(val) && /^vpc-[a-z0-9]+$/.test(val);

const isValidSubnetId = (val: any): boolean =>
  isNonEmptyString(val) && /^subnet-[a-z0-9]+$/.test(val);

const isValidSecurityGroupId = (val: any): boolean =>
  isNonEmptyString(val) && /^sg-[a-z0-9]+$/.test(val);

const isValidInternetGatewayId = (val: any): boolean =>
  isNonEmptyString(val) && /^igw-[a-z0-9]+$/.test(val);

const isValidNatGatewayId = (val: any): boolean =>
  isNonEmptyString(val) && /^nat-[a-z0-9]+$/.test(val);

const isValidAmiId = (val: any): boolean =>
  isNonEmptyString(val) && /^ami-[a-z0-9]+$/.test(val);

const isValidDbInstanceId = (val: any): boolean =>
  isNonEmptyString(val) && /^db-[A-Z0-9]+$/.test(val);

const isValidIp = (val: string): boolean =>
  typeof val === "string" && /^(\d{1,3}\.){3}\d{1,3}$/.test(val);

const isValidBucketName = (val: any): boolean =>
  isNonEmptyString(val) && /^[a-z0-9-\.]+$/.test(val);

const isValidParameterName = (val: any): boolean =>
  isNonEmptyString(val) && /^\/[a-z0-9\-]+\/[a-z0-9\-]+\/rds\/(username|password)$/.test(val);

const parseArray = (val: any): string[] => {
  if (!val) return [];
  // Accepts both string-encoded array and real array
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try { return JSON.parse(val); }
    catch { return []; }
  }
  return [];
};

describe("Comprehensive AWS Terraform Integration Tests (from flat outputs)", () => {
  let outputs: Record<string, any>;
  beforeAll(() => {
    outputs = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
  });

  it("should have all expected output keys", () => {
    const expectedKeys = [
      "ami_id", "cloudtrail_arn", "cloudtrail_s3_bucket_name", "ec2_instance_id",
      "ec2_instance_profile_name", "ec2_private_ip", "ec2_public_ip", "ec2_security_group_id",
      "internet_gateway_id", "nat_gateway_eip", "nat_gateway_id", "private_subnet_ids",
      "public_subnet_ids", "rds_access_role_arn", "rds_db_name", "rds_endpoint", "rds_instance_id",
      "rds_password_parameter_name", "rds_security_group_id", "rds_username_parameter_name",
      "s3_bucket_arn", "s3_bucket_name", "user_role_arn", "vpc_cidr_block", "vpc_id"
    ];
    expect(Object.keys(outputs).sort()).toEqual(expectedKeys.sort());
  });

  it("vpc_id should be valid", () => {
    expect(isValidVpcId(outputs.vpc_id)).toBe(true);
  });

  it("vpc_cidr_block should be valid CIDR", () => {
    expect(outputs.vpc_cidr_block).toMatch(/^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/);
  });

  it("internet_gateway_id should be valid", () => {
    expect(isValidInternetGatewayId(outputs.internet_gateway_id)).toBe(true);
  });

  it("nat_gateway_id should be valid", () => {
    expect(isValidNatGatewayId(outputs.nat_gateway_id)).toBe(true);
  });

  it("nat_gateway_eip should be valid IPv4", () => {
    expect(isValidIp(outputs.nat_gateway_eip)).toBe(true);
  });

  it("ec2_instance_id should be valid AWS instance id", () => {
    expect(isNonEmptyString(outputs.ec2_instance_id)).toBe(true);
    expect(outputs.ec2_instance_id).toMatch(/^i-[a-z0-9]+$/);
  });

  it("ec2_instance_profile_name should be valid", () => {
    expect(isNonEmptyString(outputs.ec2_instance_profile_name)).toBe(true);
  });

  it("ec2_security_group_id should be valid SG ID", () => {
    expect(isValidSecurityGroupId(outputs.ec2_security_group_id)).toBe(true);
  });

  it("ec2_private_ip and ec2_public_ip should be valid IPv4", () => {
    expect(isValidIp(outputs.ec2_private_ip)).toBe(true);
    expect(isValidIp(outputs.ec2_public_ip)).toBe(true);
  });

  it("public_subnet_ids and private_subnet_ids arrays should be valid subnet IDs", () => {
    const pubSubnets = parseArray(outputs.public_subnet_ids);
    const privSubnets = parseArray(outputs.private_subnet_ids);
    expect(pubSubnets.length).toBeGreaterThan(0);
    expect(privSubnets.length).toBeGreaterThan(0);
    pubSubnets.forEach(id => expect(isValidSubnetId(id)).toBe(true));
    privSubnets.forEach(id => expect(isValidSubnetId(id)).toBe(true));
  });

  it("rds_access_role_arn and user_role_arn should be valid ARNs", () => {
    expect(isValidArn(outputs.rds_access_role_arn)).toBe(true);
    expect(isValidArn(outputs.user_role_arn)).toBe(true);
  });

  it("rds_instance_id should be valid", () => {
    expect(isValidDbInstanceId(outputs.rds_instance_id)).toBe(true);
  });

  it("rds_db_name should be non-empty, matches expected format", () => {
    expect(isNonEmptyString(outputs.rds_db_name)).toBe(true);
    expect(outputs.rds_db_name).toMatch(/^[a-zA-Z0-9_]+$/);
  });

  it("rds_endpoint should be non-empty and end with .rds.amazonaws.com", () => {
    expect(isNonEmptyString(outputs.rds_endpoint)).toBe(true);
    expect(outputs.rds_endpoint).toMatch(/\.rds\.amazonaws\.com(:\d+)?$/);
  });

  it("rds_security_group_id should be valid", () => {
    expect(isValidSecurityGroupId(outputs.rds_security_group_id)).toBe(true);
  });

  it("rds_username_parameter_name and rds_password_parameter_name should be valid SSM parameter names", () => {
    expect(isValidParameterName(outputs.rds_username_parameter_name)).toBe(true);
    expect(isValidParameterName(outputs.rds_password_parameter_name)).toBe(true);
  });

  it("s3_bucket_arn should be a valid S3 ARN", () => {
    expect(isValidArn(outputs.s3_bucket_arn)).toBe(true);
  });

  it("s3_bucket_name should be valid bucket name", () => {
    expect(isValidBucketName(outputs.s3_bucket_name)).toBe(true);
  });

  it("cloudtrail_arn should be valid", () => {
    expect(isValidArn(outputs.cloudtrail_arn)).toBe(true);
  });

  it("cloudtrail_s3_bucket_name should be valid", () => {
    expect(isValidBucketName(outputs.cloudtrail_s3_bucket_name)).toBe(true);
  });

  it("ami_id should be valid", () => {
    expect(isValidAmiId(outputs.ami_id)).toBe(true);
  });

});
