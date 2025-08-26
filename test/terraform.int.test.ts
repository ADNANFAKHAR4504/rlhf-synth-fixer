import * as fs from "fs";
import * as path from "path";

const outputPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");

// Utility functions
const isNonEmptyString = (val: any): boolean =>
  typeof val === "string" && val.trim().length > 0;

const isValidArn = (val: any): boolean =>
  typeof val === "string" && /^arn:aws:[a-z\-]+:[\w\-]*:\d{12}:[\w\-\/.:]+$/.test(val);

const isValidS3Arn = (val: any): boolean =>
  typeof val === "string" && /^arn:aws:s3:::[a-z0-9\-\.]+$/.test(val);

const isValidWafWebAclArn = (val: any): boolean =>
  typeof val === "string" && /^arn:aws:wafv2:(us-east-1|[a-z0-9\-]+):\d{12}:(global|regional)\/webacl\/[a-zA-Z0-9\-]+\/[a-f0-9\-]+$/.test(val);

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

const isValidIp = (val: string): boolean =>
  typeof val === "string" &&
  /^(\d{1,3}\.){3}\d{1,3}$/.test(val) &&
  val.split(".").every((x) => Number(x) >= 0 && Number(x) <= 255);

const isValidBucketName = (val: any): boolean =>
  isNonEmptyString(val) && /^[a-z0-9\-\.]+$/.test(val);

const isValidDomainName = (val: any): boolean =>
  isNonEmptyString(val) && /^[a-z0-9\-\.]+\.amazonaws\.com$/.test(val);

const parseArray = (val: any): string[] => {
  if (!val) return [];
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

  it("should expose all expected output keys", () => {
    const expectedKeys = [
      "ami_description","ami_id","ami_name","availability_zones",
      "cloudfront_distribution_arn","cloudfront_distribution_id","cloudfront_domain_name","cloudfront_origin_access_control_id",
      "cloudtrail_arn","cloudtrail_name","cloudtrail_s3_bucket_name",
      "cloudwatch_log_group_vpc_flow_log_arn","cloudwatch_log_group_vpc_flow_log_name","current_account_id","current_region",
      "database_subnet_ids","db_subnet_group_name","db_username","ec2_instance_ami_id","ec2_instance_id",
      "ec2_instance_private_ip","ec2_security_group_id","elastic_ips","elasticache_endpoint","elasticache_port",
      "elasticache_security_group_id","elasticache_subnet_group_name","environment",
      "iam_group_mfa_users_arn","iam_group_mfa_users_name","iam_instance_profile_ec2_arn","iam_instance_profile_ec2_name",
      "iam_role_cloudtrail_arn","iam_role_cloudtrail_name","iam_role_ec2_arn","iam_role_ec2_name",
      "iam_role_flow_log_arn","iam_role_flow_log_name","internet_gateway_id",
      "kms_key_cloudtrail_arn","kms_key_cloudtrail_id","kms_key_ebs_arn","kms_key_ebs_id","kms_key_rds_arn","kms_key_rds_id",
      "nat_gateway_ids","nat_gateway_public_ips","private_subnet_ids","project_name","public_subnet_ids","random_suffix",
      "rds_endpoint","rds_port","rds_security_group_id","region","s3_bucket_arn","s3_bucket_domain_name",
      "s3_bucket_name","vpc_cidr_block","vpc_flow_log_id","vpc_id","waf_web_acl_arn","waf_web_acl_id"
    ];
    expect(Object.keys(outputs).sort()).toEqual(expectedKeys.sort());
  });

  it("has valid AWS region and environment", () => {
    expect(outputs.region).toBe("us-west-2");
    expect(["Production", "Staging", "Development"]).toContain(outputs.environment);
  });

  it("vpc_id and vpc_cidr_block should be valid", () => {
    expect(isValidVpcId(outputs.vpc_id)).toBe(true);
    expect(outputs.vpc_cidr_block).toMatch(/^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/);
  });

  it("internet_gateway_id should be valid", () => {
    expect(isValidInternetGatewayId(outputs.internet_gateway_id)).toBe(true);
  });

  it("nat_gateway_ids and nat_gateway_public_ips should be non-empty arrays of valid IDs and IPs", () => {
    const natIds = parseArray(outputs.nat_gateway_ids);
    expect(natIds.length).toBeGreaterThan(0);
    natIds.forEach(id => expect(isValidNatGatewayId(id)).toBe(true));
    const natIps = parseArray(outputs.nat_gateway_public_ips);
    expect(natIps.length).toBe(natIds.length);
    natIps.forEach(ip => expect(isValidIp(ip)).toBe(true));
  });

  it("elastic_ips array should be valid IPv4 addresses", () => {
    parseArray(outputs.elastic_ips).forEach(ip => expect(isValidIp(ip)).toBe(true));
  });

  it("ec2_instance_id and ec2_instance_ami_id should be valid", () => {
    expect(isNonEmptyString(outputs.ec2_instance_id)).toBe(true);
    expect(outputs.ec2_instance_id).toMatch(/^i-[a-z0-9]+$/);
    expect(isValidAmiId(outputs.ec2_instance_ami_id)).toBe(true);
  });

  it("ec2_instance_private_ip should be valid IPv4", () => {
    expect(isValidIp(outputs.ec2_instance_private_ip)).toBe(true);
  });

  it("ec2_security_group_id should be valid", () => {
    expect(isValidSecurityGroupId(outputs.ec2_security_group_id)).toBe(true);
  });

  it("public_subnet_ids, private_subnet_ids, database_subnet_ids arrays should be valid subnet IDs", () => {
    ["public_subnet_ids", "private_subnet_ids", "database_subnet_ids"].forEach(key => {
      const arr = parseArray(outputs[key]);
      expect(arr.length).toBeGreaterThan(0);
      arr.forEach(id => expect(isValidSubnetId(id)).toBe(true));
    });
  });

  it("s3_bucket_arn, s3_bucket_name, s3_bucket_domain_name should be valid", () => {
    expect(isValidS3Arn(outputs.s3_bucket_arn)).toBe(true);
    expect(isValidBucketName(outputs.s3_bucket_name)).toBe(true);
    expect(outputs.s3_bucket_domain_name).toMatch(/\.amazonaws\.com$/);
  });

  it("cloudfront_distribution_id, domain_name and ARNs should be valid", () => {
    expect(isNonEmptyString(outputs.cloudfront_distribution_id)).toBe(true);
    expect(isValidArn(outputs.cloudfront_distribution_arn)).toBe(true);
    expect(isNonEmptyString(outputs.cloudfront_domain_name)).toBe(true);
    expect(isNonEmptyString(outputs.cloudfront_origin_access_control_id)).toBe(true);
  });

  it("waf_web_acl_id and waf_web_acl_arn should be valid", () => {
    expect(isNonEmptyString(outputs.waf_web_acl_id)).toBe(true);
    expect(isValidWafWebAclArn(outputs.waf_web_acl_arn)).toBe(true);
  });

  it("cloudtrail_name, cloudtrail_arn, cloudtrail_s3_bucket_name should be valid", () => {
    expect(isNonEmptyString(outputs.cloudtrail_name)).toBe(true);
    expect(isValidArn(outputs.cloudtrail_arn)).toBe(true);
    expect(isValidBucketName(outputs.cloudtrail_s3_bucket_name)).toBe(true);
  });

  it("cloudwatch_log_group_vpc_flow_log_name and arn should be valid", () => {
    expect(isNonEmptyString(outputs.cloudwatch_log_group_vpc_flow_log_name)).toBe(true);
    expect(isValidArn(outputs.cloudwatch_log_group_vpc_flow_log_arn)).toBe(true);
  });

  it("rds_endpoint and rds_port should be valid", () => {
    expect(isNonEmptyString(outputs.rds_endpoint)).toBe(true);
    expect(outputs.rds_endpoint).toMatch(/\.rds\.amazonaws\.com(:\d+)?$/);
    expect(outputs.rds_port).toBe("3306");
    expect(isValidSecurityGroupId(outputs.rds_security_group_id)).toBe(true);
  });

  it("elasticache_endpoint and elasticache_port should be valid", () => {
    expect(isNonEmptyString(outputs.elasticache_endpoint)).toBe(true);
    expect(outputs.elasticache_port).toMatch(/^\d+$/);
    expect(isValidSecurityGroupId(outputs.elasticache_security_group_id)).toBe(true);
  });

  it("KMS key ARNs and IDs should be valid", () => {
    ["kms_key_rds_arn", "kms_key_ebs_arn", "kms_key_cloudtrail_arn"].forEach(key => {
      expect(isValidArn(outputs[key])).toBe(true);
    });
    ["kms_key_rds_id", "kms_key_ebs_id", "kms_key_cloudtrail_id"].forEach(key => {
      expect(isNonEmptyString(outputs[key])).toBe(true);
    });
  });

  it("IAM role/group/profile ARNs and names should be valid", () => {
    [
      "iam_role_ec2_arn", "iam_role_ec2_name", "iam_role_flow_log_arn", "iam_role_flow_log_name",
      "iam_role_cloudtrail_arn", "iam_role_cloudtrail_name",
      "iam_group_mfa_users_arn", "iam_group_mfa_users_name",
      "iam_instance_profile_ec2_arn", "iam_instance_profile_ec2_name"
    ].forEach(key => {
      expect(isNonEmptyString(outputs[key])).toBe(true);
    });
    // ARNs specifically
    ["iam_role_ec2_arn", "iam_role_flow_log_arn", "iam_role_cloudtrail_arn", "iam_group_mfa_users_arn", "iam_instance_profile_ec2_arn"].forEach(key => {
      expect(isValidArn(outputs[key])).toBe(true);
    });
  });

  it("miscellaneous outputs should be valid", () => {
    expect(isNonEmptyString(outputs.db_subnet_group_name)).toBe(true);
    expect(isNonEmptyString(outputs.elasticache_subnet_group_name)).toBe(true);
    expect(isNonEmptyString(outputs.random_suffix)).toBe(true);
    expect(isNonEmptyString(outputs.ami_description)).toBe(true);
    expect(isValidAmiId(outputs.ami_id)).toBe(true);
    expect(isNonEmptyString(outputs.ami_name)).toBe(true);
    expect(isNonEmptyString(outputs.db_username)).toBe(true);
    expect(isNonEmptyString(outputs.project_name)).toBe(true);
    expect(isNonEmptyString(outputs.vpc_flow_log_id)).toBe(true);
  });
});
