import * as fs from "fs";
import * as path from "path";

const outputsRaw: { [key: string]: any } = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../cfn-outputs/flat-outputs.json"), "utf8")
);

// Helper: parse array-like strings or pass-through arrays
function asArray(val: any): string[] {
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return [val]; }
}
function isNonEmptyString(value: any): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

describe("Tap Stack Flat Outputs Integration Tests", () => {
  // Adapted to actual outputs present (not the sample)
  const expectedKeys = [
    "access_logs_bucket_arn",
    "access_logs_bucket_name",
    "alb_arn",
    "alb_dns_name",
    "alb_listener_arn",
    "alb_load_balancer_type",
    "alb_scheme",
    "alb_security_group_id",
    "alb_zone_id",
    "ami_creation_date",
    "ami_description",
    "ami_id",
    "ami_name",
    "ami_owner_id",
    "asg_arn",
    "asg_desired_capacity",
    "asg_health_check_type",
    "asg_max_size",
    "asg_min_size",
    "asg_name",
    "availability_zones",
    "backup_kms_alias_name",
    "backup_kms_key_arn",
    "backup_kms_key_id",
    "backup_plan_arn",
    "backup_plan_id",
    "backup_role_arn",
    "backup_selection_id",
    "backup_vault_arn",
    "backup_vault_name",
    "cloudtrail_arn",
    "cloudtrail_bucket_arn",
    "cloudtrail_bucket_name",
    "current_aws_account_id",
    "current_aws_region",
    "dynamodb_table_arn",
    "dynamodb_table_billing_mode",
    "dynamodb_table_hash_key",
    "dynamodb_table_name",
    "ec2_instance_profile_name",
    "ec2_log_group_arn",
    "ec2_log_group_name",
    "ec2_role_arn",
    "ec2_security_group_id",
    "flow_log_role_arn",
    "high_cpu_alarm_arn",
    "high_cpu_alarm_name",
    "internet_gateway_id",
    "launch_template_id",
    "launch_template_latest_version",
    "launch_template_name",
    "nat_gateway_ids",
    "nat_gateway_public_ips",
    "private_route_table_ids",
    "private_subnet_cidrs",
    "private_subnet_ids",
    "public_route_table_id",
    "public_subnet_cidrs",
    "public_subnet_ids",
    "random_suffix_b64_std",
    "random_suffix_b64_url",
    "random_suffix_dec",
    "rds_allocated_storage",
    "rds_auto_minor_version_upgrade",
    "rds_backup_retention_period",
    "rds_backup_window",
    "rds_cpu_alarm_arn",
    "rds_cpu_alarm_name",
    "rds_credentials_secret_arn",
    "rds_credentials_secret_name",
    "rds_credentials_secret_version_id",
    "rds_database_name",
    "rds_endpoint",
    "rds_engine",
    "rds_engine_version",
    "rds_instance_class",
    "rds_instance_id",
    "rds_maintenance_window",
    "rds_max_allocated_storage",
    "rds_multi_az",
    "rds_port",
    "rds_publicly_accessible",
    "rds_security_group_id",
    "rds_storage_encrypted",
    "rds_subnet_group_arn",
    "rds_subnet_group_name",
    "resource_suffix",
    "sns_topic_arn",
    "static_content_bucket_arn",
    "static_content_bucket_name",
    "static_content_bucket_versioning_status",
    "target_group_arn",
    "target_group_health_check_path",
    "target_group_health_check_port",
    "target_group_health_check_protocol",
    "target_group_name",
    "vpc_cidr_block",
    "vpc_flow_log_group_arn",
    "vpc_flow_log_group_name",
    "vpc_flow_log_id",
    "vpc_id",
    "waf_web_acl_arn",
    "waf_web_acl_capacity",
    "waf_web_acl_id"
  ];

  it("outputs contain all required flat output keys", () => {
    expectedKeys.forEach(key => {
      expect(outputsRaw).toHaveProperty(key);
    });
  });

  it("all outputs are non-empty strings", () => {
    expectedKeys.forEach(key => {
      expect(isNonEmptyString(outputsRaw[key])).toBe(true);
    });
  });

  it("availability_zones is correct array and region prefix", () => {
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

  it("major resource IDs and ARNs match conventions", () => {
    expect(outputsRaw.vpc_id).toMatch(/^vpc-[a-z0-9]+$/);
    expect(outputsRaw.internet_gateway_id).toMatch(/^igw-[a-z0-9]+$/);
    expect(outputsRaw.ec2_security_group_id).toMatch(/^sg-[a-z0-9]+$/);
    expect(outputsRaw.rds_security_group_id).toMatch(/^sg-[a-z0-9]+$/);
    expect(outputsRaw.alb_security_group_id).toMatch(/^sg-[a-z0-9]+$/);
    expect(outputsRaw.access_logs_bucket_arn).toMatch(/^arn:aws:s3:::[\w\-\.]+$/);
    expect(outputsRaw.static_content_bucket_arn).toMatch(/^arn:aws:s3:::[\w\-\.]+$/);
    expect(outputsRaw.cloudtrail_bucket_arn).toMatch(/^arn:aws:s3:::[\w\-\.]+$/);
    expect(outputsRaw.sns_topic_arn).toMatch(/^arn:aws:sns:us-east-2:[^:]+:tap-stack-alerts-[a-f0-9]+$/);
  });

  it("vpc_cidr_block matches default architecture", () => {
    expect(outputsRaw.vpc_cidr_block).toBe("10.0.0.0/16");
  });

  it("RDS database info is correct and endpoint/port match MySQL conventions", () => {
    expect(outputsRaw.rds_engine).toBe("mysql");
    expect(outputsRaw.rds_engine_version.startsWith("8.")).toBe(true);
    expect(outputsRaw.rds_database_name).toBe("tapstack");
    expect(outputsRaw.rds_port).toBe("3306");
    expect(outputsRaw.rds_endpoint).toMatch(/\.rds\.amazonaws\.com:3306$/);
  });

  it("Static content bucket versioning is enabled", () => {
    expect(outputsRaw.static_content_bucket_versioning_status).toBe("Enabled");
  });

  it("all subnet CIDRs match expected /24 blocks", () => {
    asArray(outputsRaw.public_subnet_cidrs).forEach(cidr => {
      expect(/^10\.0\.1\.0\/24$|^10\.0\.2\.0\/24$/.test(cidr)).toBe(true);
    });
    asArray(outputsRaw.private_subnet_cidrs).forEach(cidr => {
      expect(/^10\.0\.3\.0\/24$|^10\.0\.4\.0\/24$/.test(cidr)).toBe(true);
    });
  });

  it("all resource IDs and ARNs are globally unique", () => {
    const ids = [
      outputsRaw.vpc_id,
      outputsRaw.internet_gateway_id,
      outputsRaw.ec2_security_group_id,
      outputsRaw.rds_security_group_id,
      outputsRaw.alb_security_group_id,
      outputsRaw.access_logs_bucket_name,
      outputsRaw.static_content_bucket_name,
      outputsRaw.cloudtrail_bucket_name,
      ...asArray(outputsRaw.nat_gateway_ids),
      ...asArray(outputsRaw.public_subnet_ids),
      ...asArray(outputsRaw.private_subnet_ids)
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("no output exposes hardcoded AWS secrets or keys", () => {
    Object.values(outputsRaw).forEach(val => {
      expect(
        typeof val === "string" &&
        !/aws_access_key_id|aws_secret_access_key|AKIA[0-9A-Z]+/.test(val)
      ).toBe(true);
    });
  });

  it("ALB is internet-facing and application type", () => {
    expect(outputsRaw.alb_scheme).toBe("internet-facing");
    expect(outputsRaw.alb_load_balancer_type).toBe("application");
  });

  it("WAF has nonzero capacity and valid ARN", () => {
    expect(Number(outputsRaw.waf_web_acl_capacity)).toBeGreaterThan(0);
    expect(outputsRaw.waf_web_acl_arn).toMatch(/^arn:aws:wafv2:us-east-2:[^:]+:regional\/webacl\/tap-stack-waf-[a-f0-9]+\/[a-f0-9\-]+$/);
  });

  it("CloudWatch alarms and logs have expected formats", () => {
    expect(outputsRaw.high_cpu_alarm_name.startsWith("tap-stack-high-cpu")).toBe(true);
    expect(outputsRaw.rds_cpu_alarm_name.startsWith("tap-stack-rds-high-cpu")).toBe(true);
    expect(outputsRaw.ec2_log_group_name.startsWith("/aws/ec2/tap-stack")).toBe(true);
    expect(outputsRaw.vpc_flow_log_group_name.startsWith("/aws/vpc/flowlogs")).toBe(true);
  });

  it("subnet IDs match AWS conventions", () => {
    asArray(outputsRaw.public_subnet_ids).forEach(id => expect(/^subnet-[a-z0-9]+$/.test(id)).toBe(true));
    asArray(outputsRaw.private_subnet_ids).forEach(id => expect(/^subnet-[a-z0-9]+$/.test(id)).toBe(true));
  });
});
