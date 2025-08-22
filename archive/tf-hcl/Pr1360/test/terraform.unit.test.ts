// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from 'fs';
import path from 'path';

describe('Terraform unit tests for lib/tap_stack.tf', () => {
  const tfPath = path.resolve(__dirname, '../lib/tap_stack.tf');
  let src = '';
  let oneLine = '';

  beforeAll(() => {
    src = fs.readFileSync(tfPath, 'utf8');
    oneLine = src.replace(/\s+/g, ' ').trim();
  });

  describe('File existence and basic constraints', () => {
    test('tap_stack.tf exists and is non-empty', () => {
      expect(fs.existsSync(tfPath)).toBe(true);
      expect(src.length).toBeGreaterThan(1000);
    });

    test('No provider blocks present in tap_stack.tf (provider is in provider.tf)', () => {
      expect(src).not.toMatch(/\bprovider\s+"aws"/);
      expect(src).not.toMatch(/terraform\s*\{/);
    });
  });

  describe('Variables and validations', () => {
    test('Required variables declared', () => {
      const vars = [
        'variable "aws_region"',
        'variable "environment"',
        'variable "project"',
        'variable "owner"',
        'variable "allowed_ssh_cidrs"',
        'variable "api_access_log_retention_days"',
        'variable "vpc_flow_log_retention_days"',
        'variable "rds_engine"',
        'variable "rds_instance_class"',
        'variable "rds_allocated_storage"',
        'variable "rds_backup_retention_days"',
        'variable "rds_deletion_protection"',
        'variable "deploy_ec2"',
        'variable "use_cmk"',
        'variable "s3_data_retention_days"',
        'variable "s3_logs_retention_days"',
      ];
      for (const v of vars) expect(src).toMatch(new RegExp(v));
    });

    test('environment validation restricts to prod/dev', () => {
      expect(oneLine).toMatch(
        /variable\s+"environment"[\s\S]*?validation\s*\{[\s\S]*?contains\(\["prod",\s*"dev"\]/
      );
    });

    test('locals include common_tags and name_prefix with environment and project', () => {
      expect(oneLine).toMatch(
        /locals\s*\{[\s\S]*name_prefix\s*=\s*"\$\{var\.environment}-\$\{var\.project}"/
      );
      expect(oneLine).toMatch(
        /common_tags\s*=\s*\{[\s\S]*Environment\s*=\s*var\.environment[\s\S]*Project\s*=\s*var\.project[\s\S]*Owner\s*=\s*var\.owner[\s\S]*}/
      );
    });
  });

  describe('KMS (optional) and IAM password policy', () => {
    test('Optional KMS key and alias guarded by use_cmk', () => {
      expect(oneLine).toMatch(
        /resource\s+"aws_kms_key"\s+"main"\s*\{\s*count\s*=\s*var\.use_cmk\s*\?/
      );
      expect(oneLine).toMatch(
        /resource\s+"aws_kms_alias"\s+"main"\s*\{\s*count\s*=\s*var\.use_cmk\s*\?/
      );
    });

    test('IAM account password policy is strict', () => {
      expect(oneLine).toMatch(
        /resource\s+"aws_iam_account_password_policy"\s+"strict"/
      );
      expect(oneLine).toMatch(/minimum_password_length\s*=\s*14/);
      expect(oneLine).toMatch(/require_symbols\s*=\s*true/);
    });
  });

  describe('Networking (VPC, subnets, NAT, routes)', () => {
    test('VPC and IGW present', () => {
      expect(src).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(src).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test('Two public and two private subnets', () => {
      expect(oneLine).toMatch(
        /resource\s+"aws_subnet"\s+"public"\s*\{[^}]*count\s*=\s*2/
      );
      expect(oneLine).toMatch(
        /resource\s+"aws_subnet"\s+"private"\s*\{[^}]*count\s*=\s*2/
      );
    });

    test('Two NAT gateways with EIPs in public subnets and route tables configured', () => {
      expect(oneLine).toMatch(
        /resource\s+"aws_eip"\s+"nat"\s*\{[^}]*count\s*=\s*2/
      );
      expect(oneLine).toMatch(
        /resource\s+"aws_nat_gateway"\s+"main"\s*\{[^}]*count\s*=\s*2/
      );
      expect(oneLine).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(oneLine).toMatch(
        /resource\s+"aws_route_table"\s+"private"\s*\{[^}]*count\s*=\s*2/
      );
      expect(oneLine).toMatch(
        /resource\s+"aws_route_table_association"\s+"public"\s*\{[^}]*count\s*=\s*2/
      );
      expect(oneLine).toMatch(
        /resource\s+"aws_route_table_association"\s+"private"\s*\{[^}]*count\s*=\s*2/
      );
    });
  });

  describe('Security groups', () => {
    test('web, app, rds security groups exist', () => {
      expect(src).toMatch(/resource\s+"aws_security_group"\s+"web"/);
      expect(src).toMatch(/resource\s+"aws_security_group"\s+"app"/);
      expect(src).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
    });

    test('web allows 80/443, app allows SSH optionally and 8080 from web, rds allows DB from app', () => {
      expect(oneLine).toMatch(
        /web[\s\S]*ingress[\s\S]*from_port\s*=\s*443[\s\S]*ingress[\s\S]*from_port\s*=\s*80/
      );
      expect(oneLine).toMatch(/app[\s\S]*dynamic\s+"ingress"/);
      expect(oneLine).toMatch(
        /app[\s\S]*ingress[\s\S]*from_port\s*=\s*8080[\s\S]*security_groups\s*=\s*\[aws_security_group\.web\.id]/
      );
      expect(oneLine).toMatch(
        /rds[\s\S]*ingress[\s\S]*security_groups\s*=\s*\[aws_security_group\.app\.id]/
      );
    });
  });

  describe('Logging and monitoring', () => {
    test('CloudWatch Log Groups for VPC Flow Logs and API Gateway', () => {
      expect(src).toMatch(
        /resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs"/
      );
      expect(src).toMatch(
        /resource\s+"aws_cloudwatch_log_group"\s+"api_gateway"/
      );
    });

    test('VPC Flow Logs role, policy, and flow log configured', () => {
      expect(src).toMatch(/resource\s+"aws_iam_role"\s+"vpc_flow_logs"/);
      expect(src).toMatch(/resource\s+"aws_iam_role_policy"\s+"vpc_flow_logs"/);
      expect(src).toMatch(/resource\s+"aws_flow_log"\s+"vpc"/);
    });
  });

  describe('S3 buckets (logs/data) with security controls', () => {
    test('Buckets exist with versioning and SSE', () => {
      expect(src).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
      expect(src).toMatch(/resource\s+"aws_s3_bucket"\s+"data"/);
      expect(src).toMatch(/aws_s3_bucket_versioning"\s+"logs"/);
      expect(src).toMatch(/aws_s3_bucket_versioning"\s+"data"/);
      expect(src).toMatch(
        /aws_s3_bucket_server_side_encryption_configuration"\s+"logs"/
      );
      expect(src).toMatch(
        /aws_s3_bucket_server_side_encryption_configuration"\s+"data"/
      );
    });

    test('Public access blocks and TLS-only policies in place', () => {
      expect(src).toMatch(/aws_s3_bucket_public_access_block"\s+"logs"/);
      expect(src).toMatch(/aws_s3_bucket_public_access_block"\s+"data"/);
      expect(src).toMatch(/DenyInsecureConnections/);
    });

    test('Lifecycle rules include transitions and expiration', () => {
      expect(src).toMatch(/aws_s3_bucket_lifecycle_configuration"\s+"logs"/);
      expect(src).toMatch(/aws_s3_bucket_lifecycle_configuration"\s+"data"/);
      expect(src).toMatch(/transition[\s\S]*STANDARD_IA/);
      expect(src).toMatch(/transition[\s\S]*GLACIER/);
    });
  });

  describe('RDS', () => {
    test('DB subnet group and instance exist, encrypted, private, with backups', () => {
      expect(src).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
      expect(src).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(oneLine).toMatch(/storage_encrypted\s*=\s*true/);
      expect(oneLine).toMatch(/publicly_accessible\s*=\s*false/);
      expect(oneLine).toMatch(
        /backup_retention_period\s*=\s*var\.rds_backup_retention_days/
      );
    });
  });

  describe('EC2 (optional)', () => {
    test('Role, policy, instance profile, and instance with secure metadata options', () => {
      expect(src).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
      expect(src).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"/);
      expect(src).toMatch(
        /resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/
      );
      expect(src).toMatch(/resource\s+"aws_instance"\s+"app"/);
      expect(oneLine).toMatch(
        /metadata_options\s*\{[\s\S]*http_tokens\s*=\s*"required"[\s\S]*}/
      );
    });
  });

  describe('API Gateway and CloudTrail', () => {
    test('API Gateway with stage access log settings', () => {
      expect(src).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"main"/);
      expect(src).toMatch(/resource\s+"aws_api_gateway_stage"\s+"main"/);
      // Accept either static block or dynamic block guarded by a flag
      expect(oneLine).toMatch(
        /(access_log_settings\s*\{|dynamic\s+"access_log_settings"\s*\{)[\s\S]*destination_arn[\s\S]*format\s*=\s*jsonencode\(/
      );
    });

    test('CloudTrail delivering to logs bucket', () => {
      expect(src).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
      expect(oneLine).toMatch(
        /s3_bucket_name\s*=\s*aws_s3_bucket\.logs\.bucket/
      );
      expect(oneLine).toMatch(/is_multi_region_trail\s*=\s*true/);
    });
  });

  describe('AWS Config and GuardDuty', () => {
    test('Config recorder, delivery channel, status, and managed rules', () => {
      expect(src).toMatch(
        /resource\s+"aws_config_configuration_recorder"\s+"main"/
      );
      expect(src).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"/);
      expect(src).toMatch(
        /resource\s+"aws_config_configuration_recorder_status"\s+"main"/
      );
      const rules = [
        's3_sse',
        'cloudtrail_enabled',
        'encrypted_volumes',
        'restricted_ssh',
        'vpc_flow_logs',
      ];
      for (const r of rules)
        expect(src).toMatch(
          new RegExp(`resource\\s+"aws_config_config_rule"\\s+"${r}"`)
        );
      // Ensure each uses a proper multi-line source block
      expect(oneLine).toMatch(
        /aws_config_config_rule"\s+"s3_sse"[\s\S]*source\s*\{[\s\S]*source_identifier\s*=\s*"S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"/
      );
    });

    test('GuardDuty detector enabled', () => {
      expect(oneLine).toMatch(
        /resource\s+"aws_guardduty_detector"\s+"main"[\s\S]*enable\s*=\s*true/
      );
    });
  });

  describe('Outputs', () => {
    test('All required outputs exist with correct references', () => {
      const outputs = [
        'output "vpc_id"',
        'output "public_subnet_ids"',
        'output "private_subnet_ids"',
        'output "web_sg_id"',
        'output "app_sg_id"',
        'output "rds_sg_id"',
        'output "rds_endpoint"',
        'output "logs_bucket_name"',
        'output "logs_bucket_arn"',
        'output "data_bucket_name"',
        'output "data_bucket_arn"',
        'output "cloudtrail_arn"',
        'output "cloudtrail_home_region"',
        'output "config_recorder_name"',
        'output "config_delivery_name"',
        'output "guardduty_detector_id"',
        'output "api_gateway_id"',
        'output "api_gateway_stage"',
        'output "api_gateway_invoke_url"',
      ];
      for (const o of outputs) expect(src).toMatch(new RegExp(o));
      expect(oneLine).toMatch(
        /api_gateway_invoke_url[\s\S]*https:\/\/\$\{aws_api_gateway_rest_api\.main\.id}\.(?:execute-api)\./
      );
    });
  });
});
