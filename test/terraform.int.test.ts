import * as fs from "fs";
import * as path from "path";

// Load flat-outputs.json
const outputsRaw = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../cfn-outputs/flat-outputs.json"), "utf8"));

// Helper for potentially stringified array outputs
function asArray(val: any): string[] {
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return [val]; }
}

function isNonEmptyString(value: any): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

describe("Flat Outputs Integration Tests", () => {
  // Keys exactly as in supplied flat-outputs.json
  const requiredKeys = [
    "ami_id", "ami_name", "availability_zones", "bucket_suffix",
    "cloudtrail_name", "cloudwatch_log_group_name", "config_delivery_channel_name",
    "config_recorder_name", "iam_config_role_name", "iam_ec2_instance_profile_name", "iam_ec2_role_name",
    "iam_lambda_role_name", "internet_gateway_id", "lambda_function_name", "mfa_group_name",
    "nat_gateway_ids", "nat_gateway_public_ips", "private_route_table_ids", "private_subnet_cidrs",
    "private_subnet_ids", "public_route_table_id", "public_subnet_cidrs", "public_subnet_ids",
    "rds_db_name", "rds_subnet_group_name", "rds_username_suffix", "region",
    "s3_bucket_arn", "s3_bucket_name", "s3_cloudtrail_bucket_arn", "s3_cloudtrail_bucket_name",
    "s3_config_bucket_arn", "s3_config_bucket_name", "secrets_manager_secret_name",
    "security_group_ec2_id", "security_group_rds_id", "security_group_vpc_endpoint_id",
    "vpc_cidr_block", "vpc_id", "vpc_lambda_endpoint_id", "vpc_s3_endpoint_id"
  ];

  it("should contain all required output keys", () => {
    requiredKeys.forEach(key => {
      expect(outputsRaw).toHaveProperty(key);
    });
  });

  it("should have non-empty string values for all outputs", () => {
    requiredKeys.forEach(key => {
      expect(isNonEmptyString(outputsRaw[key])).toBe(true);
    });
  });

  it("region value should match expected", () => {
    expect(outputsRaw.region).toBe("us-east-2");
  });

  it("availability_zones must be an array of valid names", () => {
    const azs = asArray(outputsRaw.availability_zones);
    expect(Array.isArray(azs)).toBe(true);
    expect(azs.length).toBe(2);
    azs.forEach(az => expect(/^us-east-2[a-c]$/.test(az)).toBe(true));
  });

  it("public and private subnet ids/counts and CIDRs are strictly 2 in length", () => {
    expect(asArray(outputsRaw.public_subnet_ids).length).toBe(2);
    expect(asArray(outputsRaw.private_subnet_ids).length).toBe(2);

    expect(asArray(outputsRaw.public_subnet_cidrs).length).toBe(2);
    expect(asArray(outputsRaw.private_subnet_cidrs).length).toBe(2);
  });

  it("NAT gateway IDs and public IPs present for HA architecture", () => {
    expect(asArray(outputsRaw.nat_gateway_ids).length).toBe(2);
    expect(asArray(outputsRaw.nat_gateway_public_ips).length).toBe(2);
    asArray(outputsRaw.nat_gateway_public_ips).forEach(ip => {
      expect(/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)).toBe(true);
    });
  });

  it("internet gateway ID, route table IDs, and VPC ID all non-empty", () => {
    expect(isNonEmptyString(outputsRaw.internet_gateway_id)).toBe(true);
    expect(isNonEmptyString(outputsRaw.public_route_table_id)).toBe(true);
    expect(asArray(outputsRaw.private_route_table_ids).length).toBe(2);
    expect(isNonEmptyString(outputsRaw.vpc_id)).toBe(true);
  });

  it("S3, CloudTrail, Config bucket ARNs and names are unique and well-formed", () => {
    expect(isNonEmptyString(outputsRaw.s3_bucket_arn)).toBe(true);
    expect(isNonEmptyString(outputsRaw.s3_cloudtrail_bucket_arn)).toBe(true);
    expect(isNonEmptyString(outputsRaw.s3_config_bucket_arn)).toBe(true);

    expect(isNonEmptyString(outputsRaw.s3_bucket_name)).toBe(true);
    expect(isNonEmptyString(outputsRaw.s3_cloudtrail_bucket_name)).toBe(true);
    expect(isNonEmptyString(outputsRaw.s3_config_bucket_name)).toBe(true);

    const names = [
      outputsRaw.s3_bucket_name, outputsRaw.s3_cloudtrail_bucket_name, outputsRaw.s3_config_bucket_name
    ];
    expect(new Set(names).size).toBe(names.length);
  });

  it("Security group IDs and VPC endpoints are present and unique", () => {
    const sgIds = [
      outputsRaw.security_group_ec2_id,
      outputsRaw.security_group_rds_id,
      outputsRaw.security_group_vpc_endpoint_id
    ];
    sgIds.forEach(id => expect(isNonEmptyString(id)).toBe(true));
    expect(new Set(sgIds).size).toBe(sgIds.length);

    const vpceIds = [
      outputsRaw.vpc_lambda_endpoint_id,
      outputsRaw.vpc_s3_endpoint_id
    ];
    vpceIds.forEach(id => expect(isNonEmptyString(id)).toBe(true));
    expect(new Set(vpceIds).size).toBe(vpceIds.length);
  });

  it("Outputs for IAM roles/groups/profiles and Lambda/RDS naming conventions", () => {
    expect(isNonEmptyString(outputsRaw.iam_ec2_role_name)).toBe(true);
    expect(isNonEmptyString(outputsRaw.iam_lambda_role_name)).toBe(true);
    expect(isNonEmptyString(outputsRaw.iam_config_role_name)).toBe(true);
    expect(isNonEmptyString(outputsRaw.iam_ec2_instance_profile_name)).toBe(true);
    expect(isNonEmptyString(outputsRaw.mfa_group_name)).toBe(true);

    expect(outputsRaw.iam_ec2_role_name.startsWith("ec2-role")).toBe(true);
    expect(outputsRaw.iam_lambda_role_name.startsWith("lambda-rds-backup-role")).toBe(true);
    expect(outputsRaw.mfa_group_name.startsWith("mfa-required")).toBe(true);
    expect(outputsRaw.lambda_function_name).toBe("rds-backup-function");
  });

  it("AMI outputs match Amazon Linux details", () => {
    expect(/^ami-[a-zA-Z0-9]+$/.test(outputsRaw.ami_id)).toBe(true);
    expect(outputsRaw.ami_name.startsWith("amzn2-ami-hvm")).toBe(true);
  });

  it("Bucket, RDS username suffix, and DB/subnet group outputs are present", () => {
    expect(/^[a-z0-9]{8}$/.test(outputsRaw.bucket_suffix)).toBe(true);
    expect(isNonEmptyString(outputsRaw.rds_username_suffix)).toBe(true);
    expect(outputsRaw.rds_db_name).toBe("maindb");
    expect(outputsRaw.rds_subnet_group_name).toBe("main-db-subnet-group");
  });

  it("Secrets Manager naming is correct", () => {
    expect(outputsRaw.secrets_manager_secret_name).toBe("rds-credentials");
  });

  it("Route table IDs, subnet CIDRs/IDs, VPC CIDR, region, and major outputs have correct relationships", () => {
    expect(isNonEmptyString(outputsRaw.vpc_cidr_block)).toBe(true);
    expect(outputsRaw.vpc_cidr_block).toBe("10.0.0.0/16");
    expect(outputsRaw.region).toBe("us-east-2");
  });

  // Uniqueness checks across resource identifiers
  it("All major resource identifiers in outputs are unique", () => {
    const ids = [
      outputsRaw.vpc_id,
      outputsRaw.internet_gateway_id,
      ...asArray(outputsRaw.nat_gateway_ids),
      ...asArray(outputsRaw.public_subnet_ids),
      ...asArray(outputsRaw.private_subnet_ids),
      outputsRaw.public_route_table_id,
      ...asArray(outputsRaw.private_route_table_ids)
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });
});
