// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Validates Terraform configuration structure, resource definitions, and security best practices

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Terraform Infrastructure Unit Tests", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    // Read file contents once for all tests
    if (fs.existsSync(stackPath)) {
      stackContent = fs.readFileSync(stackPath, "utf8");
    }
    if (fs.existsSync(providerPath)) {
      providerContent = fs.readFileSync(providerPath, "utf8");
    }
  });

  describe("File Structure and Basic Validation", () => {
    test("tap_stack.tf exists and is readable", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
      expect(stackContent).toBeDefined();
      expect(stackContent.length).toBeGreaterThan(0);
    });

    test("provider.tf exists and is readable", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
      expect(providerContent).toBeDefined();
      expect(providerContent.length).toBeGreaterThan(0);
    });

    test("tap_stack.tf does NOT declare provider (provider.tf owns providers)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
      expect(stackContent).not.toMatch(/terraform\s*{[\s\S]*required_providers/);
    });

    test("provider.tf contains proper AWS provider configuration", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
      expect(providerContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(providerContent).toMatch(/default\s*=\s*"us-east-1"/);
    });
  });

  describe("Data Sources", () => {
    test("contains required data sources", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
      expect(stackContent).toMatch(/data\s+"aws_region"\s+"current"/);
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2"/);
      expect(stackContent).toMatch(/data\s+"aws_elb_service_account"\s+"main"/);
    });

    test("availability zones data source is properly configured", () => {
      expect(stackContent).toMatch(/state\s*=\s*"available"/);
    });

    test("AMI data source is properly configured for dynamic lookup", () => {
      expect(stackContent).toMatch(/most_recent\s*=\s*true/);
      expect(stackContent).toMatch(/owners\s*=\s*\["amazon"\]/);
      expect(stackContent).toMatch(/values.*amzn2-ami-hvm.*x86_64-gp2/);
      expect(stackContent).toMatch(/values.*x86_64/);
      expect(stackContent).toMatch(/values.*hvm/);
    });
  });

  describe("Random Resources", () => {
    test("contains random_id resource for unique naming", () => {
      expect(stackContent).toMatch(/resource\s+"random_id"\s+"suffix"/);
      expect(stackContent).toMatch(/byte_length\s*=\s*4/);
    });
  });

  describe("KMS Resources", () => {
    test("contains main KMS key with proper configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*10/);
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("contains CloudTrail KMS key with proper policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"cloudtrail"/);
      expect(stackContent).toMatch(/cloudtrail\.amazonaws\.com/);
      expect(stackContent).toMatch(/kms:GenerateDataKey/);
    });

    test("contains KMS aliases for both keys", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"cloudtrail"/);
      expect(stackContent).toMatch(/alias\/main-key-/);
      expect(stackContent).toMatch(/alias\/cloudtrail-key-/);
    });
  });

  describe("VPC and Networking", () => {
    test("contains VPC with proper configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("contains Internet Gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("contains public subnets in multiple AZs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_1"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_2"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.1\.0\/24"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.2\.0\/24"/);
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("contains private subnets in multiple AZs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_1"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_2"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.11\.0\/24"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.12\.0\/24"/);
    });

    test("contains NAT Gateways for high availability", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main_1"/);
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main_2"/);
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat_1"/);
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat_2"/);
    });

    test("contains proper route tables and associations", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private_1"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private_2"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"/);
    });

    test("contains VPC Flow Logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"main"/);
      expect(stackContent).toMatch(/traffic_type\s*=\s*"ALL"/);
      expect(stackContent).toMatch(/log_destination_type\s*=\s*"s3"/);
    });
  });

  describe("S3 Storage", () => {
    test("contains central logging S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
      expect(stackContent).toMatch(/central-logs-/);
    });

    test("contains ALB logs S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"alb_logs"/);
      expect(stackContent).toMatch(/alb-logs-/);
    });

    test("S3 buckets have proper encryption configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("S3 buckets have versioning enabled", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("S3 buckets have public access blocked", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("S3 buckets have lifecycle configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"/);
      expect(stackContent).toMatch(/storage_class\s*=\s*"STANDARD_IA"/);
      expect(stackContent).toMatch(/storage_class\s*=\s*"GLACIER"/);
    });
  });

  describe("Database (RDS)", () => {
    test("contains RDS instance with proper configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(stackContent).toMatch(/engine\s*=\s*"mysql"/);
      expect(stackContent).toMatch(/engine_version\s*=\s*"8\.0"/);
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/deletion_protection\s*=\s*false/);
    });

    test("contains RDS subnet group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
      expect(stackContent).toMatch(/subnet_ids\s*=\s*\[aws_subnet\.private_1\.id,\s*aws_subnet\.private_2\.id\]/);
    });

    test("RDS has enhanced monitoring enabled", () => {
      expect(stackContent).toMatch(/performance_insights_enabled\s*=\s*true/);
      expect(stackContent).toMatch(/monitoring_interval\s*=\s*60/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"rds_enhanced_monitoring"/);
    });

    test("RDS has proper backup configuration", () => {
      expect(stackContent).toMatch(/backup_retention_period\s*=\s*7/);
      expect(stackContent).toMatch(/backup_window\s*=\s*"03:00-04:00"/);
      expect(stackContent).toMatch(/maintenance_window\s*=\s*"sun:04:00-sun:05:00"/);
    });

    test("RDS has CloudWatch logs exports enabled", () => {
      expect(stackContent).toMatch(/enabled_cloudwatch_logs_exports\s*=\s*\["error",\s*"general",\s*"slowquery"\]/);
    });
  });

  describe("Secrets Management", () => {
    test("contains Secrets Manager secret for RDS", () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"rds"/);
      expect(stackContent).toMatch(/rds-credentials-/);
      expect(stackContent).toMatch(/recovery_window_in_days\s*=\s*0/);
    });

    test("contains Secrets Manager secret version", () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"rds"/);
      expect(stackContent).toMatch(/secret_string\s*=\s*jsonencode/);
    });

    test("contains random password generation", () => {
      expect(stackContent).toMatch(/resource\s+"random_password"\s+"rds"/);
      expect(stackContent).toMatch(/length\s*=\s*32/);
      expect(stackContent).toMatch(/special\s*=\s*true/);
    });
  });

  describe("Load Balancer", () => {
    test("contains Application Load Balancer", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(stackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
      expect(stackContent).toMatch(/internal\s*=\s*false/);
      expect(stackContent).toMatch(/enable_deletion_protection\s*=\s*false/);
    });

    test("contains ALB target group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"main"/);
      expect(stackContent).toMatch(/port\s*=\s*80/);
      expect(stackContent).toMatch(/protocol\s*=\s*"HTTP"/);
    });

    test("contains ALB listener with HTTP to HTTPS redirect", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"http"/);
      expect(stackContent).toMatch(/port\s*=\s*"80"/);
      expect(stackContent).toMatch(/protocol\s*=\s*"HTTP"/);
      expect(stackContent).toMatch(/type\s*=\s*"redirect"/);
      expect(stackContent).toMatch(/status_code\s*=\s*"HTTP_301"/);
    });

    test("ALB has access logs enabled", () => {
      expect(stackContent).toMatch(/access_logs\s*{/);
      expect(stackContent).toMatch(/enabled\s*=\s*true/);
    });
  });

  describe("Auto Scaling and Launch Template", () => {
    test("contains Launch Template for application", () => {
      expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"app"/);
      expect(stackContent).toMatch(/name_prefix\s*=\s*"app-template-/);
    });

    test("Launch Template uses dynamic AMI lookup", () => {
      expect(stackContent).toMatch(/image_id\s*=\s*data\.aws_ami\.amazon_linux_2\.id/);
    });

    test("Launch Template has proper instance configuration", () => {
      expect(stackContent).toMatch(/instance_type\s*=\s*"t3\.micro"/);
      expect(stackContent).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.app\.id\]/);
    });

    test("contains Auto Scaling Group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
      expect(stackContent).toMatch(/name\s*=\s*"secure-app-prod-asg-/);
    });

    test("ASG uses Launch Template", () => {
      expect(stackContent).toMatch(/launch_template\s*{/);
      expect(stackContent).toMatch(/id\s*=\s*aws_launch_template\.app\.id/);
      expect(stackContent).toMatch(/version\s*=\s*"\$Latest"/);
    });

    test("ASG has proper scaling configuration", () => {
      expect(stackContent).toMatch(/min_size\s*=\s*1/);
      expect(stackContent).toMatch(/max_size\s*=\s*3/);
      expect(stackContent).toMatch(/desired_capacity\s*=\s*2/);
    });

    test("ASG uses private subnets", () => {
      expect(stackContent).toMatch(/vpc_zone_identifier\s*=\s*\[aws_subnet\.private_1\.id,\s*aws_subnet\.private_2\.id\]/);
    });

    test("ASG is integrated with ALB", () => {
      expect(stackContent).toMatch(/target_group_arns\s*=\s*\[aws_lb_target_group\.main\.arn\]/);
      expect(stackContent).toMatch(/health_check_type\s*=\s*"ELB"/);
    });
  });

  describe("SNS Topic for Alerts", () => {
    test("contains SNS topic for alerts", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
      expect(stackContent).toMatch(/name\s*=\s*"secure-app-prod-alerts-/);
    });

    test("SNS topic has proper display name", () => {
      expect(stackContent).toMatch(/display_name\s*=\s*"Secure App Production Alerts"/);
    });
  });

  describe("Security Groups", () => {
    test("contains security group for RDS", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
      expect(stackContent).toMatch(/from_port\s*=\s*3306/);
      expect(stackContent).toMatch(/to_port\s*=\s*3306/);
      expect(stackContent).toMatch(/protocol\s*=\s*"tcp"/);
    });

    test("contains security group for Application", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"app"/);
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
      expect(stackContent).toMatch(/from_port\s*=\s*80/);
    });

    test("contains security group for ALB", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });

    test("security groups follow least privilege principle", () => {
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group/);
      expect(stackContent).not.toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\].*from_port\s*=\s*22/);
    });
  });

  describe("WAF and Security", () => {
    test("contains WAF WebACL", () => {
      expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"/);
      expect(stackContent).toMatch(/scope\s*=\s*"REGIONAL"/);
    });

    test("WAF has AWS managed rule sets", () => {
      expect(stackContent).toMatch(/AWSManagedRulesCommonRuleSet/);
      expect(stackContent).toMatch(/AWSManagedRulesKnownBadInputsRuleSet/);
      expect(stackContent).toMatch(/AWSManagedRulesSQLiRuleSet/);
    });

    test("WAF is associated with ALB", () => {
      expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl_association"\s+"main"/);
      expect(stackContent).toMatch(/resource_arn\s*=\s*aws_lb\.main\.arn/);
    });

    test("contains GuardDuty detector", () => {
      expect(stackContent).toMatch(/resource\s+"aws_guardduty_detector"\s+"main"/);
      expect(stackContent).toMatch(/enable\s*=\s*true/);
    });
  });

  describe("Monitoring and Compliance", () => {
    test("contains CloudTrail", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
      expect(stackContent).toMatch(/enable_log_file_validation\s*=\s*true/);
      expect(stackContent).toMatch(/include_global_service_events\s*=\s*true/);
    });

    test("CloudTrail has proper event selectors", () => {
      expect(stackContent).toMatch(/event_selector\s*{/);
      expect(stackContent).toMatch(/read_write_type\s*=\s*"All"/);
      expect(stackContent).toMatch(/include_management_events\s*=\s*true/);
    });

    test("contains AWS Config components", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_config_configuration_recorder_status"\s+"main"/);
    });

    test("contains AWS Config rules", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_config_rule"/);
      expect(stackContent).toMatch(/S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED/);
      expect(stackContent).toMatch(/RDS_STORAGE_ENCRYPTED/);
      expect(stackContent).toMatch(/MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS/);
    });

    test("contains CloudWatch log group for RDS", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"rds"/);
      expect(stackContent).toMatch(/retention_in_days\s*=\s*7/);
    });
  });

  describe("IAM Roles and Policies", () => {
    test("contains IAM role for AWS Config", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"config"/);
      expect(stackContent).toMatch(/config\.amazonaws\.com/);
    });

    test("contains IAM role for VPC Flow Logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"flow_logs"/);
      expect(stackContent).toMatch(/vpc-flow-logs\.amazonaws\.com/);
    });

    test("contains IAM role for application instances", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"app_instance"/);
      expect(stackContent).toMatch(/ec2\.amazonaws\.com/);
    });

    test("contains IAM instance profile", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"app"/);
    });

    test("IAM policies follow least privilege principle", () => {
      expect(stackContent).toMatch(/secretsmanager:GetSecretValue/);
      expect(stackContent).toMatch(/kms:Decrypt/);
      expect(stackContent).toMatch(/s3:PutObject/);
      expect(stackContent).not.toMatch(/"Action"\s*:\s*"\*"/);
    });

    test("contains IAM user with MFA enforcement", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_user"\s+"app_user"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_group"\s+"mfa_enforced"/);
      expect(stackContent).toMatch(/aws:MultiFactorAuthPresent/);
    });
  });

  describe("Tagging and Naming", () => {
    test("all resources have consistent tagging", () => {
      expect(stackContent).toMatch(/Environment\s*=\s*"production"/);
      expect(stackContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
      expect(stackContent).toMatch(/Name\s*=.*\$\{random_id\.suffix\.hex\}/);
    });

    test("resources use random suffix for unique naming", () => {
      const suffixMatches = stackContent.match(/\$\{random_id\.suffix\.hex\}/g);
      expect(suffixMatches).not.toBeNull();
      expect(suffixMatches!.length).toBeGreaterThan(10);
    });
  });

  describe("Outputs", () => {
    test("contains required outputs", () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"/);
      expect(stackContent).toMatch(/output\s+"alb_dns_name"/);
      expect(stackContent).toMatch(/output\s+"central_logs_bucket"/);
      expect(stackContent).toMatch(/output\s+"rds_endpoint"/);
      expect(stackContent).toMatch(/output\s+"secret_arn"/);
      expect(stackContent).toMatch(/output\s+"ec2_asg_name"/);
      expect(stackContent).toMatch(/output\s+"sns_topic_arn"/);
      expect(stackContent).toMatch(/output\s+"cloudwatch_log_group_ec2"/);
      expect(stackContent).toMatch(/output\s+"cloudwatch_log_group_rds"/);
    });

    test("sensitive outputs are marked as sensitive", () => {
      expect(stackContent).toMatch(/output\s+"rds_endpoint"[\s\S]*sensitive\s*=\s*true/);
    });

    test("outputs have proper descriptions", () => {
      expect(stackContent).toMatch(/description\s*=\s*"ID of the VPC"/);
      expect(stackContent).toMatch(/description\s*=\s*"DNS name of the Application Load Balancer"/);
      expect(stackContent).toMatch(/description\s*=\s*"Name of the central logging S3 bucket"/);
      expect(stackContent).toMatch(/description\s*=\s*"Name of the Auto Scaling Group for application instances"/);
      expect(stackContent).toMatch(/description\s*=\s*"ARN of the SNS topic for monitoring alerts and notifications"/);
    });
  });

  describe("Security Best Practices", () => {
    test("no hardcoded secrets or credentials", () => {
      expect(stackContent).not.toMatch(/password\s*=\s*"[^$]/);
      expect(stackContent).not.toMatch(/secret\s*=\s*"[^$]/);
      expect(stackContent).not.toMatch(/access_key\s*=\s*"[^$]/);
      expect(stackContent).not.toMatch(/secret_key\s*=\s*"[^$]/);
    });

    test("encryption is enabled for all applicable resources", () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("deletion protection is disabled for testing", () => {
      expect(stackContent).toMatch(/deletion_protection\s*=\s*false/);
      expect(stackContent).toMatch(/enable_deletion_protection\s*=\s*false/);
      expect(stackContent).toMatch(/recovery_window_in_days\s*=\s*0/);
    });

    test("proper CIDR blocks and network segmentation", () => {
      expect(stackContent).toMatch(/10\.0\.0\.0\/16/);
      expect(stackContent).toMatch(/10\.0\.1\.0\/24/);
      expect(stackContent).toMatch(/10\.0\.11\.0\/24/);
    });

    test("DNS is properly enabled", () => {
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });
  });

  describe("Resource Dependencies", () => {
    test("NAT Gateways depend on Internet Gateway", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test("CloudTrail depends on S3 bucket policy", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_s3_bucket_policy\.logs\]/);
    });

    test("Config recorder depends on delivery channel", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_config_delivery_channel\.main\]/);
    });

    test("Config rules depend on configuration recorder", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_config_configuration_recorder\.main\]/);
    });
  });

  describe("Data Resource References", () => {
    test("uses data sources for account ID and region", () => {
      expect(stackContent).toMatch(/\$\{data\.aws_caller_identity\.current\.account_id\}/);
      expect(stackContent).toMatch(/\$\{data\.aws_region\.current\.id\}/);
    });

    test("uses availability zones data for subnet placement", () => {
      expect(stackContent).toMatch(/data\.aws_availability_zones\.available\.names\[0\]/);
      expect(stackContent).toMatch(/data\.aws_availability_zones\.available\.names\[1\]/);
    });

    test("uses ELB service account data for ALB logs", () => {
      expect(stackContent).toMatch(/data\s+"aws_elb_service_account"\s+"main"/);
      expect(stackContent).toMatch(/data\.aws_elb_service_account\.main\.arn/);
    });

    test("data sources have proper configuration", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
      expect(stackContent).toMatch(/data\s+"aws_region"\s+"current"/);
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });

    test("availability zones filter for available state", () => {
      expect(stackContent).toMatch(/state\s*=\s*"available"/);
    });
  });

  // Enhanced KMS Testing
  describe("Enhanced KMS Configuration", () => {
    test("main KMS key has rotation enabled", () => {
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("KMS keys have proper deletion window", () => {
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*10/);
    });

    test("CloudTrail KMS key has proper service permissions", () => {
      expect(stackContent).toMatch(/Service.*=.*cloudtrail\.amazonaws\.com/);
    });

    test("KMS aliases follow naming convention", () => {
      expect(stackContent).toMatch(/alias\/main-key-/);
      expect(stackContent).toMatch(/alias\/cloudtrail-key-/);
    });

    test("KMS key ARNs are properly referenced", () => {
      expect(stackContent).toMatch(/aws_kms_key\.main\.arn/);
      expect(stackContent).toMatch(/aws_kms_key\.cloudtrail\.arn/);
    });

    test("KMS key descriptions are meaningful", () => {
      expect(stackContent).toMatch(/description\s*=\s*"Main KMS key for encryption"/);
      expect(stackContent).toMatch(/description\s*=\s*"KMS key for CloudTrail encryption"/);
    });
  });

  // Enhanced VPC Testing
  describe("Enhanced VPC Configuration", () => {
    test("VPC has proper CIDR block size", () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("VPC enables DNS support and hostnames", () => {
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("public subnets have different CIDR blocks", () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.1\.0\/24"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.2\.0\/24"/);
    });

    test("private subnets have different CIDR blocks", () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.11\.0\/24"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.12\.0\/24"/);
    });

    test("public subnets auto-assign public IPs", () => {
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("NAT gateways have proper EIP allocation", () => {
      expect(stackContent).toMatch(/allocation_id\s*=\s*aws_eip\.nat_1\.id/);
      expect(stackContent).toMatch(/allocation_id\s*=\s*aws_eip\.nat_2\.id/);
    });

    test("EIPs are in VPC domain", () => {
      expect(stackContent).toMatch(/domain\s*=\s*"vpc"/);
    });

    test("route tables have proper CIDR routing", () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
    });

    test("route table associations exist for all subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public_1"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public_2"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private_1"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private_2"/);
    });
  });

  // Enhanced S3 Testing
  describe("Enhanced S3 Configuration", () => {
    test("S3 buckets use account ID in naming", () => {
      expect(stackContent).toMatch(/\$\{data\.aws_caller_identity\.current\.account_id\}/);
    });

    test("S3 bucket lifecycle has proper transitions", () => {
      expect(stackContent).toMatch(/days\s*=\s*30/);
      expect(stackContent).toMatch(/storage_class\s*=\s*"STANDARD_IA"/);
      expect(stackContent).toMatch(/days\s*=\s*90/);
      expect(stackContent).toMatch(/storage_class\s*=\s*"GLACIER"/);
    });

    test("S3 bucket policies allow CloudTrail access", () => {
      expect(stackContent).toMatch(/AWSCloudTrailAclCheck/);
      expect(stackContent).toMatch(/AWSCloudTrailWrite/);
    });

    test("S3 bucket policies allow AWS Config access", () => {
      expect(stackContent).toMatch(/AWSConfigBucketPermissionsCheck/);
      expect(stackContent).toMatch(/AWSConfigBucketDelivery/);
    });

    test("S3 bucket policies allow VPC Flow Logs", () => {
      expect(stackContent).toMatch(/VPCFlowLogsDelivery/);
      expect(stackContent).toMatch(/VPCFlowLogsAclCheck/);
    });

    test("ALB logs bucket has proper ELB service account permissions", () => {
      expect(stackContent).toMatch(/data\.aws_elb_service_account\.main\.arn/);
    });

    test("S3 buckets have purpose tags", () => {
      expect(stackContent).toMatch(/Purpose\s*=\s*"central-logging"/);
      expect(stackContent).toMatch(/Purpose\s*=\s*"alb-logging"/);
    });
  });

  // Enhanced RDS Testing
  describe("Enhanced RDS Configuration", () => {
    test("RDS uses MySQL 8.0 engine", () => {
      expect(stackContent).toMatch(/engine\s*=\s*"mysql"/);
      expect(stackContent).toMatch(/engine_version\s*=\s*"8\.0"/);
    });

    test("RDS uses appropriate instance class", () => {
      expect(stackContent).toMatch(/instance_class\s*=\s*"db\.t3\.micro"/);
    });

    test("RDS has proper storage configuration", () => {
      expect(stackContent).toMatch(/allocated_storage\s*=\s*20/);
      expect(stackContent).toMatch(/max_allocated_storage\s*=\s*100/);
    });

    test("RDS has proper backup configuration", () => {
      expect(stackContent).toMatch(/backup_retention_period\s*=\s*7/);
      expect(stackContent).toMatch(/backup_window\s*=\s*"03:00-04:00"/);
    });

    test("RDS has proper maintenance window", () => {
      expect(stackContent).toMatch(/maintenance_window\s*=\s*"sun:04:00-sun:05:00"/);
    });

    test("RDS has CloudWatch logs exports enabled", () => {
      expect(stackContent).toMatch(/"error",\s*"general",\s*"slowquery"/);
    });

    test("RDS has Performance Insights enabled", () => {
      expect(stackContent).toMatch(/performance_insights_enabled\s*=\s*true/);
      expect(stackContent).toMatch(/performance_insights_kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("RDS has enhanced monitoring with proper interval", () => {
      expect(stackContent).toMatch(/monitoring_interval\s*=\s*60/);
      expect(stackContent).toMatch(/monitoring_role_arn\s*=\s*aws_iam_role\.rds_enhanced_monitoring\.arn/);
    });

    test("RDS deletion protection is disabled for testing", () => {
      expect(stackContent).toMatch(/deletion_protection\s*=\s*false/);
      expect(stackContent).toMatch(/skip_final_snapshot\s*=\s*true/);
    });

    test("RDS has proper database name", () => {
      expect(stackContent).toMatch(/db_name\s*=\s*"appdb"/);
    });

    test("RDS username is admin", () => {
      expect(stackContent).toMatch(/username\s*=\s*"admin"/);
    });
  });

  // Enhanced Security Groups Testing
  describe("Enhanced Security Groups Configuration", () => {
    test("RDS security group allows MySQL port only", () => {
      expect(stackContent).toMatch(/from_port\s*=\s*3306/);
      expect(stackContent).toMatch(/to_port\s*=\s*3306/);
      expect(stackContent).toMatch(/protocol\s*=\s*"tcp"/);
    });

    test("application security group allows HTTP and HTTPS", () => {
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
      expect(stackContent).toMatch(/to_port\s*=\s*443/);
      expect(stackContent).toMatch(/from_port\s*=\s*80/);
      expect(stackContent).toMatch(/to_port\s*=\s*80/);
    });

    test("ALB security group allows internet access", () => {
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });

    test("security groups have proper descriptions", () => {
      expect(stackContent).toMatch(/description\s*=\s*"Security group for RDS database"/);
      expect(stackContent).toMatch(/description\s*=\s*"Security group for application servers"/);
      expect(stackContent).toMatch(/description\s*=\s*"Security group for Application Load Balancer"/);
    });

    test("security groups allow all outbound traffic", () => {
      expect(stackContent).toMatch(/from_port\s*=\s*0/);
      expect(stackContent).toMatch(/to_port\s*=\s*0/);
      expect(stackContent).toMatch(/protocol\s*=\s*"-1"/);
    });

    test("RDS security group only allows app security group access", () => {
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.app\.id\]/);
    });

    test("app security group only allows ALB access", () => {
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });
  });

  // Enhanced ALB Testing
  describe("Enhanced ALB Configuration", () => {
    test("ALB is internet-facing", () => {
      expect(stackContent).toMatch(/internal\s*=\s*false/);
    });

    test("ALB is application type", () => {
      expect(stackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
    });

    test("ALB has HTTP/2 enabled", () => {
      expect(stackContent).toMatch(/enable_http2\s*=\s*true/);
    });

    test("ALB has cross-zone load balancing", () => {
      expect(stackContent).toMatch(/enable_cross_zone_load_balancing\s*=\s*true/);
    });

    test("ALB deletion protection is disabled", () => {
      expect(stackContent).toMatch(/enable_deletion_protection\s*=\s*false/);
    });

    test("ALB target group has proper health checks", () => {
      expect(stackContent).toMatch(/healthy_threshold\s*=\s*2/);
      expect(stackContent).toMatch(/unhealthy_threshold\s*=\s*2/);
      expect(stackContent).toMatch(/timeout\s*=\s*5/);
      expect(stackContent).toMatch(/interval\s*=\s*30/);
    });

    test("ALB listener redirects HTTP to HTTPS", () => {
      expect(stackContent).toMatch(/port\s*=\s*"443"/);
      expect(stackContent).toMatch(/protocol\s*=\s*"HTTPS"/);
      expect(stackContent).toMatch(/status_code\s*=\s*"HTTP_301"/);
    });

    test("ALB target group health check path is root", () => {
      expect(stackContent).toMatch(/path\s*=\s*"\/"/);
    });

    test("ALB target group health check expects 200", () => {
      expect(stackContent).toMatch(/matcher\s*=\s*"200"/);
    });

    test("ALB uses public subnets", () => {
      expect(stackContent).toMatch(/subnets\s*=\s*\[aws_subnet\.public_1\.id,\s*aws_subnet\.public_2\.id\]/);
    });
  });

  // Enhanced WAF Testing
  describe("Enhanced WAF Configuration", () => {
    test("WAF is regional scope", () => {
      expect(stackContent).toMatch(/scope\s*=\s*"REGIONAL"/);
    });

    test("WAF has default allow action", () => {
      expect(stackContent).toMatch(/allow\s*\{\}/);
    });

    test("WAF has Core Rule Set", () => {
      expect(stackContent).toMatch(/AWSManagedRulesCommonRuleSet/);
      expect(stackContent).toMatch(/priority\s*=\s*1/);
    });

    test("WAF has Known Bad Inputs Rule Set", () => {
      expect(stackContent).toMatch(/AWSManagedRulesKnownBadInputsRuleSet/);
      expect(stackContent).toMatch(/priority\s*=\s*2/);
    });

    test("WAF has SQL Injection Rule Set", () => {
      expect(stackContent).toMatch(/AWSManagedRulesSQLiRuleSet/);
      expect(stackContent).toMatch(/priority\s*=\s*3/);
    });

    test("WAF rules have CloudWatch metrics enabled", () => {
      expect(stackContent).toMatch(/cloudwatch_metrics_enabled\s*=\s*true/);
      expect(stackContent).toMatch(/sampled_requests_enabled\s*=\s*true/);
    });

    test("WAF rules have proper vendor", () => {
      expect(stackContent).toMatch(/vendor_name\s*=\s*"AWS"/);
    });

    test("WAF has proper association with ALB", () => {
      expect(stackContent).toMatch(/resource_arn\s*=\s*aws_lb\.main\.arn/);
      expect(stackContent).toMatch(/web_acl_arn\s*=\s*aws_wafv2_web_acl\.main\.arn/);
    });
  });

  // Enhanced IAM Testing
  describe("Enhanced IAM Configuration", () => {
    test("Config role has proper assume role policy", () => {
      expect(stackContent).toMatch(/Service.*=.*config\.amazonaws\.com/);
    });

    test("Flow logs role has proper assume role policy", () => {
      expect(stackContent).toMatch(/Service.*=.*vpc-flow-logs\.amazonaws\.com/);
    });

    test("RDS monitoring role has proper assume role policy", () => {
      expect(stackContent).toMatch(/Service.*=.*monitoring\.rds\.amazonaws\.com/);
    });

    test("application instance role has EC2 assume role policy", () => {
      expect(stackContent).toMatch(/Service.*=.*ec2\.amazonaws\.com/);
    });

    test("IAM user is created for MFA testing", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_user"\s+"app_user"/);
    });

    test("MFA enforcement policy denies actions without MFA", () => {
      expect(stackContent).toMatch(/DenyAllExceptListedIfNoMFA/);
      expect(stackContent).toMatch(/"aws:MultiFactorAuthPresent"\s*=\s*"false"/);
    });

    test("application role can access secrets", () => {
      expect(stackContent).toMatch(/"secretsmanager:GetSecretValue"/);
      expect(stackContent).toMatch(/"secretsmanager:DescribeSecret"/);
    });

    test("application role can decrypt with KMS", () => {
      expect(stackContent).toMatch(/"kms:Decrypt"/);
      expect(stackContent).toMatch(/"kms:DescribeKey"/);
    });

    test("Config role has AWS managed policy attached", () => {
      expect(stackContent).toMatch(/arn:aws:iam::aws:policy\/service-role\/ConfigRole/);
    });

    test("RDS monitoring role has AWS managed policy attached", () => {
      expect(stackContent).toMatch(/arn:aws:iam::aws:policy\/service-role\/AmazonRDSEnhancedMonitoringRole/);
    });

    test("IAM group for MFA is created", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_group"\s+"mfa_enforced"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_user_group_membership"\s+"app_user"/);
    });
  });

  // Enhanced Secrets Manager Testing
  describe("Enhanced Secrets Manager Configuration", () => {
    test("secret has immediate deletion for testing", () => {
      expect(stackContent).toMatch(/recovery_window_in_days\s*=\s*0/);
    });

    test("random password has proper length and complexity", () => {
      expect(stackContent).toMatch(/length\s*=\s*32/);
      expect(stackContent).toMatch(/special\s*=\s*true/);
    });

    test("secret version contains all required database info", () => {
      expect(stackContent).toMatch(/username.*=.*admin/);
      expect(stackContent).toMatch(/engine.*=.*mysql/);
      expect(stackContent).toMatch(/port.*=.*3306/);
    });

    test("secret references RDS endpoint dynamically", () => {
      expect(stackContent).toMatch(/host.*=.*aws_db_instance\.main\.endpoint/);
      expect(stackContent).toMatch(/dbname.*=.*aws_db_instance\.main\.db_name/);
    });

    test("secret uses generated password", () => {
      expect(stackContent).toMatch(/password\s*=\s*random_password\.rds\.result/);
    });
  });

  // Enhanced CloudTrail Testing
  describe("Enhanced CloudTrail Configuration", () => {
    test("CloudTrail is multi-region", () => {
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test("CloudTrail includes global service events", () => {
      expect(stackContent).toMatch(/include_global_service_events\s*=\s*true/);
    });

    test("CloudTrail has log file validation enabled", () => {
      expect(stackContent).toMatch(/enable_log_file_validation\s*=\s*true/);
    });

    test("CloudTrail has data events for S3 and Lambda", () => {
      expect(stackContent).toMatch(/"AWS::S3::Object"/);
      expect(stackContent).toMatch(/"AWS::Lambda::Function"/);
    });

    test("CloudTrail uses KMS encryption", () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.cloudtrail\.arn/);
    });

    test("CloudTrail has proper S3 key prefix", () => {
      expect(stackContent).toMatch(/s3_key_prefix\s*=\s*"cloudtrail"/);
    });

    test("CloudTrail captures all read/write events", () => {
      expect(stackContent).toMatch(/read_write_type\s*=\s*"All"/);
      expect(stackContent).toMatch(/include_management_events\s*=\s*true/);
    });
  });

  // Enhanced AWS Config Testing
  describe("Enhanced AWS Config Configuration", () => {
    test("Config recorder records all resources", () => {
      expect(stackContent).toMatch(/all_supported\s*=\s*true/);
      expect(stackContent).toMatch(/include_global_resource_types\s*=\s*true/);
    });

    test("Config delivery channel has proper S3 configuration", () => {
      expect(stackContent).toMatch(/s3_bucket_name\s*=\s*aws_s3_bucket\.logs\.bucket/);
      expect(stackContent).toMatch(/s3_key_prefix\s*=\s*"config"/);
    });

    test("Config recorder is enabled", () => {
      expect(stackContent).toMatch(/is_enabled\s*=\s*true/);
    });

    test("Config has S3 encryption rule", () => {
      expect(stackContent).toMatch(/S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED/);
    });

    test("Config has RDS encryption rule", () => {
      expect(stackContent).toMatch(/RDS_STORAGE_ENCRYPTED/);
    });

    test("Config has MFA rule", () => {
      expect(stackContent).toMatch(/MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS/);
    });

    test("Config rules are AWS managed", () => {
      expect(stackContent).toMatch(/owner\s*=\s*"AWS"/);
    });
  });

  // Enhanced VPC Flow Logs Testing
  describe("Enhanced VPC Flow Logs Configuration", () => {
    test("Flow logs capture all traffic", () => {
      expect(stackContent).toMatch(/traffic_type\s*=\s*"ALL"/);
    });

    test("Flow logs use S3 destination", () => {
      expect(stackContent).toMatch(/log_destination_type\s*=\s*"s3"/);
    });

    test("Flow logs have proper aggregation interval", () => {
      expect(stackContent).toMatch(/max_aggregation_interval\s*=\s*60/);
    });

    test("Flow logs have proper S3 path", () => {
      expect(stackContent).toMatch(/\/vpc-flow-logs\//);
    });

    test("Flow logs have proper IAM role", () => {
      expect(stackContent).toMatch(/iam_role_arn\s*=\s*aws_iam_role\.flow_logs\.arn/);
    });
  });

  // Enhanced CloudWatch Testing
  describe("Enhanced CloudWatch Configuration", () => {
    test("CloudWatch log group for RDS exists", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"rds"/);
    });

    test("CloudWatch log group for EC2 exists", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"ec2"/);
    });

    test("CloudWatch log group has proper retention", () => {
      expect(stackContent).toMatch(/retention_in_days\s*=\s*7/);
    });

    test("CloudWatch log group uses KMS encryption", () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("CloudWatch log group has proper name pattern", () => {
      expect(stackContent).toMatch(/\/aws\/rds\/secure-app-prod/);
      expect(stackContent).toMatch(/\/aws\/ec2\/secure-app-prod/);
    });
  });

  // Resource Count and Coverage Testing
  describe("Resource Count and Coverage", () => {
    test("has minimum required number of resources", () => {
      const resourceMatches = stackContent.match(/resource\s+"/g);
      expect(resourceMatches).not.toBeNull();
      expect(resourceMatches!.length).toBeGreaterThan(40);
    });

    test("has data sources for external references", () => {
      const dataMatches = stackContent.match(/data\s+"/g);
      expect(dataMatches).not.toBeNull();
      expect(dataMatches!.length).toBeGreaterThan(3);
    });

    test("has output values for important resources", () => {
      const outputMatches = stackContent.match(/output\s+"/g);
      expect(outputMatches).not.toBeNull();
      expect(outputMatches!.length).toBeGreaterThanOrEqual(5);
    });

    test("uses random resources for uniqueness", () => {
      expect(stackContent).toMatch(/resource\s+"random_/);
    });
  });
});
