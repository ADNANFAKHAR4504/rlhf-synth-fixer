// test/terraform.unit.test.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Tests Terraform configuration structure, patterns, and security requirements

import fs from 'fs';
import path from 'path';

const STACK_REL = '../lib/tap_stack.tf';
const PROVIDER_REL = '../lib/provider.tf';
const USER_DATA_REL = '../lib/user_data.sh';
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);
const userDataPath = path.resolve(__dirname, USER_DATA_REL);

describe('Terraform Infrastructure Unit Tests', () => {
  let stackContent: string;
  let providerContent: string;
  let userDataContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, 'utf8');
    providerContent = fs.readFileSync(providerPath, 'utf8');
    userDataContent = fs.readFileSync(userDataPath, 'utf8');
  });

  describe('File Existence and Structure', () => {
    test('tap_stack.tf exists', () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test('provider.tf exists', () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test('user_data.sh exists', () => {
      expect(fs.existsSync(userDataPath)).toBe(true);
    });

    test('tap_stack.tf is a single file (no external modules)', () => {
      expect(stackContent).not.toMatch(/module\s+"[^"]*"\s*{/);
    });
  });

  describe('Provider Configuration', () => {
    test('does NOT declare provider in tap_stack.tf', () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test('provider.tf has AWS provider configured', () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test('provider.tf has S3 backend configuration', () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*{/);
    });

    test('provider.tf specifies us-west-2 region', () => {
      expect(providerContent).toMatch(/region\s*=\s*"us-west-2"/);
    });
  });

  describe('Variables and Locals', () => {
    test('declares aws_region variable with us-west-2 default', () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(stackContent).toMatch(/default\s*=\s*"us-west-2"/);
    });

    test('declares project_name variable', () => {
      expect(stackContent).toMatch(/variable\s+"project_name"\s*{/);
    });

    test('declares environment variable', () => {
      expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
    });

    test('declares allowed_ingress_cidrs variable', () => {
      expect(stackContent).toMatch(/variable\s+"allowed_ingress_cidrs"\s*{/);
    });

    test('has locals block with common_tags', () => {
      expect(stackContent).toMatch(
        /locals\s*\{[\s\S]*common_tags\s*=[\s\S]*\}/
      );
    });

    test('common_tags include required fields', () => {
      expect(stackContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(stackContent).toMatch(/Project\s*=\s*var\.project_name/);
    });
  });

  describe('Data Sources', () => {
    test('declares aws_caller_identity data source', () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test('declares aws_region data source', () => {
      expect(stackContent).toMatch(/data\s+"aws_region"\s+"current"/);
    });

    test('declares aws_ssm_parameter data source for latest Amazon Linux', () => {
      expect(stackContent).toMatch(
        /data\s+"aws_ssm_parameter"\s+"amazon_linux_2023_ami"/
      );
    });
  });

  describe('KMS Resources', () => {
    test('declares KMS key resource', () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
    });

    test('declares KMS alias resource', () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
    });

    test('KMS key has key rotation enabled', () => {
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });
  });

  describe('S3 Resources', () => {
    test('declares app data S3 bucket', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"app_data"/);
    });

    test('declares access logs S3 bucket', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_s3_bucket"\s+"access_logs"/
      );
    });

    test('S3 buckets use KMS encryption', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_s3_bucket_server_side_encryption_configuration"/
      );
      expect(stackContent).toMatch(
        /kms_master_key_id\s*=\s*aws_kms_key\.main\.arn/
      );
    });

    test('S3 buckets have public access block', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_s3_bucket_public_access_block"/
      );
    });

    test('S3 bucket policies deny non-TLS connections', () => {
      expect(stackContent).toMatch(/DenyInsecureConnections/);
      expect(stackContent).toMatch(/aws:SecureTransport/);
    });
  });

  describe('VPC and Networking', () => {
    test('declares VPC resource or data source', () => {
      expect(stackContent).toMatch(/(resource|data)\s+"aws_vpc"/);
    });

    test('declares security groups', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"/);
    });

    test('security groups restrict ingress to allowed CIDRs', () => {
      expect(stackContent).toMatch(
        /cidr_blocks\s*=\s*var\.allowed_ingress_cidrs/
      );
    });

    test('declares VPC Flow Logs', () => {
      expect(stackContent).toMatch(/resource\s+"aws_flow_log"/);
    });
  });

  describe('CloudWatch and Monitoring', () => {
    test('declares CloudWatch log groups', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
    });

    test('declares CloudWatch alarms', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
    });

    test('declares CloudWatch alarm for unauthorized API calls', () => {
      expect(stackContent).toMatch(/UnauthorizedAPICalls/);
    });

    test('declares SNS topic for alarms', () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"/);
    });
  });

  describe('CloudTrail', () => {
    test('declares CloudTrail resource', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"/);
    });

    test('CloudTrail is multi-region', () => {
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test('CloudTrail has log file validation enabled', () => {
      expect(stackContent).toMatch(/enable_log_file_validation\s*=\s*true/);
    });
  });

  describe('IAM Resources', () => {
    test('declares EC2 IAM role', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
    });

    test('declares EC2 IAM policy attachment', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_iam_role_policy_attachment"\s+"ec2_ssm_core"/
      );
    });

    test('declares SSM maintenance IAM role', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_iam_role"\s+"ssm_maintenance"/
      );
    });

    test('EC2 role has SSM managed policy', () => {
      expect(stackContent).toMatch(/AmazonSSMManagedInstanceCore/);
    });
  });

  describe('RDS Resources', () => {
    test('declares RDS subnet group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"/);
    });

    test('declares RDS instance', () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
    });

    test('RDS instance is Multi-AZ', () => {
      expect(stackContent).toMatch(/multi_az\s*=\s*true/);
    });

    test('RDS instance has encryption enabled', () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test('RDS instance is not publicly accessible', () => {
      expect(stackContent).toMatch(/publicly_accessible\s*=\s*false/);
    });
  });

  describe('EC2 Resources', () => {
    test('declares EC2 instance', () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"/);
    });

    test('EC2 instance uses latest AMI', () => {
      expect(stackContent).toMatch(
        /ami\s*=\s*data\.aws_ssm_parameter\.amazon_linux_2023_ami\.value/
      );
    });

    test('EC2 instance has IMDSv2 enabled', () => {
      expect(stackContent).toMatch(/metadata_options\s*\{/);
      expect(stackContent).toMatch(/http_tokens\s*=\s*"required"/);
    });
  });

  describe('SSM Patch Manager', () => {
    test('declares SSM maintenance window', () => {
      expect(stackContent).toMatch(/resource\s+"aws_ssm_maintenance_window"/);
    });

    test('declares SSM maintenance window task', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_ssm_maintenance_window_task"/
      );
    });

    test('SSM maintenance window task uses patch baseline', () => {
      expect(stackContent).toMatch(/task_arn\s*=\s*"AWS-RunPatchBaseline"/);
    });
  });

  describe('Outputs', () => {
    test('declares KMS key ARN output', () => {
      expect(stackContent).toMatch(/output\s+"kms_key_arn"/);
    });

    test('declares S3 bucket outputs', () => {
      expect(stackContent).toMatch(/output\s+"s3_access_logs_bucket"/);
    });

    test('declares RDS endpoint output', () => {
      expect(stackContent).toMatch(/output\s+"rds_endpoint"/);
    });

    test('declares CloudTrail ARN output', () => {
      expect(stackContent).toMatch(/output\s+"cloudtrail_arn"/);
    });
  });

  describe('Security and Compliance', () => {
    test('region guard enforces us-west-2', () => {
      expect(stackContent).toMatch(
        /resource\s+"null_resource"\s+"region_guard"/
      );
      expect(stackContent).toMatch(/us-west-2/);
    });

    test('all resources have proper tags', () => {
      expect(stackContent).toMatch(/tags\s*=\s*local\.common_tags/);
    });

    test('IAM roles have proper assume role policies', () => {
      expect(stackContent).toMatch(/assume_role_policy\s*=\s*jsonencode/);
    });
  });

  describe('User Data Script', () => {
    test('user_data.sh exists and has content', () => {
      expect(userDataContent.length).toBeGreaterThan(0);
    });

    test('user_data.sh updates system packages', () => {
      expect(userDataContent).toMatch(/yum update -y/);
    });

    test('user_data.sh installs required packages', () => {
      expect(userDataContent).toMatch(/yum install -y/);
    });

    test('user_data.sh configures CloudWatch agent', () => {
      expect(userDataContent).toMatch(/amazon-cloudwatch-agent/);
    });
  });
});

