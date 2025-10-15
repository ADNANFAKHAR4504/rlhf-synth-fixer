// test/terraform.unit.test.ts
// Comprehensive unit tests for Terraform infrastructure defined in lib/tap_stack.tf
// Tests validate security configuration, compliance, and AWS best practices

import fs from "fs";
import path from "path";

const TAP_STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");

describe("Terraform Infrastructure Unit Tests - Security Configuration", () => {
  let tapStackContent: string;

  beforeAll(() => {
    tapStackContent = fs.readFileSync(TAP_STACK_PATH, "utf8");
  });

  describe("File Structure and Terraform Configuration", () => {
    test("tap_stack.tf file exists", () => {
      expect(fs.existsSync(TAP_STACK_PATH)).toBe(true);
    });

    test("tap_stack.tf is not empty", () => {
      expect(tapStackContent.length).toBeGreaterThan(0);
    });

    test("contains terraform configuration block", () => {
      expect(tapStackContent).toMatch(/terraform\s*\{/);
      expect(tapStackContent).toMatch(/required_version/);
      expect(tapStackContent).toMatch(/required_providers/);
    });

    test("contains AWS provider configuration", () => {
      expect(tapStackContent).toMatch(/provider\s+"aws"/);
      expect(tapStackContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test("contains backend configuration for state management", () => {
      expect(tapStackContent).toMatch(/backend\s+"s3"\s*\{\}/);
    });

    test("uses correct Terraform version", () => {
      expect(tapStackContent).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
    });

    test("uses correct AWS provider version", () => {
      expect(tapStackContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });

    test("includes random provider for password generation", () => {
      expect(tapStackContent).toMatch(/random/);
      expect(tapStackContent).toMatch(/hashicorp\/random/);
    });
  });

  describe("Variables Configuration", () => {
    test("defines environment variable", () => {
      expect(tapStackContent).toMatch(/variable\s+"environment"/);
    });

    test("defines project_name variable", () => {
      expect(tapStackContent).toMatch(/variable\s+"project_name"/);
      expect(tapStackContent).toMatch(/default\s*=\s*"secure-infra"/);
    });

    test("defines aws_region variable", () => {
      expect(tapStackContent).toMatch(/variable\s+"aws_region"/);
      expect(tapStackContent).toMatch(/default\s*=\s*"us-east-1"/);
    });

    test("defines secondary_regions for multi-region deployment", () => {
      expect(tapStackContent).toMatch(/variable\s+"secondary_regions"/);
      expect(tapStackContent).toMatch(/type\s*=\s*list\(string\)/);
    });

    test("defines vpc_cidr variable", () => {
      expect(tapStackContent).toMatch(/variable\s+"vpc_cidr"/);
      expect(tapStackContent).toMatch(/default\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("defines availability_zones variable", () => {
      expect(tapStackContent).toMatch(/variable\s+"availability_zones"/);
    });

    test("defines db_instance_class variable", () => {
      expect(tapStackContent).toMatch(/variable\s+"db_instance_class"/);
    });

    test("defines enable_shield_advanced variable", () => {
      expect(tapStackContent).toMatch(/variable\s+"enable_shield_advanced"/);
      expect(tapStackContent).toMatch(/type\s*=\s*bool/);
    });

    test("defines common_tags variable", () => {
      expect(tapStackContent).toMatch(/variable\s+"common_tags"/);
      expect(tapStackContent).toMatch(/type\s*=\s*map\(string\)/);
    });
  });

  describe("Data Sources", () => {
    test("uses aws_caller_identity data source", () => {
      expect(tapStackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test("uses aws_region data source", () => {
      expect(tapStackContent).toMatch(/data\s+"aws_region"\s+"current"/);
    });

    test("defines IAM assume role policy document", () => {
      expect(tapStackContent).toMatch(/data\s+"aws_iam_policy_document"\s+"assume_role"/);
    });
  });

  describe("KMS Encryption Configuration", () => {
    test("creates main KMS key with rotation enabled", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
      expect(tapStackContent).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(tapStackContent).toMatch(/deletion_window_in_days\s*=\s*30/);
    });

    test("creates KMS alias for main key", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
      expect(tapStackContent).toMatch(/target_key_id\s*=\s*aws_kms_key\.main\.key_id/);
    });

    test("creates dedicated CloudTrail KMS key", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_key"\s+"cloudtrail"/);
      expect(tapStackContent).toMatch(/description\s*=\s*"KMS key for CloudTrail encryption"/);
    });

    test("CloudTrail KMS key has proper policy", () => {
      expect(tapStackContent).toMatch(/policy\s*=\s*jsonencode/);
      expect(tapStackContent).toMatch(/cloudtrail\.amazonaws\.com/);
      expect(tapStackContent).toMatch(/GenerateDataKey/);
      expect(tapStackContent).toMatch(/DescribeKey/);
    });

    test("KMS keys have appropriate deletion window", () => {
      const matches = tapStackContent.match(/deletion_window_in_days\s*=\s*30/g);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("VPC and Networking", () => {
    test("creates VPC with correct configuration", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(tapStackContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
      expect(tapStackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(tapStackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("enables IPv6 for VPC", () => {
      expect(tapStackContent).toMatch(/assign_generated_ipv6_cidr_block\s*=\s*true/);
    });

    test("creates VPC Flow Logs", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_flow_log"\s+"main"/);
      expect(tapStackContent).toMatch(/traffic_type\s*=\s*"ALL"/);
    });

    test("creates CloudWatch Log Group for Flow Logs", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"flow_log"/);
      expect(tapStackContent).toMatch(/retention_in_days\s*=\s*30/);
      expect(tapStackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("creates IAM role for Flow Logs", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"flow_log"/);
      expect(tapStackContent).toMatch(/vpc-flow-logs\.amazonaws\.com/);
    });

    test("Flow Logs IAM role has proper permissions", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"flow_log"/);
      expect(tapStackContent).toMatch(/logs:CreateLogGroup/);
      expect(tapStackContent).toMatch(/logs:CreateLogStream/);
      expect(tapStackContent).toMatch(/logs:PutLogEvents/);
    });

    test("creates public subnets", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(tapStackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("creates private database subnets", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"private_db"/);
    });

    test("subnets use proper CIDR calculation", () => {
      expect(tapStackContent).toMatch(/cidrsubnet\(var\.vpc_cidr/);
    });

    test("creates Internet Gateway", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test("creates public route table", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(tapStackContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });

    test("creates route table associations", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
    });
  });

  describe("S3 Buckets with Security", () => {
    test("creates CloudTrail S3 bucket", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail"/);
    });

    test("CloudTrail bucket uses account ID in name", () => {
      expect(tapStackContent).toMatch(/data\.aws_caller_identity\.current\.account_id/);
    });

    test("enables versioning for CloudTrail bucket", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"cloudtrail"/);
      expect(tapStackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("configures KMS encryption for CloudTrail bucket", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"cloudtrail"/);
      expect(tapStackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      expect(tapStackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.cloudtrail\.arn/);
    });

    test("blocks public access for CloudTrail bucket", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"cloudtrail"/);
      expect(tapStackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(tapStackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(tapStackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(tapStackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("CloudTrail bucket has proper policy", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"/);
      expect(tapStackContent).toMatch(/AWSCloudTrailAclCheck/);
      expect(tapStackContent).toMatch(/AWSCloudTrailWrite/);
      expect(tapStackContent).toMatch(/DenyInsecureConnections/);
      expect(tapStackContent).toMatch(/aws:SecureTransport/);
    });

    test("creates Security Group logs bucket", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"sg_logs"/);
    });

    test("Security Group logs bucket has versioning", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"sg_logs"/);
    });

    test("encrypts Security Group logs bucket", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"sg_logs"/);
    });

    test("creates main application bucket", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"main"/);
    });

    test("main bucket enforces HTTPS only", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"main"/);
    });

    test("creates AWS Config bucket", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"config"/);
    });

    test("all S3 buckets have encryption configured", () => {
      const encryptionConfigs = tapStackContent.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/g);
      expect(encryptionConfigs).toBeTruthy();
      expect(encryptionConfigs!.length).toBeGreaterThanOrEqual(4);
    });

    test("all S3 buckets block public access", () => {
      const publicAccessBlocks = tapStackContent.match(/resource\s+"aws_s3_bucket_public_access_block"/g);
      expect(publicAccessBlocks).toBeTruthy();
      expect(publicAccessBlocks!.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("Secrets Manager", () => {
    test("generates random password for RDS", () => {
      expect(tapStackContent).toMatch(/resource\s+"random_password"\s+"rds_password"/);
      expect(tapStackContent).toMatch(/length\s*=\s*32/);
      expect(tapStackContent).toMatch(/special\s*=\s*true/);
    });

    test("creates Secrets Manager secret for RDS credentials", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"rds_credentials"/);
      expect(tapStackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.id/);
      expect(tapStackContent).toMatch(/recovery_window_in_days\s*=\s*7/);
    });

    test("stores RDS credentials in Secrets Manager", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"rds_credentials"/);
      expect(tapStackContent).toMatch(/secret_string\s*=\s*jsonencode/);
      expect(tapStackContent).toMatch(/username/);
      expect(tapStackContent).toMatch(/password/);
      expect(tapStackContent).toMatch(/engine/);
      expect(tapStackContent).toMatch(/host/);
      expect(tapStackContent).toMatch(/port/);
    });

    test("secret does not contain hardcoded password", () => {
      expect(tapStackContent).toMatch(/password\s*=\s*random_password\.rds_password\.result/);
    });
  });

  describe("Security Groups", () => {
    test("creates RDS security group", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
      expect(tapStackContent).toMatch(/description\s*=\s*"Security group for RDS database"/);
    });

    test("RDS security group allows MySQL port 3306", () => {
      expect(tapStackContent).toMatch(/from_port\s*=\s*3306/);
      expect(tapStackContent).toMatch(/to_port\s*=\s*3306/);
      expect(tapStackContent).toMatch(/protocol\s*=\s*"tcp"/);
    });

    test("RDS security group restricts access to app security group", () => {
      expect(tapStackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.app\.id\]/);
    });

    test("creates application security group", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"app"/);
    });

    test("application security group allows HTTPS", () => {
      expect(tapStackContent).toMatch(/from_port\s*=\s*443/);
      expect(tapStackContent).toMatch(/to_port\s*=\s*443/);
    });

    test("security groups have proper egress rules", () => {
      expect(tapStackContent).toMatch(/egress\s*\{/);
    });
  });

  describe("RDS Database", () => {
    test("creates DB subnet group", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
      expect(tapStackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private_db\[\*\]\.id/);
    });

    test("creates RDS instance", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(tapStackContent).toMatch(/engine\s*=\s*"mysql"/);
    });

    test("RDS uses MySQL 8.0", () => {
      expect(tapStackContent).toMatch(/engine_version\s*=\s*"8\.0"/);
    });

    test("RDS has storage encryption enabled", () => {
      expect(tapStackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(tapStackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("RDS uses Secrets Manager password", () => {
      expect(tapStackContent).toMatch(/password\s*=\s*random_password\.rds_password\.result/);
    });

    test("RDS is in private subnet", () => {
      expect(tapStackContent).toMatch(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.main\.name/);
    });

    test("RDS has backup retention", () => {
      expect(tapStackContent).toMatch(/backup_retention_period\s*=\s*7/);
    });

    test("RDS has backup and maintenance windows", () => {
      expect(tapStackContent).toMatch(/backup_window/);
      expect(tapStackContent).toMatch(/maintenance_window/);
    });

    test("RDS exports logs to CloudWatch", () => {
      expect(tapStackContent).toMatch(/enabled_cloudwatch_logs_exports/);
      expect(tapStackContent).toMatch(/error/);
      expect(tapStackContent).toMatch(/general/);
      expect(tapStackContent).toMatch(/slowquery/);
    });

    test("RDS skip final snapshot for testing", () => {
      expect(tapStackContent).toMatch(/skip_final_snapshot\s*=\s*true/);
    });

    test("RDS uses security group", () => {
      expect(tapStackContent).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.rds\.id\]/);
    });
  });

  describe("IAM Roles and Policies", () => {
    test("creates EC2 instance role", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_instance"/);
      expect(tapStackContent).toMatch(/ec2\.amazonaws\.com/);
    });

    test("attaches SSM policy to EC2 role", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_ssm"/);
      expect(tapStackContent).toMatch(/AmazonSSMManagedInstanceCore/);
    });

    test("creates Lambda role for SG monitoring", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"sg_monitor_lambda"/);
      expect(tapStackContent).toMatch(/lambda\.amazonaws\.com/);
    });

    test("Lambda role has CloudWatch Logs permissions", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"sg_monitor_lambda"/);
      expect(tapStackContent).toMatch(/logs:CreateLogGroup/);
      expect(tapStackContent).toMatch(/logs:CreateLogStream/);
      expect(tapStackContent).toMatch(/logs:PutLogEvents/);
    });

    test("Lambda role has S3 permissions", () => {
      expect(tapStackContent).toMatch(/s3:PutObject/);
    });

    test("creates IAM group for admins", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_group"\s+"admins"/);
    });

    test("creates MFA policy", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_policy"\s+"mfa_policy"/);
      expect(tapStackContent).toMatch(/DenyAllExceptListedIfNoMFA/);
      expect(tapStackContent).toMatch(/aws:MultiFactorAuthPresent/);
    });

    test("MFA policy denies actions without MFA", () => {
      expect(tapStackContent).toMatch(/Effect\s*=\s*"Deny"/);
      expect(tapStackContent).toMatch(/BoolIfExists/);
    });

    test("MFA policy allows MFA device management", () => {
      expect(tapStackContent).toMatch(/CreateVirtualMFADevice/);
      expect(tapStackContent).toMatch(/EnableMFADevice/);
    });

    test("attaches MFA policy to admins group", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_group_policy_attachment"\s+"admins_mfa"/);
    });
  });

  describe("AWS Config", () => {
    test("creates Config recorder", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"/);
      expect(tapStackContent).toMatch(/all_supported\s*=\s*true/);
    });

    test("creates Config delivery channel", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"/);
      expect(tapStackContent).toMatch(/delivery_frequency\s*=\s*"TwentyFour_Hours"/);
    });

    test("Config has IAM role", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"config"/);
      expect(tapStackContent).toMatch(/config\.amazonaws\.com/);
    });

    test("Config role has proper policy attachment", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"config"/);
      expect(tapStackContent).toMatch(/ConfigRole/);
    });

    test("Config role has S3 permissions", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"config_s3"/);
      expect(tapStackContent).toMatch(/s3:GetBucketVersioning/);
      expect(tapStackContent).toMatch(/s3:PutObject/);
    });

    test("enables Config recorder", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_config_configuration_recorder_status"\s+"main"/);
      expect(tapStackContent).toMatch(/is_enabled\s*=\s*true/);
    });

    test("Config bucket has proper policy", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"config"/);
      expect(tapStackContent).toMatch(/AWSConfigBucketPermissionsCheck/);
      expect(tapStackContent).toMatch(/AWSConfigBucketDelivery/);
    });
  });

  describe("AWS GuardDuty", () => {
    test("creates GuardDuty detector", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_guardduty_detector"\s+"main"/);
      expect(tapStackContent).toMatch(/enable\s*=\s*true/);
    });

    test("GuardDuty has proper finding frequency", () => {
      expect(tapStackContent).toMatch(/finding_publishing_frequency\s*=\s*"FIFTEEN_MINUTES"/);
    });

    test("GuardDuty monitors S3", () => {
      expect(tapStackContent).toMatch(/datasources\s*\{/);
      expect(tapStackContent).toMatch(/s3_logs\s*\{/);
      expect(tapStackContent).toMatch(/enable\s*=\s*true/);
    });
  });

  describe("AWS Shield Advanced", () => {
    test("creates Shield subscription conditionally", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_shield_subscription"\s+"main"/);
      expect(tapStackContent).toMatch(/count\s*=\s*var\.enable_shield_advanced/);
    });
  });

  describe("AWS CloudTrail", () => {
    test("creates CloudTrail", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
    });

    test("CloudTrail is multi-region", () => {
      expect(tapStackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test("CloudTrail includes global service events", () => {
      expect(tapStackContent).toMatch(/include_global_service_events\s*=\s*true/);
    });

    test("CloudTrail logging is enabled", () => {
      expect(tapStackContent).toMatch(/enable_logging\s*=\s*true/);
    });

    test("CloudTrail uses KMS encryption", () => {
      expect(tapStackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.cloudtrail\.arn/);
    });

    test("CloudTrail has event selectors", () => {
      expect(tapStackContent).toMatch(/event_selector\s*\{/);
      expect(tapStackContent).toMatch(/read_write_type\s*=\s*"All"/);
      expect(tapStackContent).toMatch(/include_management_events\s*=\s*true/);
    });

    test("CloudTrail monitors S3 data events", () => {
      expect(tapStackContent).toMatch(/data_resource\s*\{/);
      expect(tapStackContent).toMatch(/type\s*=\s*"AWS::S3::Object"/);
    });

    test("CloudTrail monitors RDS events", () => {
      expect(tapStackContent).toMatch(/type\s*=\s*"AWS::RDS::DBCluster"/);
    });
  });

  describe("Security Group Change Monitoring", () => {
    test("creates CloudWatch Log Group for SG changes", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"sg_changes"/);
      expect(tapStackContent).toMatch(/\/aws\/lambda\//);
    });

    test("creates archive file data source for Lambda", () => {
      expect(tapStackContent).toMatch(/data\s+"archive_file"\s+"sg_monitor_lambda"/);
      expect(tapStackContent).toMatch(/type\s*=\s*"zip"/);
    });

    test("Lambda function has inline Python code", () => {
      expect(tapStackContent).toMatch(/source\s*\{/);
      expect(tapStackContent).toMatch(/content\s*=\s*<<-EOF/);
      expect(tapStackContent).toMatch(/import json/);
      expect(tapStackContent).toMatch(/import boto3/);
    });

    test("creates Lambda function for SG monitoring", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lambda_function"\s+"sg_monitor"/);
    });

    test("Lambda has proper environment variables", () => {
      expect(tapStackContent).toMatch(/environment\s*\{/);
      expect(tapStackContent).toMatch(/S3_BUCKET\s*=\s*aws_s3_bucket\.sg_logs\.id/);
      expect(tapStackContent).toMatch(/LOG_GROUP/);
    });

    test("Lambda uses Python 3.11 runtime", () => {
      expect(tapStackContent).toMatch(/runtime\s*=\s*"python3\.11"/);
    });

    test("Lambda has proper timeout", () => {
      expect(tapStackContent).toMatch(/timeout\s*=\s*60/);
    });

    test("creates EventBridge rule for SG changes", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"sg_changes"/);
      expect(tapStackContent).toMatch(/event_pattern\s*=\s*jsonencode/);
    });

    test("EventBridge monitors all SG operations", () => {
      expect(tapStackContent).toMatch(/AuthorizeSecurityGroupIngress/);
      expect(tapStackContent).toMatch(/AuthorizeSecurityGroupEgress/);
      expect(tapStackContent).toMatch(/RevokeSecurityGroupIngress/);
      expect(tapStackContent).toMatch(/RevokeSecurityGroupEgress/);
      expect(tapStackContent).toMatch(/CreateSecurityGroup/);
      expect(tapStackContent).toMatch(/DeleteSecurityGroup/);
    });

    test("creates EventBridge target", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"sg_lambda"/);
    });

    test("Lambda has EventBridge permission", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_eventbridge"/);
      expect(tapStackContent).toMatch(/principal\s*=\s*"events\.amazonaws\.com"/);
    });
  });

  describe("Outputs", () => {
    test("outputs VPC ID", () => {
      expect(tapStackContent).toMatch(/output\s+"vpc_id"/);
      expect(tapStackContent).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
    });

    test("outputs CloudTrail S3 bucket ARN", () => {
      expect(tapStackContent).toMatch(/output\s+"cloudtrail_s3_bucket_arn"/);
      expect(tapStackContent).toMatch(/value\s*=\s*aws_s3_bucket\.cloudtrail\.arn/);
    });

    test("outputs SG logs bucket ARN", () => {
      expect(tapStackContent).toMatch(/output\s+"sg_logs_s3_bucket_arn"/);
    });

    test("outputs RDS endpoint", () => {
      expect(tapStackContent).toMatch(/output\s+"rds_endpoint"/);
      expect(tapStackContent).toMatch(/value\s*=\s*aws_db_instance\.main\.endpoint/);
    });

    test("outputs Secrets Manager secret ARN", () => {
      expect(tapStackContent).toMatch(/output\s+"secrets_manager_secret_arn"/);
    });

    test("outputs GuardDuty detector ID", () => {
      expect(tapStackContent).toMatch(/output\s+"guardduty_detector_id"/);
    });

    test("outputs Flow Log ID", () => {
      expect(tapStackContent).toMatch(/output\s+"flow_log_id"/);
    });

    test("outputs Config recorder name", () => {
      expect(tapStackContent).toMatch(/output\s+"config_recorder_name"/);
    });
  });

  describe("Security Best Practices", () => {
    test("no hardcoded AWS credentials", () => {
      expect(tapStackContent).not.toMatch(/AKIA[A-Z0-9]{16}/);
      expect(tapStackContent).not.toMatch(/aws_access_key_id/i);
      expect(tapStackContent).not.toMatch(/aws_secret_access_key/i);
    });

    test("no hardcoded passwords (uses random generation)", () => {
      const passwordMatches = tapStackContent.match(/password\s*=\s*"[^r]/gi);
      expect(passwordMatches).toBeFalsy();
    });

    test("encryption at rest is enforced", () => {
      const encryptionMatches = tapStackContent.match(/storage_encrypted\s*=\s*true/g);
      expect(encryptionMatches).toBeTruthy();
    });

    test("KMS encryption is used for sensitive data", () => {
      const kmsMatches = tapStackContent.match(/kms_key_id|kms_master_key_id/g);
      expect(kmsMatches).toBeTruthy();
      expect(kmsMatches!.length).toBeGreaterThan(5);
    });

    test("public access is blocked on S3 buckets", () => {
      const publicAccessBlocks = tapStackContent.match(/resource\s+"aws_s3_bucket_public_access_block"/g);
      expect(publicAccessBlocks).toBeTruthy();
      expect(publicAccessBlocks!.length).toBeGreaterThanOrEqual(4);
    });

    test("HTTPS/TLS is enforced", () => {
      expect(tapStackContent).toMatch(/aws:SecureTransport/);
      expect(tapStackContent).toMatch(/"false"/);
    });

    test("uses IAM roles instead of users for resources", () => {
      const roleMatches = tapStackContent.match(/resource\s+"aws_iam_role"/g);
      expect(roleMatches).toBeTruthy();
      expect(roleMatches!.length).toBeGreaterThan(3);
    });

    test("all resources use common tags", () => {
      const tagMatches = tapStackContent.match(/tags\s*=\s*merge\(var\.common_tags/g);
      expect(tagMatches).toBeTruthy();
      expect(tagMatches!.length).toBeGreaterThan(10);
    });

    test("MFA is enforced for IAM users", () => {
      expect(tapStackContent).toMatch(/MultiFactorAuthPresent/);
    });

    test("logging is enabled for audit trail", () => {
      expect(tapStackContent).toMatch(/enable_logging\s*=\s*true/);
    });

    test("key rotation is enabled for KMS keys", () => {
      const rotationMatches = tapStackContent.match(/enable_key_rotation\s*=\s*true/g);
      expect(rotationMatches).toBeTruthy();
      expect(rotationMatches!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Compliance and Monitoring", () => {
    test("implements continuous monitoring with GuardDuty", () => {
      expect(tapStackContent).toMatch(/aws_guardduty_detector/);
    });

    test("implements configuration tracking with AWS Config", () => {
      expect(tapStackContent).toMatch(/aws_config_configuration_recorder/);
    });

    test("implements audit logging with CloudTrail", () => {
      expect(tapStackContent).toMatch(/aws_cloudtrail/);
    });

    test("implements network monitoring with VPC Flow Logs", () => {
      expect(tapStackContent).toMatch(/aws_flow_log/);
    });

    test("implements change tracking for security groups", () => {
      expect(tapStackContent).toMatch(/aws_cloudwatch_event_rule.*sg_changes/);
    });

    test("stores all logs in encrypted buckets", () => {
      expect(tapStackContent).toMatch(/server_side_encryption_configuration/);
    });

    test("enables versioning for audit buckets", () => {
      const versioningMatches = tapStackContent.match(/aws_s3_bucket_versioning/g);
      expect(versioningMatches).toBeTruthy();
      expect(versioningMatches!.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("Multi-Region and High Availability", () => {
    test("CloudTrail is configured as multi-region", () => {
      expect(tapStackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test("uses multiple availability zones for subnets", () => {
      expect(tapStackContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
    });

    test("database subnet group uses multiple AZs", () => {
      expect(tapStackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private_db\[\*\]\.id/);
    });
  });
});
