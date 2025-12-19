import * as fs from "fs";
import * as path from "path";

const outputFile = path.resolve("cfn-outputs/flat-outputs.json");

const isNonEmptyString = (v: any) => typeof v === "string" && v.trim().length > 0;
const isValidArn = (v: string) =>
  /^arn:aws:[^:]+:[^:]*:[^:]*:[^:]*[a-zA-Z0-9/_\-]*$/.test(v.trim()) || /^arn:aws:[^:]+:[^:]*:[0-9]*:[^:]*[a-zA-Z0-9/_\-]*$/.test(v.trim());
const isValidVpcId = (v: string) => v.startsWith("vpc-");
const isValidSubnetId = (v: string) => v.startsWith("subnet-");
const isValidSGId = (v: string) => v.startsWith("sg-");
const isValidIGWId = (v: string) => v.startsWith("igw-");
const isValidNatId = (v: string) => v.startsWith("nat-");
const isValidAMIId = (v: string) => v.startsWith("ami-");
const isValidDomainName = (v: string) => /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
const isValidBucketName = (v: string) => /^[a-z0-9.-]+$/.test(v);
const isValidLogGroupName = (v: string) => v.startsWith("/aws/");
const isValidIP = (v: string) => /^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test(v);
const isValidStageName = (v: string) => typeof v === "string" && !!v.match(/^[a-zA-Z0-9-]+$/);

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
    // eslint-disable-next-line no-console
    console.warn(`Skipping tests for missing output: ${key}`);
    return true;
  }
  return false;
};

describe("Terraform flat outputs - minimal integration validation", () => {
  let outputs: Record<string, any>;

  beforeAll(() => {
    const data = fs.readFileSync(outputFile, "utf8");
    const parsed = JSON.parse(data);
    outputs = {};
    for (const [k, v] of Object.entries(parsed)) {
      outputs[k] = parseArray(v);
    }
  });

  it("has sufficient keys (at least 50)", () => {
    expect(Object.keys(outputs).length).toBeGreaterThan(50);
  });

  // === Region and Environment Info ===
  it("validates region and environment outputs", () => {
    ["primary_region", "secondary_region", "environment", "project_name"].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(isNonEmptyString(outputs[key])).toBe(true);
    });
  });

  // === VPC and Subnet IDs ===
  it("validates VPC IDs", () => {
    ["primary_vpc_id", "secondary_vpc_id"].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(isValidVpcId(outputs[key])).toBe(true);
    });
  });

  it("validates VPC CIDR blocks", () => {
    ["primary_vpc_cidr_block", "secondary_vpc_cidr_block"].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(isNonEmptyString(outputs[key])).toBe(true);
    });
  });

  it("validates subnet outputs as arrays", () => {
    [
      "primary_public_subnet_ids", "primary_private_subnet_ids",
      "secondary_public_subnet_ids", "secondary_private_subnet_ids"
    ].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      const arr = parseArray(outputs[key]);
      expect(Array.isArray(arr)).toBe(true);
      arr.forEach((id: string) => expect(isValidSubnetId(id)).toBe(true));
    });
  });

  // === Internet Gateway/NAT Gateway IDs/EIPs ===
  it("validates IGW and NAT Gateway outputs", () => {
    ["primary_internet_gateway_id", "secondary_internet_gateway_id"].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(isValidIGWId(outputs[key])).toBe(true);
    });
    ["primary_nat_gateway_ids", "secondary_nat_gateway_ids"].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      const arr = parseArray(outputs[key]);
      expect(Array.isArray(arr)).toBe(true);
      arr.forEach((id: string) => expect(isValidNatId(id)).toBe(true));
    });
    ["primary_nat_gateway_eips", "secondary_nat_gateway_eips"].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      const arr = parseArray(outputs[key]);
      expect(Array.isArray(arr)).toBe(true);
      arr.forEach((ip: string) => expect(isValidIP(ip)).toBe(true));
    });
  });

  // === Network ACL IDs ===
  it("validates network acl IDs", () => {
    ["primary_network_acl_id", "secondary_network_acl_id"].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(isNonEmptyString(outputs[key])).toBe(true);
    });
  });

  // === Security Groups ===
  it("validates security group IDs", () => {
    [
      "primary_lambda_security_group_id",
      "primary_rds_security_group_id",
      "primary_bastion_security_group_id",
      "secondary_lambda_security_group_id",
      "secondary_rds_security_group_id",
      "secondary_bastion_security_group_id"
    ].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(isValidSGId(outputs[key])).toBe(true);
    });
  });

  // === KMS Key/ARN/Alias ===
  it("validates KMS key outputs", () => {
    [
      "primary_kms_key_id",
      "primary_kms_key_arn",
      "primary_kms_alias_name",
      "secondary_kms_key_id",
      "secondary_kms_key_arn",
      "secondary_kms_alias_name"
    ].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(isNonEmptyString(outputs[key])).toBe(true);
    });
  });

  // === IAM Role/Instance Profile ===
  it("validates IAM role/profile outputs", () => {
    [
      "lambda_execution_role_arn", "lambda_execution_role_name",
      "cloudtrail_role_arn", "config_role_arn",
      "primary_bastion_role_arn", "primary_bastion_instance_profile_arn",
      "secondary_bastion_role_arn", "secondary_bastion_instance_profile_arn"
    ].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(isNonEmptyString(outputs[key])).toBe(true);
    });
  });

  // === S3 Buckets ===
  it("validates S3 bucket outputs", () => {
    [
      "app_bucket_id", "app_bucket_arn", "app_bucket_domain_name",
      "cloudtrail_bucket_id", "cloudtrail_bucket_arn",
      "config_bucket_id", "config_bucket_arn"
    ].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(isNonEmptyString(outputs[key])).toBe(true);
    });
  });

  // === RDS Outputs ===
  it("validates RDS outputs and database names/secrets", () => {
    [
      "primary_rds_database_name", "primary_rds_secret_arn", "primary_rds_secret_name",
      "primary_rds_subnet_group_name",
      "secondary_rds_database_name", "secondary_rds_secret_arn", "secondary_rds_secret_name",
      "secondary_rds_subnet_group_name"
    ].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(isNonEmptyString(outputs[key])).toBe(true);
    });
  });

  // === Lambda/AWS API Gateway ===
  it("validates Lambda and API Gateway outputs", () => {
    [
      "lambda_function_arn", "lambda_function_name", "lambda_function_invoke_arn",
      "lambda_log_group_name", "lambda_error_alarm_arn", "lambda_error_alarm_name",
      "api_gateway_id", "api_gateway_arn", "api_gateway_deployment_id", "api_gateway_execution_arn",
      "api_gateway_invoke_url", "api_gateway_resource_id", "api_gateway_stage_arn",
      "api_gateway_stage_name"
    ].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(isNonEmptyString(outputs[key])).toBe(true);
    });
    if (!skipIfMissing("api_gateway_invoke_url", outputs))
      expect(outputs["api_gateway_invoke_url"]).toMatch(/^https:\/\//);
    if (!skipIfMissing("api_gateway_stage_name", outputs))
      expect(isValidStageName(outputs["api_gateway_stage_name"])).toBe(true);
  });

  // === CloudTrail/CloudWatch/SNS/WAF ===
  it("validates CloudTrail, CloudWatch, SNS, and WAF outputs", () => {
    [
      "cloudwatch_dashboard_arn", "cloudwatch_dashboard_name",
      "sns_topic_arn", "sns_topic_name", "cloudtrail_name"
    ].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(isNonEmptyString(outputs[key])).toBe(true);
    });
    if (!skipIfMissing("waf_web_acl_name", outputs))
      expect(isNonEmptyString(outputs["waf_web_acl_name"])).toBe(true);
  });

  // === Bastion Hosts ===
  it("validates Bastion host outputs", () => {
    [
      "primary_bastion_instance_id", "primary_bastion_role_arn",
      "primary_bastion_instance_profile_arn", "primary_bastion_public_ip",
      "primary_bastion_private_ip", "primary_bastion_public_dns",
      "secondary_bastion_instance_id", "secondary_bastion_role_arn",
      "secondary_bastion_instance_profile_arn", "secondary_bastion_public_ip",
      "secondary_bastion_private_ip", "secondary_bastion_public_dns"
    ].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(isNonEmptyString(outputs[key])).toBe(true);
    });
    if (!skipIfMissing("primary_bastion_public_ip", outputs))
      expect(isValidIP(outputs["primary_bastion_public_ip"])).toBe(true);
    if (!skipIfMissing("secondary_bastion_public_ip", outputs))
      expect(isValidIP(outputs["secondary_bastion_public_ip"])).toBe(true);
  });

  // === AMI Outputs ===
  it("validates AMI outputs", () => {
    ["primary_ami_id", "primary_ami_name", "secondary_ami_id", "secondary_ami_name"].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(isNonEmptyString(outputs[key])).toBe(true);
    });
    if (!skipIfMissing("primary_ami_id", outputs))
      expect(isValidAMIId(outputs["primary_ami_id"])).toBe(true);
    if (!skipIfMissing("secondary_ami_id", outputs))
      expect(isValidAMIId(outputs["secondary_ami_id"])).toBe(true);
  });

  // === Generated Values ===
  it("validates generated usernames and bucket suffixes", () => {
    ["primary_db_username", "secondary_db_username", "bucket_suffix"].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(isNonEmptyString(outputs[key])).toBe(true);
    });
  });

  // === Account/ARN/User ===
  it("validates account outputs", () => {
    ["current_account_id", "current_arn", "current_user_id"].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(isNonEmptyString(outputs[key])).toBe(true);
    });
  });

  // === Availability Zones ===
  it("validates availability zones arrays", () => {
    ["availability_zones_primary", "availability_zones_secondary"].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      const arr = parseArray(outputs[key]);
      expect(Array.isArray(arr)).toBe(true);
      arr.forEach((az: string) => expect(az).toMatch(/^us-(east|west)-\d[a-cb]$/));
    });
  });

  // === Security: No secrets/passwords exposed ===
  it("does not expose sensitive keys", () => {
    const sensitivePatterns = [
      /password/i,
      /secret_value/i,
      /secret_string/i,
      /private_key/i,
      /access_key/i,
      /session_token/i
    ];
    const violation = Object.keys(outputs).some((k) =>
      sensitivePatterns.some((p) => p.test(k))
    );
    expect(violation).toBe(false);
  });
});
