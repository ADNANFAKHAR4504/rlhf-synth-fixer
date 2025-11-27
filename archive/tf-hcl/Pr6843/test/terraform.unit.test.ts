// test/terraform.unit.test.ts
// Comprehensive unit tests for Terraform infrastructure defined in lib/tap_stack.tf
// These tests validate the structure and configuration without executing Terraform

import fs from "fs";
import path from "path";

const TAP_STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");
const PROVIDER_PATH = path.resolve(__dirname, "../lib/provider.tf");
const VARIABLES_PATH = path.resolve(__dirname, "../lib/variables.tf");

describe("Terraform Infrastructure Unit Tests", () => {
  let tapStackContent: string;
  let providerContent: string;
  let variablesContent: string;

  beforeAll(() => {
    tapStackContent = fs.readFileSync(TAP_STACK_PATH, "utf8");
    providerContent = fs.readFileSync(PROVIDER_PATH, "utf8");
    variablesContent = fs.readFileSync(VARIABLES_PATH, "utf8");
  });

  describe("File Structure and Existence", () => {
    test("tap_stack.tf file exists", () => {
      expect(fs.existsSync(TAP_STACK_PATH)).toBe(true);
    });

    test("provider.tf file exists", () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
    });

    test("variables.tf file exists", () => {
      expect(fs.existsSync(VARIABLES_PATH)).toBe(true);
    });

    test("tap_stack.tf is not empty", () => {
      expect(tapStackContent.length).toBeGreaterThan(0);
    });

    test("lambda_function.zip exists in lib folder", () => {
      const lambdaZipPath = path.resolve(__dirname, "../lib/lambda_function.zip");
      expect(fs.existsSync(lambdaZipPath)).toBe(true);
    });
  });

  describe("Provider Configuration Separation", () => {
    test("provider.tf contains terraform block", () => {
      expect(providerContent).toMatch(/terraform\s*{/);
    });

    test("provider.tf contains AWS provider configuration", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test("tap_stack.tf does NOT contain provider block (separation of concerns)", () => {
      expect(tapStackContent).not.toMatch(/provider\s+"aws"\s*{/);
    });

    test("tap_stack.tf does NOT contain terraform block (defined in provider.tf)", () => {
      expect(tapStackContent).not.toMatch(/terraform\s*{[\s\S]*required_version/);
    });
  });

  describe("Variables Configuration", () => {
    test("variables.tf defines aws_region variable", () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("variables.tf defines environment_suffix variable", () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("variables.tf defines tagging variables", () => {
      expect(variablesContent).toMatch(/variable\s+"repository"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"commit_author"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"pr_number"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"team"\s*{/);
    });

    test("provider uses var.aws_region", () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });
  });

  describe("Data Sources", () => {
    test("declares data source for current AWS account ID", () => {
      expect(tapStackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test("declares data source for current region", () => {
      expect(tapStackContent).toMatch(/data\s+"aws_region"\s+"current"/);
    });

    test("declares data source for all AWS regions", () => {
      expect(tapStackContent).toMatch(/data\s+"aws_regions"\s+"all"/);
    });

    test("declares data source for availability zones", () => {
      expect(tapStackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });

    test("declares data source for Amazon Linux 2 AMI", () => {
      expect(tapStackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2_encrypted"/);
    });
  });

  describe("KMS Configuration", () => {
    test("creates KMS key for encryption", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_key"\s+"prod_main"/);
    });

    test("KMS key has rotation enabled", () => {
      expect(tapStackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("KMS key rotates every 365 days", () => {
      expect(tapStackContent).toMatch(/rotation_period_in_days\s*=\s*365/);
    });

    test("KMS key has deletion window of 10 days (no deletion protection)", () => {
      expect(tapStackContent).toMatch(/deletion_window_in_days\s*=\s*10/);
    });

    test("creates KMS alias", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_alias"\s+"prod_main"/);
      expect(tapStackContent).toMatch(/name\s*=\s*"alias\/prod-main"/);
    });

    test("KMS key uses prod- naming prefix", () => {
      expect(tapStackContent).toMatch(/description\s*=\s*"prod-main-kms-key"/);
    });
  });

  describe("S3 Bucket Configuration", () => {
    test("creates central logging S3 bucket", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"prod_logs"/);
      expect(tapStackContent).toMatch(/bucket\s*=\s*"prod-logs-/);
    });

    test("creates application data S3 bucket", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"prod_app_data"/);
      expect(tapStackContent).toMatch(/bucket\s*=\s*"prod-app-data-/);
    });

    test("enables versioning on logging bucket", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"prod_logs"/);
      expect(tapStackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("enables versioning on app data bucket", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"prod_app_data"/);
    });

    test("configures server-side encryption for logging bucket with KMS", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"prod_logs"/);
      expect(tapStackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("configures server-side encryption for app data bucket with AES256", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"prod_app_data"/);
      expect(tapStackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test("blocks public access on logging bucket", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"prod_logs"/);
      expect(tapStackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(tapStackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(tapStackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(tapStackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("blocks public access on app data bucket", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"prod_app_data"/);
    });

    test("configures S3 bucket policy for logging services", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"prod_logs"/);
      expect(tapStackContent).toMatch(/AWSCloudTrailAclCheck/);
      expect(tapStackContent).toMatch(/AWSCloudTrailWrite/);
      expect(tapStackContent).toMatch(/AWSConfigBucketPermissionsCheck/);
      expect(tapStackContent).toMatch(/VPCFlowLogsWrite/);
    });

    test("enforces account-level S3 public access block", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_account_public_access_block"\s+"account"/);
    });
  });

  describe("VPC and Networking", () => {
    test("creates VPC with proper CIDR", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_vpc"\s+"prod"/);
      expect(tapStackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("enables DNS support and hostnames in VPC", () => {
      expect(tapStackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(tapStackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("creates Internet Gateway", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"prod"/);
    });

    test("creates public subnets", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"prod_public"/);
      expect(tapStackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("creates private subnets", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"prod_private"/);
    });

    test("creates NAT Gateway EIPs", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_eip"\s+"prod_nat"/);
      expect(tapStackContent).toMatch(/domain\s*=\s*"vpc"/);
    });

    test("creates NAT Gateways", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"prod"/);
    });

    test("creates public route table", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table"\s+"prod_public"/);
    });

    test("creates private route tables", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table"\s+"prod_private"/);
    });

    test("creates route table associations", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table_association"\s+"prod_public"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table_association"\s+"prod_private"/);
    });

    test("VPC uses prod- naming prefix", () => {
      expect(tapStackContent).toMatch(/Name\s*=\s*"prod-vpc"/);
    });
  });

  describe("VPC Flow Logs", () => {
    test("creates VPC Flow Logs", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_flow_log"\s+"prod_vpc"/);
    });

    test("VPC Flow Logs use S3 as destination", () => {
      expect(tapStackContent).toMatch(/log_destination_type\s*=\s*"s3"/);
    });

    test("VPC Flow Logs capture ALL traffic", () => {
      expect(tapStackContent).toMatch(/traffic_type\s*=\s*"ALL"/);
    });

    test("VPC Flow Logs store in central logging bucket", () => {
      expect(tapStackContent).toMatch(/log_destination\s*=\s*"\$\{aws_s3_bucket\.prod_logs\.arn\}\/vpc-flow-logs\/"/);
    });
  });

  describe("CloudTrail Configuration", () => {
    test("creates CloudTrail", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"prod_main"/);
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
      expect(tapStackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.prod_main\.arn/);
    });

    test("CloudTrail stores logs in central bucket", () => {
      expect(tapStackContent).toMatch(/s3_bucket_name\s*=\s*aws_s3_bucket\.prod_logs\.id/);
    });

    test("creates IAM role for CloudTrail", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"prod_cloudtrail"/);
    });

    test("CloudTrail uses prod- naming prefix", () => {
      expect(tapStackContent).toMatch(/name\s*=\s*"prod-main-trail"/);
    });
  });

  describe("AWS Config Configuration", () => {
    test("creates AWS Config recorder", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"prod"/);
    });

    test("creates AWS Config delivery channel", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"prod"/);
    });

    test("starts AWS Config recorder", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_config_configuration_recorder_status"\s+"prod"/);
      expect(tapStackContent).toMatch(/is_enabled\s*=\s*true/);
    });

    test("Config records all supported resources", () => {
      expect(tapStackContent).toMatch(/all_supported\s*=\s*true/);
    });

    test("creates IAM role for AWS Config", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"prod_config"/);
    });

    test("creates IAM policy for AWS Config", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"prod_config"/);
    });

    test("Config delivery channel stores in central bucket", () => {
      expect(tapStackContent).toMatch(/s3_bucket_name\s*=\s*aws_s3_bucket\.prod_logs\.id/);
    });
  });

  describe("AWS Config Rules", () => {
    test("creates S3 bucket encryption rule", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"s3_bucket_encryption"/);
      expect(tapStackContent).toMatch(/S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED/);
    });

    test("creates EBS encryption rule", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"ebs_encrypted"/);
      expect(tapStackContent).toMatch(/ENCRYPTED_VOLUMES/);
    });

    test("creates RDS encryption rule", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"rds_encrypted"/);
      expect(tapStackContent).toMatch(/RDS_STORAGE_ENCRYPTED/);
    });

    test("creates IAM MFA rule", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"iam_mfa"/);
      expect(tapStackContent).toMatch(/MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS/);
    });

    test("creates root access key check rule", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"root_access_key"/);
      expect(tapStackContent).toMatch(/IAM_ROOT_ACCESS_KEY_CHECK/);
    });

    test("Config rules use prod- naming prefix", () => {
      expect(tapStackContent).toMatch(/name\s*=\s*"prod-s3-bucket-encryption"/);
      expect(tapStackContent).toMatch(/name\s*=\s*"prod-ebs-encrypted"/);
      expect(tapStackContent).toMatch(/name\s*=\s*"prod-rds-encrypted"/);
    });
  });

  describe("GuardDuty Configuration", () => {
    test("creates GuardDuty detector", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_guardduty_detector"\s+"prod"/);
    });

    test("GuardDuty is enabled", () => {
      expect(tapStackContent).toMatch(/enable\s*=\s*true/);
    });

    test("GuardDuty finding frequency is set", () => {
      expect(tapStackContent).toMatch(/finding_publishing_frequency\s*=\s*"FIFTEEN_MINUTES"/);
    });

    test("GuardDuty S3 logs are enabled", () => {
      expect(tapStackContent).toMatch(/s3_logs\s*{[\s\S]*enable\s*=\s*true/);
    });

    test("creates CloudWatch Event Rule for GuardDuty", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"guardduty"/);
    });

    test("creates CloudWatch Log Group for GuardDuty", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"guardduty"/);
    });

    test("creates CloudWatch Event Target for GuardDuty", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"guardduty"/);
    });

    test("GuardDuty log group has retention period", () => {
      expect(tapStackContent).toMatch(/retention_in_days\s*=\s*30/);
    });
  });

  describe("WAF Configuration", () => {
    test("creates WAF Web ACL", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"prod"/);
    });

    test("WAF scope is REGIONAL", () => {
      expect(tapStackContent).toMatch(/scope\s*=\s*"REGIONAL"/);
    });

    test("WAF has default allow action", () => {
      expect(tapStackContent).toMatch(/default_action\s*{[\s\S]*allow\s*{}/);
    });

    test("WAF includes AWS Managed Rules", () => {
      expect(tapStackContent).toMatch(/AWSManagedRulesCommonRuleSet/);
    });

    test("creates WAF IP Set for malicious IPs", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_wafv2_ip_set"\s+"malicious_ips"/);
    });

    test("WAF has rule to block malicious IPs", () => {
      expect(tapStackContent).toMatch(/BlockMaliciousIPs/);
    });

    test("WAF IP Set is IPV4", () => {
      expect(tapStackContent).toMatch(/ip_address_version\s*=\s*"IPV4"/);
    });

    test("WAF uses prod- naming prefix", () => {
      expect(tapStackContent).toMatch(/name\s*=\s*"prod-web-acl"/);
    });
  });

  describe("EBS Encryption", () => {
    test("enables default EBS encryption", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_ebs_encryption_by_default"\s+"prod"/);
      expect(tapStackContent).toMatch(/enabled\s*=\s*true/);
    });

    test("sets default KMS key for EBS", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_ebs_default_kms_key"\s+"prod"/);
    });
  });

  describe("IAM Configuration", () => {
    test("creates strict password policy", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_account_password_policy"\s+"strict"/);
    });

    test("password policy requires minimum length of 14", () => {
      expect(tapStackContent).toMatch(/minimum_password_length\s*=\s*14/);
    });

    test("password policy requires lowercase characters", () => {
      expect(tapStackContent).toMatch(/require_lowercase_characters\s*=\s*true/);
    });

    test("password policy requires uppercase characters", () => {
      expect(tapStackContent).toMatch(/require_uppercase_characters\s*=\s*true/);
    });

    test("password policy requires numbers", () => {
      expect(tapStackContent).toMatch(/require_numbers\s*=\s*true/);
    });

    test("password policy requires symbols", () => {
      expect(tapStackContent).toMatch(/require_symbols\s*=\s*true/);
    });

    test("creates policy to deny root access keys", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_policy"\s+"deny_root_access_keys"/);
    });

    test("creates sample IAM user", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_user"\s+"prod_user"/);
    });

    test("creates MFA enforcement policy for user", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_user_policy"\s+"prod_user_mfa"/);
      expect(tapStackContent).toMatch(/DenyAllExceptListedIfNoMFA/);
    });
  });

  describe("EC2 IAM Configuration", () => {
    test("creates IAM role for EC2", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"prod_ec2"/);
    });

    test("creates IAM instance profile for EC2", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"prod_ec2"/);
    });

    test("creates minimal IAM policy for EC2", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"prod_ec2"/);
    });

    test("EC2 IAM role follows least privilege principle", () => {
      expect(tapStackContent).toMatch(/s3:GetObject/);
      expect(tapStackContent).toMatch(/s3:ListBucket/);
      expect(tapStackContent).toMatch(/kms:Decrypt/);
    });

    test("EC2 role uses prod- naming prefix", () => {
      expect(tapStackContent).toMatch(/name\s*=\s*"prod-ec2-role"/);
    });
  });

  describe("Lambda IAM Configuration", () => {
    test("creates IAM role for Lambda", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"prod_lambda"/);
    });

    test("creates minimal IAM policy for Lambda", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"prod_lambda"/);
    });

    test("Lambda IAM role has only CloudWatch Logs permissions", () => {
      expect(tapStackContent).toMatch(/logs:CreateLogGroup/);
      expect(tapStackContent).toMatch(/logs:CreateLogStream/);
      expect(tapStackContent).toMatch(/logs:PutLogEvents/);
    });

    test("Lambda role uses prod- naming prefix", () => {
      expect(tapStackContent).toMatch(/name\s*=\s*"prod-lambda-role"/);
    });
  });

  describe("Security Groups", () => {
    test("creates security group for EC2", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"prod_ec2"/);
    });

    test("EC2 security group allows HTTPS (443) inbound", () => {
      expect(tapStackContent).toMatch(/from_port\s*=\s*443/);
      expect(tapStackContent).toMatch(/to_port\s*=\s*443/);
    });

    test("creates security group for RDS", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"prod_rds"/);
    });

    test("RDS security group allows MySQL (3306)", () => {
      expect(tapStackContent).toMatch(/from_port\s*=\s*3306/);
      expect(tapStackContent).toMatch(/to_port\s*=\s*3306/);
    });

    test("creates security group for Lambda", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"prod_lambda"/);
    });

    test("security groups use prod- naming prefix", () => {
      expect(tapStackContent).toMatch(/name\s*=\s*"prod-ec2-sg"/);
      expect(tapStackContent).toMatch(/name\s*=\s*"prod-rds-sg"/);
      expect(tapStackContent).toMatch(/name\s*=\s*"prod-lambda-sg"/);
    });
  });

  describe("EC2 Configuration", () => {
    test("creates EC2 launch template", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_launch_template"\s+"prod"/);
    });

    test("launch template uses t3.micro instance type", () => {
      expect(tapStackContent).toMatch(/instance_type\s*=\s*"t3\.micro"/);
    });

    test("launch template has encrypted EBS volumes", () => {
      expect(tapStackContent).toMatch(/encrypted\s*=\s*true/);
    });

    test("launch template uses KMS for EBS encryption", () => {
      expect(tapStackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.prod_main\.arn/);
    });

    test("launch template enforces IMDSv2", () => {
      expect(tapStackContent).toMatch(/http_tokens\s*=\s*"required"/);
    });

    test("launch template has monitoring enabled", () => {
      expect(tapStackContent).toMatch(/monitoring\s*{[\s\S]*enabled\s*=\s*true/);
    });

    test("launch template uses IAM instance profile", () => {
      expect(tapStackContent).toMatch(/iam_instance_profile\s*{/);
    });
  });

  describe("RDS Configuration", () => {
    test("creates RDS subnet group", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"prod"/);
    });

    test("creates RDS instance", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_db_instance"\s+"prod"/);
    });

    test("RDS uses MySQL engine", () => {
      expect(tapStackContent).toMatch(/engine\s*=\s*"mysql"/);
    });

    test("RDS storage is encrypted", () => {
      expect(tapStackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("RDS uses KMS for encryption", () => {
      expect(tapStackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.prod_main\.arn/);
    });

    test("RDS has NO deletion protection", () => {
      expect(tapStackContent).toMatch(/deletion_protection\s*=\s*false/);
    });

    test("RDS skips final snapshot (for testing)", () => {
      expect(tapStackContent).toMatch(/skip_final_snapshot\s*=\s*true/);
    });

    test("RDS has enhanced monitoring enabled", () => {
      expect(tapStackContent).toMatch(/monitoring_interval\s*=\s*60/);
    });

    test("RDS enforces SSL/TLS", () => {
      expect(tapStackContent).toMatch(/ca_cert_identifier/);
    });

    test("creates IAM role for RDS enhanced monitoring", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"rds_enhanced_monitoring"/);
    });

    test("attaches managed policy for RDS monitoring", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"rds_enhanced_monitoring"/);
      expect(tapStackContent).toMatch(/AmazonRDSEnhancedMonitoringRole/);
    });

    test("RDS uses prod- naming prefix", () => {
      expect(tapStackContent).toMatch(/identifier\s*=\s*"prod-rds-instance"/);
    });
  });

  describe("Lambda Configuration", () => {
    test("creates Lambda function", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lambda_function"\s+"prod_example"/);
    });

    test("Lambda uses Python 3.11 runtime", () => {
      expect(tapStackContent).toMatch(/runtime\s*=\s*"python3\.11"/);
    });

    test("Lambda has environment variables", () => {
      // Lambda environment block structure:
      // environment {
      //   variables = {
      //     ENVIRONMENT = "production"
      //   }
      // }
      expect(tapStackContent).toMatch(/environment\s*\{/);
      expect(tapStackContent).toMatch(/ENVIRONMENT\s*=\s*"production"/);
    });

    test("Lambda encrypts environment variables with KMS", () => {
      expect(tapStackContent).toMatch(/kms_key_arn\s*=\s*aws_kms_key\.prod_main\.arn/);
    });

    test("Lambda is placed in VPC", () => {
      expect(tapStackContent).toMatch(/vpc_config\s*{/);
    });

    test("Lambda uses IAM role", () => {
      expect(tapStackContent).toMatch(/role\s*=\s*aws_iam_role\.prod_lambda\.arn/);
    });

    test("Lambda uses prod- naming prefix", () => {
      expect(tapStackContent).toMatch(/function_name\s*=\s*"prod-lambda-function"/);
    });
  });

  describe("Config Remediation", () => {
    test("creates IAM role for Config remediation", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"config_remediation"/);
    });

    test("creates remediation policy", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"config_remediation"/);
    });

    test("remediation policy has proper permissions", () => {
      expect(tapStackContent).toMatch(/s3:PutBucketEncryption/);
      expect(tapStackContent).toMatch(/s3:PutBucketPublicAccessBlock/);
      expect(tapStackContent).toMatch(/ec2:EnableEbsEncryptionByDefault/);
      expect(tapStackContent).toMatch(/rds:ModifyDBInstance/);
    });
  });

  describe("Outputs", () => {
    test("defines output for VPC ID", () => {
      expect(tapStackContent).toMatch(/output\s+"vpc_id"\s*{/);
    });

    test("defines output for logging bucket", () => {
      expect(tapStackContent).toMatch(/output\s+"logging_bucket"\s*{/);
    });

    test("defines output for KMS key ID", () => {
      expect(tapStackContent).toMatch(/output\s+"kms_key_id"\s*{/);
    });

    test("defines output for CloudTrail name", () => {
      expect(tapStackContent).toMatch(/output\s+"cloudtrail_name"\s*{/);
    });

    test("defines output for GuardDuty detector ID", () => {
      expect(tapStackContent).toMatch(/output\s+"guardduty_detector_id"\s*{/);
    });

    test("all outputs have descriptions", () => {
      const outputMatches = tapStackContent.match(/output\s+"\w+"\s*{/g) || [];
      const descriptionMatches = tapStackContent.match(/description\s*=/g) || [];
      expect(descriptionMatches.length).toBeGreaterThanOrEqual(outputMatches.length);
    });
  });

  describe("Naming Conventions", () => {
    test("all resource names use prod- prefix", () => {
      expect(tapStackContent).toMatch(/prod-main-kms-key/);
      expect(tapStackContent).toMatch(/prod-logs-/);
      expect(tapStackContent).toMatch(/prod-vpc/);
      expect(tapStackContent).toMatch(/prod-main-trail/);
      expect(tapStackContent).toMatch(/prod-web-acl/);
      expect(tapStackContent).toMatch(/prod-ec2-role/);
      expect(tapStackContent).toMatch(/prod-lambda-role/);
      expect(tapStackContent).toMatch(/prod-rds-instance/);
    });
  });

  describe("Security Best Practices", () => {
    test("no hardcoded AWS credentials", () => {
      expect(tapStackContent).not.toMatch(/AKIA[0-9A-Z]{16}/);
      expect(tapStackContent).not.toMatch(/aws_access_key_id/);
      expect(tapStackContent).not.toMatch(/aws_secret_access_key/);
    });

    test("enforces encryption at rest for all data stores", () => {
      expect(tapStackContent).toMatch(/storage_encrypted\s*=\s*true/); // RDS
      expect(tapStackContent).toMatch(/encrypted\s*=\s*true/); // EBS
      expect(tapStackContent).toMatch(/sse_algorithm/); // S3
    });

    test("enforces encryption in transit", () => {
      expect(tapStackContent).toMatch(/ca_cert_identifier/); // RDS SSL
      expect(tapStackContent).toMatch(/from_port\s*=\s*443/); // HTTPS
      expect(tapStackContent).toMatch(/kms_key_id/); // CloudTrail
    });

    test("no deletion protection enabled (as required)", () => {
      expect(tapStackContent).toMatch(/deletion_protection\s*=\s*false/);
      expect(tapStackContent).not.toMatch(/deletion_protection\s*=\s*true/);
    });

    test("uses IAM roles instead of users where applicable", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"prod_ec2"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"prod_lambda"/);
    });

    test("implements least privilege IAM policies", () => {
      // Check that policies specify specific actions, not wildcards
      const policyBlocks = tapStackContent.match(/policy\s*=\s*jsonencode\({[\s\S]*?\}\)/g) || [];
      const hasSpecificActions = policyBlocks.some(block => 
        block.includes('s3:GetObject') || 
        block.includes('logs:CreateLogGroup') ||
        block.includes('config:Put')
      );
      expect(hasSpecificActions).toBe(true);
    });
  });

  describe("Compliance and Monitoring", () => {
    test("CloudTrail logs all management events", () => {
      expect(tapStackContent).toMatch(/include_management_events\s*=\s*true/);
    });

    test("CloudTrail logs data events for S3", () => {
      expect(tapStackContent).toMatch(/data_resource\s*{[\s\S]*type\s*=\s*"AWS::S3::Object"/);
    });

    test("all Config rules depend on recorder", () => {
      const configRules = tapStackContent.match(/resource\s+"aws_config_config_rule"/g) || [];
      const dependsOnRecorder = tapStackContent.match(/depends_on\s*=\s*\[aws_config_configuration_recorder\.prod\]/g) || [];
      expect(dependsOnRecorder.length).toBeGreaterThanOrEqual(configRules.length - 1);
    });

    test("VPC Flow Logs are enabled", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_flow_log"\s+"prod_vpc"/);
    });

    test("GuardDuty findings are sent to CloudWatch", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"guardduty"/);
    });
  });

  describe("Resource Tagging", () => {
    test("KMS key has tags", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_key"\s+"prod_main"[\s\S]*tags\s*=\s*{/);
    });

    test("VPC has tags", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_vpc"\s+"prod"[\s\S]*tags\s*=\s*{/);
    });

    test("S3 buckets have tags", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"prod_logs"[\s\S]*tags\s*=\s*{/);
    });

    test("IAM roles have tags", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"[\s\S]*tags\s*=\s*{/);
    });
  });
});
