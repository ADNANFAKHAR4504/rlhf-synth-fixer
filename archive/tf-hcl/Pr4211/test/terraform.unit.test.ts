// tests/unit/unit-tests.ts
// Comprehensive unit tests for Terraform security infrastructure
// Tests validate all security best practices and required resources

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const VARIABLES_REL = "../lib/variables.tf";

const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);
const variablesPath = path.resolve(__dirname, VARIABLES_REL);

describe("Terraform Security Infrastructure - Unit Tests", () => {
  let stackContent: string;
  let providerContent: string;
  let variablesContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
    variablesContent = fs.readFileSync(variablesPath, "utf8");
  });

  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test("variables.tf exists", () => {
      expect(fs.existsSync(variablesPath)).toBe(true);
    });

    test("does NOT declare provider in tap_stack.tf", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("declares aws_region variable in variables.tf", () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
    });
  });

  describe("Provider Configuration", () => {
    test("configures AWS provider", () => {
      expect(providerContent).toContain('provider "aws"');
      expect(providerContent).toContain('hashicorp/aws');
    });

    test("configures random provider", () => {
      expect(providerContent).toContain('hashicorp/random');
    });

    test("configures archive provider", () => {
      expect(providerContent).toContain('hashicorp/archive');
    });

    test("uses us-west-2 as default region", () => {
      expect(variablesContent).toContain('us-west-2');
    });
  });

  describe("KMS Encryption", () => {
    test("creates KMS key with rotation enabled", () => {
      expect(stackContent).toContain('resource "aws_kms_key" "main"');
      expect(stackContent).toContain('enable_key_rotation     = true');
      expect(stackContent).toContain('SecCFN Master Encryption Key');
    });

    test("creates KMS alias", () => {
      expect(stackContent).toContain('resource "aws_kms_alias" "main"');
      expect(stackContent).toContain('alias/SecCFN-master-key');
    });

    test("has KMS policy for CloudTrail", () => {
      expect(stackContent).toContain('cloudtrail.amazonaws.com');
      expect(stackContent).toContain('kms:GenerateDataKey');
    });

    test("has KMS policy for Config", () => {
      expect(stackContent).toContain('config.amazonaws.com');
      expect(stackContent).toContain('kms:Decrypt');
    });

    test("has KMS policy for CloudWatch Logs", () => {
      expect(stackContent).toContain('logs.amazonaws.com');
      expect(stackContent).toContain('kms:Encrypt');
    });
  });

  describe("S3 Bucket Security", () => {
    test("creates S3 bucket for logs", () => {
      expect(stackContent).toContain('resource "aws_s3_bucket" "logs"');
      expect(stackContent).toContain('seccfn-logs-');
    });

    test("enables versioning", () => {
      expect(stackContent).toContain('resource "aws_s3_bucket_versioning" "logs"');
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("enables KMS encryption", () => {
      expect(stackContent).toContain('resource "aws_s3_bucket_server_side_encryption_configuration" "logs"');
      expect(stackContent).toContain('sse_algorithm     = "aws:kms"');
    });

    test("blocks all public access", () => {
      expect(stackContent).toContain('resource "aws_s3_bucket_public_access_block" "logs"');
      expect(stackContent).toContain('block_public_acls       = true');
      expect(stackContent).toContain('block_public_policy     = true');
      expect(stackContent).toContain('ignore_public_acls      = true');
      expect(stackContent).toContain('restrict_public_buckets = true');
    });

    test("has lifecycle policy", () => {
      expect(stackContent).toContain('resource "aws_s3_bucket_lifecycle_configuration" "logs"');
      expect(stackContent).toContain('STANDARD_IA');
      expect(stackContent).toContain('GLACIER');
    });

    test("allows CloudTrail access", () => {
      expect(stackContent).toContain('AWSCloudTrailAclCheck');
      expect(stackContent).toContain('AWSCloudTrailWrite');
    });

    test("allows Config access", () => {
      expect(stackContent).toContain('AWSConfigBucketPermissionsCheck');
      expect(stackContent).toContain('AWSConfigBucketDelivery');
    });
  });

  describe("VPC and Networking", () => {
    test("creates VPC with DNS support", () => {
      expect(stackContent).toContain('resource "aws_vpc" "main"');
      expect(stackContent).toContain('cidr_block           = "10.0.0.0/16"');
      expect(stackContent).toContain('enable_dns_hostnames = true');
    });

    test("creates Internet Gateway", () => {
      expect(stackContent).toContain('resource "aws_internet_gateway" "main"');
    });

    test("creates public subnets", () => {
      expect(stackContent).toContain('resource "aws_subnet" "public"');
      expect(stackContent).toMatch(/count\s*=\s*2/);
      expect(stackContent).toContain('map_public_ip_on_launch = true');
    });

    test("creates private subnets", () => {
      expect(stackContent).toContain('resource "aws_subnet" "private"');
    });

    test("creates NAT Gateways", () => {
      expect(stackContent).toContain('resource "aws_nat_gateway" "main"');
    });

    test("creates EIPs for NAT", () => {
      expect(stackContent).toContain('resource "aws_eip" "nat"');
    });

    test("creates route tables", () => {
      expect(stackContent).toContain('resource "aws_route_table" "public"');
      expect(stackContent).toContain('resource "aws_route_table" "private"');
    });

    test("creates Network ACLs", () => {
      expect(stackContent).toContain('resource "aws_network_acl" "main"');
    });
  });

  describe("Security Groups", () => {
    test("creates Lambda security group", () => {
      expect(stackContent).toContain('resource "aws_security_group" "lambda"');
      expect(stackContent).toContain('SecCFN-Lambda-SG');
    });

    test("creates RDS security group", () => {
      expect(stackContent).toContain('resource "aws_security_group" "rds"');
      expect(stackContent).toContain('SecCFN-RDS-SG');
    });

    test("creates security group rules separately", () => {
      expect(stackContent).toContain('resource "aws_security_group_rule" "lambda_to_rds"');
      expect(stackContent).toContain('resource "aws_security_group_rule" "rds_from_lambda"');
    });
  });

  describe("IAM Roles and Policies", () => {
    test("creates Lambda IAM role", () => {
      expect(stackContent).toContain('resource "aws_iam_role" "lambda"');
      expect(stackContent).toContain('SecCFN-Lambda-Role');
    });

    test("creates Lambda policy with least privilege", () => {
      expect(stackContent).toContain('resource "aws_iam_role_policy" "lambda"');
      expect(stackContent).toContain('logs:CreateLogGroup');
      expect(stackContent).toContain('ec2:CreateNetworkInterface');
    });

    test("creates Config IAM role", () => {
      expect(stackContent).toContain('resource "aws_iam_role" "config"');
    });

    test("attaches managed Config policy", () => {
      expect(stackContent).toContain('resource "aws_iam_role_policy_attachment" "config"');
    });

    test("creates CloudTrail IAM role", () => {
      expect(stackContent).toContain('resource "aws_iam_role" "cloudtrail"');
    });
  });

  describe("CloudWatch Logs", () => {
    test("creates Lambda log group", () => {
      expect(stackContent).toContain('resource "aws_cloudwatch_log_group" "lambda"');
      expect(stackContent).toContain('/aws/lambda/SecCFN-Function');
    });

    test("creates CloudTrail log group", () => {
      expect(stackContent).toContain('resource "aws_cloudwatch_log_group" "cloudtrail"');
      expect(stackContent).toContain('/aws/cloudtrail/SecCFN-Trail');
    });

    test("encrypts log groups with KMS", () => {
      const kmsMatches = stackContent.match(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/g);
      expect(kmsMatches).not.toBeNull();
      expect(kmsMatches!.length).toBeGreaterThan(3);
    });
  });

  describe("RDS Database", () => {
    test("creates DB subnet group", () => {
      expect(stackContent).toContain('resource "aws_db_subnet_group" "main"');
    });

    test("generates random password", () => {
      expect(stackContent).toContain('resource "random_password" "rds"');
      expect(stackContent).toMatch(/length\s*=\s*32/);
    });

    test("stores password in Secrets Manager", () => {
      expect(stackContent).toContain('resource "aws_secretsmanager_secret" "rds"');
    });

    test("creates PostgreSQL instance", () => {
      expect(stackContent).toContain('resource "aws_db_instance" "main"');
      expect(stackContent).toContain('engine         = "postgres"');
    });

    test("enables encryption", () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("configures backups", () => {
      expect(stackContent).toContain('backup_retention_period = 7');
    });

    test("disables deletion protection for testing", () => {
      expect(stackContent).toContain('deletion_protection = false');
      expect(stackContent).toContain('skip_final_snapshot = true');
    });
  });

  describe("AWS Config", () => {
    test("creates Config recorder", () => {
      expect(stackContent).toContain('resource "aws_config_configuration_recorder" "main"');
      expect(stackContent).toContain('all_supported                 = true');
    });

    test("creates delivery channel", () => {
      expect(stackContent).toContain('resource "aws_config_delivery_channel" "main"');
    });

    test("enables recorder", () => {
      expect(stackContent).toContain('resource "aws_config_configuration_recorder_status" "main"');
      expect(stackContent).toContain('is_enabled = true');
    });

    test("creates S3 public read rule", () => {
      expect(stackContent).toContain('resource "aws_config_config_rule" "s3_public_read_prohibited"');
    });

    test("creates RDS encryption rule", () => {
      expect(stackContent).toContain('resource "aws_config_config_rule" "rds_encryption"');
    });

    test("creates CloudTrail enabled rule", () => {
      expect(stackContent).toContain('resource "aws_config_config_rule" "cloudtrail_enabled"');
    });

    test("creates root MFA rule", () => {
      expect(stackContent).toContain('resource "aws_config_config_rule" "root_mfa"');
    });
  });

  describe("CloudTrail", () => {
    test("creates multi-region trail", () => {
      expect(stackContent).toContain('resource "aws_cloudtrail" "main"');
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test("enables logging", () => {
      expect(stackContent).toMatch(/enable_logging\s*=\s*true/);
    });

    test("includes global events", () => {
      expect(stackContent).toMatch(/include_global_service_events\s*=\s*true/);
    });

    test("configures event selectors", () => {
      expect(stackContent).toContain('event_selector');
      expect(stackContent).toContain('AWS::S3::Object');
      expect(stackContent).toContain('AWS::Lambda::Function');
    });

    test("creates event data store", () => {
      expect(stackContent).toContain('resource "aws_cloudtrail_event_data_store" "main"');
    });
  });

  describe("Monitoring and Alerts", () => {
    test("creates SNS topic", () => {
      expect(stackContent).toContain('resource "aws_sns_topic" "alerts"');
      expect(stackContent).toContain('SecCFN-Alerts');
    });

    test("creates SNS topic policy", () => {
      expect(stackContent).toContain('resource "aws_sns_topic_policy" "alerts"');
    });

    test("creates root account usage alarm", () => {
      expect(stackContent).toContain('resource "aws_cloudwatch_metric_alarm" "root_account_usage"');
    });

    test("creates root account metric filter", () => {
      expect(stackContent).toContain('resource "aws_cloudwatch_log_metric_filter" "root_account_usage"');
    });

    test("creates unauthorized API calls alarm", () => {
      expect(stackContent).toContain('resource "aws_cloudwatch_metric_alarm" "unauthorized_api_calls"');
    });

    test("creates unauthorized API metric filter", () => {
      expect(stackContent).toContain('resource "aws_cloudwatch_log_metric_filter" "unauthorized_api_calls"');
    });

    test("creates config compliance alarm", () => {
      expect(stackContent).toContain('resource "aws_cloudwatch_metric_alarm" "config_compliance"');
    });
  });

  describe("Outputs", () => {
    test("outputs KMS key ARN", () => {
      expect(stackContent).toContain('output "kms_key_arn"');
    });

    test("outputs S3 bucket name", () => {
      expect(stackContent).toContain('output "s3_bucket_name"');
    });

    test("outputs IAM role ARN", () => {
      expect(stackContent).toContain('output "iam_role_arn"');
    });

    test("outputs RDS endpoint", () => {
      expect(stackContent).toContain('output "rds_endpoint"');
    });

    test("outputs SNS topic ARN", () => {
      expect(stackContent).toContain('output "sns_topic_arn"');
    });
  });

  describe("Tagging", () => {
    test("defines common tags", () => {
      expect(stackContent).toContain('locals {');
      expect(stackContent).toContain('common_tags');
      expect(stackContent).toContain('Environment = "Production"');
      expect(stackContent).toContain('Project     = "SecCFN"');
    });

    test("applies tags throughout", () => {
      expect(stackContent).toMatch(/tags\s*=\s*local\.common_tags/);
    });
  });

  describe("Security Best Practices", () => {
    test("no hardcoded credentials", () => {
      expect(stackContent).not.toMatch(/password\s*=\s*["'][^$]/i);
      expect(stackContent).not.toMatch(/access_key\s*=\s*["']/i);
    });

    test("uses KMS encryption extensively", () => {
      const kmsCount = (stackContent.match(/kms_key_id|kms_key_arn|kms_master_key_id/g) || []).length;
      expect(kmsCount).toBeGreaterThan(5);
    });

    test("no retain policies", () => {
      expect(stackContent).not.toContain('prevent_destroy = true');
      expect(stackContent).toContain('force_destroy = true');
    });

    test("uses SecCFN naming convention", () => {
      const secCFNCount = (stackContent.match(/SecCFN/g) || []).length;
      expect(secCFNCount).toBeGreaterThan(10);
    });
  });
});
