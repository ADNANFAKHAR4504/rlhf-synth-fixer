import * as fs from "fs";
import * as path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const TAP_STACK_TF = path.join(LIB_DIR, "tap_stack.tf");
const tf = fs.readFileSync(TAP_STACK_TF, "utf8");

// Helper function to test regex presence
const has = (regex: RegExp) => regex.test(tf);

describe("tap_stack.tf static verification", () => {
  it("file exists and has content over 500 chars", () => {
    expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
    expect(tf.length).toBeGreaterThan(500);
  });

  // VARIABLES
  it("declares required input variables", () => {
    [
      "environment",
      "project_name",
      "aws_region",
      "secondary_region",
      "primary_vpc_cidr",
      "secondary_vpc_cidr",
      "db_instance_class",
      "db_engine_version",
      "db_allocated_storage",
      "backup_retention_period",
      "enable_deletion_protection",
      "common_tags",
    ].forEach((variable) => {
      expect(has(new RegExp(`variable\\s+"${variable}"`))).toBe(true);
    });
  });

  // LOCALS
  it("defines locals for AZs, subnets, and tags", () => {
    expect(has(/locals\s*{/)).toBe(true);
    ["primary_azs", "secondary_azs", "primary_tags", "secondary_tags"].forEach(
      (local) => {
        expect(has(new RegExp(`${local}\\s*=`))).toBe(true);
      }
    );
  });

  // VPCs
  it("creates VPC for primary and secondary regions", () => {
    expect(has(/resource\s+"aws_vpc"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_vpc"\s+"secondary"/)).toBe(true);
  });

  // Subnets for each region
  it("creates public and private subnets in both regions", () => {
    expect(has(/resource\s+"aws_subnet"\s+"primary_public"/)).toBe(true);
    expect(has(/resource\s+"aws_subnet"\s+"primary_private"/)).toBe(true);
    expect(has(/resource\s+"aws_subnet"\s+"secondary_public"/)).toBe(true);
    expect(has(/resource\s+"aws_subnet"\s+"secondary_private"/)).toBe(true);
  });

  // NAT Gateways and EIPs
  it("creates NAT Gateways and Elastic IPs for both regions", () => {
    expect(has(/resource\s+"aws_nat_gateway"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_nat_gateway"\s+"secondary"/)).toBe(true);
    expect(has(/resource\s+"aws_eip"\s+"primary_nat"/)).toBe(true);
    expect(has(/resource\s+"aws_eip"\s+"secondary_nat"/)).toBe(true);
  });

  // Route Tables and Associations
  it("creates route tables and associations for public and private subnets", () => {
    ["primary_public", "primary_private", "secondary_public", "secondary_private"].forEach(
      (rt) => {
        expect(has(new RegExp(`resource\\s+"aws_route_table"\\s+"${rt}"`))).toBe(true);
        expect(has(new RegExp(`resource\\s+"aws_route_table_association"\\s+"${rt}"`))).toBe(true);
      }
    );
  });

  // Security Groups for RDS
  it("creates RDS security groups for both regions", () => {
    expect(has(/resource\s+"aws_security_group"\s+"primary_rds"/)).toBe(true);
    expect(has(/resource\s+"aws_security_group"\s+"secondary_rds"/)).toBe(true);
  });

  // KMS Keys
  it("creates KMS keys and aliases for primary and secondary", () => {
    expect(has(/resource\s+"aws_kms_key"\s+"primary_rds"/)).toBe(true);
    expect(has(/resource\s+"aws_kms_alias"\s+"primary_rds"/)).toBe(true);
    expect(has(/resource\s+"aws_kms_key"\s+"secondary_rds"/)).toBe(true);
    expect(has(/resource\s+"aws_kms_alias"\s+"secondary_rds"/)).toBe(true);
  });

  // RDS Instances
  it("creates RDS instances for primary and secondary regions", () => {
    expect(has(/resource\s+"aws_db_instance"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_db_instance"\s+"secondary"/)).toBe(true);
  });

  // Secrets Manager for RDS passwords
  it("creates AWS Secrets Manager secrets for RDS passwords", () => {
    expect(has(/resource\s+"aws_secretsmanager_secret"\s+"primary_db_password"/)).toBe(true);
    expect(has(/resource\s+"aws_secretsmanager_secret"\s+"secondary_db_password"/)).toBe(true);
  });

  // IAM Roles, Policies (MFA and monitoring)
  it("defines IAM roles, policies and MFA setups", () => {
    expect(has(/resource\s+"aws_iam_role"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_policy"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_group"/)).toBe(true);
  });

  // CloudWatch Log Groups (RDS and Security)
  it("creates CloudWatch log groups for RDS and security", () => {
    expect(has(/resource\s+"aws_cloudwatch_log_group"/)).toBe(true);
    expect(has(/\/aws\/security\/unauthorized/)).toBe(true);
  });


  // Outputs for essential resources
  it("declares outputs for VPCs, subnets, RDS endpoints, IAM groups, KMS and CloudTrail", () => {
    [
      "primary_vpc_id",
      "secondary_vpc_id",
      "primary_public_subnet_ids",
      "primary_private_subnet_ids",
      "secondary_public_subnet_ids",
      "secondary_private_subnet_ids",
      "primary_rds_endpoint",
      "secondary_rds_endpoint",
      "tap_users_group",
      "mfa_policy_arn",
      "cloudwatch_logs_policy_arn",
      "security_sns_topic",
      "primary_rds_kms_key_arn",
      "secondary_rds_kms_key_arn",
    ].forEach((output) => {
      expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true);
    });
  });

  // No sensitive information in outputs
  it("does not expose sensitive info in outputs", () => {
    expect(has(/output\s+.*(secret|password|access_key|secret_key)/i)).toBe(false);
  });
});
