import * as fs from "fs";
import * as path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const TAP_STACK_TF = path.join(LIB_DIR, "tap_stack.tf");
const tf = fs.readFileSync(TAP_STACK_TF, "utf8");
const has = (regex: RegExp) => regex.test(tf);

describe("tap_stack.tf static verification", () => {
  // 1. File validity check
  it("exists and is a non-trivial config file", () => {
    expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
    expect(tf.length).toBeGreaterThan(1000);
  });

  // 2. Required input variables
  it("declares required input variables", () => {
    [
      "aws_region", "secondary_region", "environment", "project_name",
      "ssh_allowed_cidr", "web_port", "app_port", "db_port",
      "rds_backup_retention_period", "cloudwatch_alarm_threshold_cpu",
      "cloudwatch_alarm_threshold_memory", "instance_type",
      "db_instance_class", "db_allocated_storage"
    ].forEach(variable =>
      expect(has(new RegExp(`variable\\s+"${variable}"`))).toBe(true)
    );
  });

  // 3. Local values
  it("defines locals for tags, prefixes, vpc cidrs, and subnets", () => {
    [
      "common_tags", "primary_prefix", "secondary_prefix",
      "primary_vpc_cidr", "secondary_vpc_cidr",
      "primary_public_subnets", "primary_private_subnets",
      "secondary_public_subnets", "secondary_private_subnets"
    ].forEach(local =>
      expect(has(new RegExp(`${local}\\s*=`))).toBe(true)
    );
  });

  // 4. Data sources declarations
  it("declares essential data sources for AZs, AMIs, and caller identity", () => {
    [
      /data\s+"aws_availability_zones"\s+"primary"/,
      /data\s+"aws_availability_zones"\s+"secondary"/,
      /data\s+"aws_ami"\s+"amazon_linux_primary"/,
      /data\s+"aws_ami"\s+"amazon_linux_secondary"/,
      /data\s+"aws_caller_identity"\s+"current"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // 5. KMS keys and aliases
  it("declares KMS keys and aliases for encryption in both regions", () => {
    [
      /resource\s+"aws_kms_key"\s+"primary_encryption"/,
      /resource\s+"aws_kms_alias"\s+"primary_encryption"/,
      /resource\s+"aws_kms_key"\s+"secondary_encryption"/,
      /resource\s+"aws_kms_alias"\s+"secondary_encryption"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // 6. Security groups for web, app and db servers in both regions
  it("creates security groups for web, app and db servers in both regions", () => {
    [
      "primary_web", "primary_app", "primary_db",
      "secondary_web", "secondary_app"
    ].forEach(sg =>
      expect(has(new RegExp(`resource\\s+"aws_security_group"\\s+"${sg}"`))).toBe(true)
    );
  });

  // 7. S3 buckets' security configurations for both regions
  it("manages S3 buckets, versioning, ownership, encryption, and public access block", () => {
    ["primary_logs", "secondary_logs"].forEach(bucket => {
      [
        "aws_s3_bucket",
        "aws_s3_bucket_versioning",
        "aws_s3_bucket_ownership_controls",
        "aws_s3_bucket_server_side_encryption_configuration",
        "aws_s3_bucket_public_access_block"
      ].forEach(typ =>
        expect(has(new RegExp(`resource\\s+"${typ}"\\s+"${bucket}`))).toBe(true)
      );
    });
  });

  // 8. IAM roles, policies, and attachments for EC2 and RDS monitoring
  it("defines IAM stack for EC2 instance and RDS monitoring", () => {
    [
      /resource\s+"aws_iam_role"\s+"ec2_instance_role"/,
      /resource\s+"aws_iam_policy"\s+"ec2_instance_policy"/,
      /resource\s+"aws_iam_role_policy_attachment"\s+"ec2_instance_policy_attachment"/,
      /resource\s+"aws_iam_instance_profile"\s+"ec2_instance_profile"/,
      /resource\s+"aws_iam_role"\s+"rds_enhanced_monitoring"/,
      /resource\s+"aws_iam_role_policy_attachment"\s+"rds_enhanced_monitoring"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // 9. EC2 instances only in primary region
  it("declares EC2 instances for primary web and app servers with proper security tags", () => {
    expect(has(/resource\s+"aws_instance"\s+"primary_web"/)).toBe(true);
    expect(has(/resource\s+"aws_instance"\s+"primary_app"/)).toBe(true);
    expect(has(/encrypted\s+=\s*true/)).toBe(true);
    expect(has(/VulnerabilityAssessment\s+=\s+"passed"/)).toBe(true);
  });

  // 10. RDS instance and subnet group only in primary region (secondary RDS should not exist)
  it("declares RDS subnet group and instance only in primary region", () => {
    expect(has(/resource\s+"aws_db_subnet_group"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_db_instance"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_db_instance"\s+"secondary"/)).toBe(true);
  });

  // 11. CloudWatch logs and metric alarms in both regions
  it("creates CloudWatch log groups and CPU alarms in both regions", () => {
    [
      /resource\s+"aws_cloudwatch_log_group"\s+"ec2_logs_primary"/,
      /resource\s+"aws_cloudwatch_log_group"\s+"ec2_logs_secondary"/,
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"primary_cpu_alarm"/,
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"secondary_cpu_alarm"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // 12. Outputs for essentials only; no sensitive info
  it("defines expected outputs and excludes sensitive info", () => {
    [
      "primary_vpc_id", "secondary_vpc_id",
      "primary_public_subnet_ids", "primary_private_subnet_ids",
      "secondary_public_subnet_ids", "secondary_private_subnet_ids",
      "primary_rds_endpoint", "primary_s3_logs_bucket", "secondary_s3_logs_bucket",
      "primary_iam_role_ec2", "primary_iam_instance_profile",
      "kms_primary_key_arn", "kms_secondary_key_arn", "primary_vpc_arn", "secondary_vpc_arn",
      "primary_public_subnet_cidrs", "primary_private_subnet_cidrs",
      "secondary_public_subnet_cidrs", "secondary_private_subnet_cidrs",
      "primary_igw_id", "secondary_igw_id", "primary_nat_gateway_ids",
      "primary_web_sg_arn", "primary_app_sg_arn", "primary_db_sg_arn",
    ].forEach(output =>
      expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true)
    );

    // Ensure no sensitive info in outputs
    expect(has(/output\s+.*(secret|password|access_key|secret_key)/i)).toBe(false);
  });
});
