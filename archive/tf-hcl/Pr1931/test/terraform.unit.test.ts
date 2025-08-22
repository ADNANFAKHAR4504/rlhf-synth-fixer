import * as fs from "fs";
import * as path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const TAP_STACK_TF = path.join(LIB_DIR, "tap_stack.tf");
const tf = fs.readFileSync(TAP_STACK_TF, "utf8");
const has = (regex: RegExp) => regex.test(tf);

describe("tap_stack.tf static verification", () => {
  // 1. File existence and size check
  it("exists and is a non-trivial config file", () => {
    expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
    expect(tf.length).toBeGreaterThan(1000);
  });

  // 2. Check declared variables that actually exist in tap_stack.tf
  it("declares required input variables", () => {
    ["aws_region", "allowed_ssh_cidr", "environment", "project_name"].forEach((variable) =>
      expect(has(new RegExp(`variable\\s+"${variable}"`))).toBe(true)
    );
  });

  // 3. Check locals based on your tap_stack.tf
  it("defines locals for tags, region configs, and naming conventions", () => {
    ["common_tags", "regions", "naming"].forEach((local) =>
      expect(has(new RegExp(`${local}\\s*=`))).toBe(true)
    );
  });

  // 4. Data sources actually defined
  it("declares essential data sources for AMIs and caller identity", () => {
    [
      /data\s+"aws_ami"\s+"amazon_linux_primary"/,
      /data\s+"aws_ami"\s+"amazon_linux_secondary"/,
      /data\s+"aws_caller_identity"\s+"current"/,
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // 5. KMS keys and aliases overridden for your naming
  it("declares KMS keys and aliases for encryption in both regions", () => {
    [
      /resource\s+"aws_kms_key"\s+"primary"/,
      /resource\s+"aws_kms_alias"\s+"primary"/,
      /resource\s+"aws_kms_key"\s+"secondary"/,
      /resource\s+"aws_kms_alias"\s+"secondary"/,
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // 6. Security groups declared (EC2 and RDS)
  it("declares EC2 and RDS security groups in primary and secondary regions", () => {
    [
      "ec2_primary",
      "ec2_secondary",
      "rds_primary",
      "rds_secondary",
    ].forEach((sg) => expect(has(new RegExp(`resource\\s+"aws_security_group"\\s+"${sg}"`))).toBe(true));
  });

  // 7. S3 buckets and associated configurations for primary and secondary regions
  it("manages S3 buckets, versioning, encryption, and public access block", () => {
    ["primary", "secondary"].forEach((bucket) => {
      [
        "aws_s3_bucket",
        "aws_s3_bucket_versioning",
        "aws_s3_bucket_server_side_encryption_configuration",
        "aws_s3_bucket_public_access_block",
      ].forEach((typ) => expect(has(new RegExp(`resource\\s+"${typ}"\\s+"${bucket}`))).toBe(true));
    });
  });

  // 8. IAM roles and policies for EC2 and Flow Logs (no enhanced RDS monitoring)
  it("defines IAM roles and policies for EC2 and flow logs", () => {
    [
      /resource\s+"aws_iam_role"\s+"ec2_role"/,
      /resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/,
      /resource\s+"aws_iam_role_policy"\s+"ec2_policy"/,
      /resource\s+"aws_iam_role"\s+"flow_logs"/,
      /resource\s+"aws_iam_role"\s+"flow_logs_secondary"/,
      /resource\s+"aws_iam_role_policy"\s+"flow_logs"/,
      /resource\s+"aws_iam_role_policy"\s+"flow_logs_secondary"/,
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // 9. EC2 instances declaration for primary and secondary
  it("declares EC2 instances for primary and secondary regions with encryption", () => {
    [
      /resource\s+"aws_instance"\s+"primary"/,
      /resource\s+"aws_instance"\s+"secondary"/,
      /encrypted\s+=\s*true/,
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // 10. RDS instances and subnet groups in primary and secondary
  it("declares RDS subnet groups and instances for primary and secondary", () => {
    [
      /resource\s+"aws_db_subnet_group"\s+"primary"/,
      /resource\s+"aws_db_subnet_group"\s+"secondary"/,
      /resource\s+"aws_db_instance"\s+"primary"/,
      /resource\s+"aws_db_instance"\s+"secondary"/,
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // 11. CloudWatch Log Groups (primary and secondary)
  it("creates CloudWatch log groups in primary and secondary regions", () => {
    [
      /resource\s+"aws_cloudwatch_log_group"\s+"primary_vpc_flow_logs"/,
      /resource\s+"aws_cloudwatch_log_group"\s+"secondary_vpc_flow_logs"/,
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // 12. Output declarations based on your stack
  it("declares expected outputs without sensitive info", () => {
    [
      "vpc_ids",
      "subnet_ids",
      "ec2_instance_ids",
      "ec2_instance_public_ips",
      "security_group_ids",
      "s3_bucket_names",
      "rds_endpoints",
      "iam_roles",
      "iam_instance_profile",
      "kms_key_arns",
      "ami_ids",
    ].forEach(output =>
      expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true)
    );

    // Ensure no sensitive info in outputs
    expect(has(/output\s+.*(secret|password|access_key|secret_key)/i)).toBe(false);
  });
});

