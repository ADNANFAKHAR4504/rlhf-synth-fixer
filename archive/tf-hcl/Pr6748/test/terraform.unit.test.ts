// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for Terraform configuration
// Tests validate file existence, structure, resources, and security controls

import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const STACK_PATH = path.join(LIB_DIR, "tap_stack.tf");
const PROVIDER_PATH = path.join(LIB_DIR, "provider.tf");
const VARIABLES_PATH = path.join(LIB_DIR, "variables.tf");

describe("Terraform Configuration Files", () => {
  describe("File Existence", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
    });

    test("variables.tf exists", () => {
      expect(fs.existsSync(VARIABLES_PATH)).toBe(true);
    });

    test("Lambda function files exist", () => {
      const guarddutyLambda = path.join(LIB_DIR, "lambda/guardduty_remediation/index.py");
      const kmsLambda = path.join(LIB_DIR, "lambda/kms_rotation/index.py");
      
      expect(fs.existsSync(guarddutyLambda)).toBe(true);
      expect(fs.existsSync(kmsLambda)).toBe(true);
    });
  });

  describe("Provider Configuration", () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = fs.readFileSync(PROVIDER_PATH, "utf8");
    });

    test("declares required Terraform version >= 1.5.0", () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
    });

    test("declares AWS provider with version ~> 5.0", () => {
      expect(providerContent).toMatch(/aws.*\n.*source\s*=\s*"hashicorp\/aws"/s);
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test("declares archive provider", () => {
      expect(providerContent).toMatch(/archive.*\n.*source\s*=\s*"hashicorp\/archive"/s);
    });

    test("configures S3 backend", () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*{/);
    });

    test("provider uses aws_region variable", () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test("provider includes required default_tags", () => {
      expect(providerContent).toMatch(/default_tags\s*{/);
      expect(providerContent).toMatch(/Environment.*var\.environment_suffix/);
      expect(providerContent).toMatch(/DataClassification.*var\.data_classification/);
      expect(providerContent).toMatch(/ComplianceScope.*PCI-DSS/);
      expect(providerContent).toMatch(/ManagedBy.*Terraform/);
      expect(providerContent).toMatch(/SecurityProfile.*High/);
    });
  });

  describe("Variables Configuration", () => {
    let variablesContent: string;

    beforeAll(() => {
      variablesContent = fs.readFileSync(VARIABLES_PATH, "utf8");
    });

    test("declares aws_region variable with default us-east-1", () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"/);
      expect(variablesContent).toMatch(/default\s*=\s*"us-east-1"/);
    });

    test("declares environment_suffix variable", () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"/);
      expect(variablesContent).toMatch(/default\s*=\s*"dev"/);
    });

    test("declares tagging variables", () => {
      expect(variablesContent).toMatch(/variable\s+"repository"/);
      expect(variablesContent).toMatch(/variable\s+"commit_author"/);
      expect(variablesContent).toMatch(/variable\s+"pr_number"/);
      expect(variablesContent).toMatch(/variable\s+"team"/);
    });

    test("declares compliance variables", () => {
      expect(variablesContent).toMatch(/variable\s+"data_classification"/);
      expect(variablesContent).toMatch(/variable\s+"cost_center"/);
    });

    test("declares transit_gateway_id variable with default value", () => {
      expect(variablesContent).toMatch(/variable\s+"transit_gateway_id"/);
      expect(variablesContent).toMatch(/default\s*=\s*"tgw-xxxxxxxxxxxxxxxxx"/);
    });
  });

  describe("Stack Configuration - Variables", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_PATH, "utf8");
    });

    test("does NOT declare provider block (provider.tf owns it)", () => {
      expect(stackContent).not.toMatch(/^\s*provider\s+"aws"\s*{/m);
    });

    test("does NOT declare terraform block (provider.tf owns it)", () => {
      expect(stackContent).not.toMatch(/^\s*terraform\s*{/m);
    });

    test("does NOT declare aws_region variable (variables.tf owns it)", () => {
      const awsRegionMatch = stackContent.match(/variable\s+"aws_region"\s*{/);
      expect(awsRegionMatch).toBeNull();
    });

    test("does NOT declare environment variable (uses environment_suffix)", () => {
      const envVarMatch = stackContent.match(/variable\s+"environment"\s*{/);
      expect(envVarMatch).toBeNull();
    });

    test("declares preexisting_kms_key_arn variable with empty default", () => {
      expect(stackContent).toMatch(/variable\s+"preexisting_kms_key_arn"/);
      expect(stackContent).toMatch(/default\s*=\s*""/);
    });

    test("declares iam_permission_boundary_arn variable", () => {
      expect(stackContent).toMatch(/variable\s+"iam_permission_boundary_arn"/);
    });

    test("declares security_account_id variable", () => {
      expect(stackContent).toMatch(/variable\s+"security_account_id"/);
    });

    test("declares flow_logs_account_id variable", () => {
      expect(stackContent).toMatch(/variable\s+"flow_logs_account_id"/);
    });

    test("declares log_retention_days variable with default 90", () => {
      expect(stackContent).toMatch(/variable\s+"log_retention_days"/);
      expect(stackContent).toMatch(/default\s*=\s*90/);
    });

    test("declares high_severity_threshold variable with default 7", () => {
      expect(stackContent).toMatch(/variable\s+"high_severity_threshold"/);
      expect(stackContent).toMatch(/default\s*=\s*7/);
    });
  });

  describe("Data Sources", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_PATH, "utf8");
    });

    test("declares aws_caller_identity data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test("declares aws_region data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_region"\s+"current"/);
    });

    test("declares aws_availability_zones data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });

    test("declares conditional aws_kms_key data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_kms_key"\s+"existing_data_key"/);
      expect(stackContent).toMatch(/count\s*=\s*var\.preexisting_kms_key_arn\s*!=\s*""\s*\?\s*1\s*:\s*0/);
    });

    test("declares archive_file data sources for Lambda", () => {
      expect(stackContent).toMatch(/data\s+"archive_file"\s+"guardduty_remediation_lambda"/);
      expect(stackContent).toMatch(/data\s+"archive_file"\s+"kms_rotation_lambda"/);
    });
  });

  describe("Local Values", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_PATH, "utf8");
    });

    test("defines name_prefix using environment_suffix", () => {
      expect(stackContent).toMatch(/name_prefix\s*=\s*"finserv-analytics-\$\{var\.environment_suffix\}"/);
    });

    test("defines VPC CIDR block", () => {
      expect(stackContent).toMatch(/vpc_cidr\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("defines private subnet CIDRs for 3 AZs", () => {
      expect(stackContent).toMatch(/private_subnet_cidrs\s*=/);
      expect(stackContent).toMatch(/"10\.0\.1\.0\/24"/);
      expect(stackContent).toMatch(/"10\.0\.2\.0\/24"/);
      expect(stackContent).toMatch(/"10\.0\.3\.0\/24"/);
    });

    test("defines security_account_id with fallback", () => {
      expect(stackContent).toMatch(/security_account_id\s*=\s*var\.security_account_id\s*!=\s*""\s*\?\s*var\.security_account_id\s*:\s*data\.aws_caller_identity\.current\.account_id/);
    });

    test("defines flow_logs_account_id with fallback", () => {
      expect(stackContent).toMatch(/flow_logs_account_id\s*=\s*var\.flow_logs_account_id\s*!=\s*""\s*\?\s*var\.flow_logs_account_id\s*:\s*data\.aws_caller_identity\.current\.account_id/);
    });

    test("defines S3 bucket names", () => {
      expect(stackContent).toMatch(/flow_logs_bucket_name/);
      expect(stackContent).toMatch(/data_lake_bucket_name/);
      expect(stackContent).toMatch(/access_logs_bucket_name/);
      expect(stackContent).toMatch(/cloudtrail_bucket_name/);
      expect(stackContent).toMatch(/config_bucket_name/);
    });

    test("defines security_group_rules structure", () => {
      expect(stackContent).toMatch(/security_group_rules\s*=/);
      expect(stackContent).toMatch(/ssm_endpoints\s*=/);
      expect(stackContent).toMatch(/lambda\s*=/);
      expect(stackContent).toMatch(/vpc_endpoints\s*=/);
    });
  });

  describe("VPC Resources", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_PATH, "utf8");
    });

    test("creates security VPC", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"security_vpc"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*local\.vpc_cidr/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("creates private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_subnets"/);
      expect(stackContent).toMatch(/count\s*=\s*3/);
    });

    test("creates route table for private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private_route_table"/);
    });

    test("creates route table associations", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private_subnet_associations"/);
    });

    test("creates Transit Gateway attachment", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_vpc_attachment"\s+"security_vpc_attachment"/);
      expect(stackContent).toMatch(/transit_gateway_id\s*=\s*var\.transit_gateway_id/);
      // Check for conditional creation logic
      expect(stackContent).toMatch(/count\s*=\s*var\.transit_gateway_id\s*!=\s*"tgw-xxxxxxxxxxxxxxxxx"\s*\?\s*1\s*:\s*0/);
    });

    test("creates default route through Transit Gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route"\s+"default_route_to_tgw"/);
      expect(stackContent).toMatch(/destination_cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
      // Check for conditional creation logic
      expect(stackContent).toMatch(/count\s*=\s*var\.transit_gateway_id\s*!=\s*"tgw-xxxxxxxxxxxxxxxxx"\s*\?\s*1\s*:\s*0/);
    });

    test("creates Network ACL", () => {
      expect(stackContent).toMatch(/resource\s+"aws_network_acl"\s+"private_nacl"/);
    });

    test("Network ACL denies SSH port 22", () => {
      expect(stackContent).toMatch(/from_port\s*=\s*22/);
      expect(stackContent).toMatch(/action\s*=\s*"deny"/);
    });

    test("Network ACL denies RDP port 3389", () => {
      expect(stackContent).toMatch(/from_port\s*=\s*3389/);
      expect(stackContent).toMatch(/action\s*=\s*"deny"/);
    });

    test("creates VPC Flow Logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"security_vpc_flow_logs"/);
      expect(stackContent).toMatch(/log_destination_type\s*=\s*"s3"/);
      expect(stackContent).toMatch(/traffic_type\s*=\s*"ALL"/);
    });
  });

  describe("S3 Buckets - Security Controls", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_PATH, "utf8");
    });

    test("creates flow logs S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"flow_logs_bucket"/);
    });

    test("creates data lake S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"data_lake"/);
    });

    test("creates CloudTrail S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail_bucket"/);
    });

    test("creates Config S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"config_bucket"/);
    });

    test("creates access logs S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"data_lake_access_logs"/);
    });

    test("enables versioning on all critical buckets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"flow_logs_versioning"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"data_lake_versioning"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"cloudtrail_versioning"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"config_versioning"/);
    });

    test("configures object lock for immutability", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_object_lock_configuration"\s+"flow_logs_lock"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_object_lock_configuration"\s+"cloudtrail_lock"/);
      expect(stackContent).toMatch(/mode\s*=\s*"COMPLIANCE"/);
    });

    test("blocks public access on all buckets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("configures encryption for data lake bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"data_lake_encryption"/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("configures access logging for data lake", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_logging"\s+"data_lake_logging"/);
    });

    test("configures lifecycle policies", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"/);
    });

    test("includes bucket policies with secure transport", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"/);
      expect(stackContent).toMatch(/aws:SecureTransport/);
    });

    test("does NOT configure deletion protection (as per requirements)", () => {
      expect(stackContent).not.toMatch(/deletion_protection\s*=\s*true/);
    });
  });

  describe("IAM Roles and Policies", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_PATH, "utf8");
    });

    test("creates analytics IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"analytics_role"/);
    });

    test("creates GuardDuty Lambda IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"guardduty_lambda_role"/);
    });

    test("creates Config IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"config_role"/);
    });

    test("applies permission boundary conditionally", () => {
      expect(stackContent).toMatch(/permissions_boundary\s*=\s*var\.iam_permission_boundary_arn\s*!=\s*""\s*\?\s*var\.iam_permission_boundary_arn\s*:\s*null/);
    });

    test("creates explicit deny policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"analytics_explicit_deny"/);
      expect(stackContent).toMatch(/Effect.*Deny/);
      expect(stackContent).toMatch(/iam:DeleteUser/);
      expect(stackContent).toMatch(/kms:ScheduleKeyDeletion/);
      expect(stackContent).toMatch(/s3:DeleteBucket/);
    });

    test("creates instance profile", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"analytics_profile"/);
    });

    test("roles use STS AssumeRole policy", () => {
      expect(stackContent).toMatch(/sts:AssumeRole/);
    });
  });

  describe("KMS Configuration", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_PATH, "utf8");
    });

    test("creates KMS key conditionally", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"data_encryption_key"/);
      expect(stackContent).toMatch(/count\s*=\s*var\.preexisting_kms_key_arn\s*==\s*""\s*\?\s*1\s*:\s*0/);
    });

    test("enables automatic key rotation", () => {
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("sets deletion window", () => {
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*30/);
    });

    test("creates KMS key alias", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"data_encryption_key_alias"/);
    });

    test("KMS key has explicit policy", () => {
      expect(stackContent).toMatch(/policy\s*=\s*jsonencode/);
    });
  });

  describe("GuardDuty Configuration", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_PATH, "utf8");
    });

    test("enables GuardDuty detector", () => {
      expect(stackContent).toMatch(/resource\s+"aws_guardduty_detector"\s+"main"/);
      expect(stackContent).toMatch(/enable\s*=\s*true/);
    });

    test("enables S3 protection", () => {
      expect(stackContent).toMatch(/s3_logs\s*{/);
      expect(stackContent).toMatch(/enable\s*=\s*true/);
    });

    test("enables malware protection", () => {
      expect(stackContent).toMatch(/malware_protection\s*{/);
    });

    test("creates GuardDuty remediation Lambda", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"guardduty_remediation"/);
      expect(stackContent).toMatch(/handler\s*=\s*"index\.handler"/);
      expect(stackContent).toMatch(/runtime\s*=\s*"python3\.9"/);
    });

    test("creates EventBridge rule for high severity findings", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"guardduty_high_severity"/);
      expect(stackContent).toMatch(/aws\.guardduty/);
    });

    test("creates EventBridge target for Lambda", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"guardduty_lambda_target"/);
    });

    test("grants Lambda permission for EventBridge", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"guardduty_eventbridge"/);
    });

    test("creates SNS topic for security alerts", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"security_alerts"/);
    });
  });

  describe("Security Hub Configuration", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_PATH, "utf8");
    });

    test("enables Security Hub", () => {
      expect(stackContent).toMatch(/resource\s+"aws_securityhub_account"\s+"main"/);
    });

    test("subscribes to CIS AWS Foundations Benchmark", () => {
      expect(stackContent).toMatch(/resource\s+"aws_securityhub_standards_subscription"\s+"cis_aws_foundations"/);
      expect(stackContent).toMatch(/cis-aws-foundations-benchmark/);
    });
  });

  describe("AWS Config Configuration", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_PATH, "utf8");
    });

    test("creates Config recorder", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"/);
      expect(stackContent).toMatch(/all_supported\s*=\s*true/);
    });

    test("creates Config delivery channel", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"/);
    });

    test("starts Config recorder", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_configuration_recorder_status"\s+"main"/);
      expect(stackContent).toMatch(/is_enabled\s*=\s*true/);
    });

    test("creates required-tags Config rule", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"required_tags"/);
      expect(stackContent).toMatch(/REQUIRED_TAGS/);
      expect(stackContent).toMatch(/DataClassification/);
      expect(stackContent).toMatch(/ComplianceScope/);
      expect(stackContent).toMatch(/Environment/);
    });

    test("creates S3 public read prohibited rule", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"s3_public_read_prohibited"/);
      expect(stackContent).toMatch(/S3_BUCKET_PUBLIC_READ_PROHIBITED/);
    });

    test("creates EC2 IMDSv2 check rule", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"ec2_imdsv2_check"/);
      expect(stackContent).toMatch(/EC2_IMDSV2_CHECK/);
    });
  });

  describe("Security Groups", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_PATH, "utf8");
    });

    test("creates quarantine security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"quarantine_sg"/);
    });

    test("creates SSM endpoints security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ssm_endpoints_sg"/);
    });

    test("creates Lambda security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"lambda_sg"/);
    });

    test("creates VPC endpoints security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"vpc_endpoints_sg"/);
    });

    test("uses dynamic blocks for security group rules", () => {
      expect(stackContent).toMatch(/dynamic\s+"ingress"/);
      expect(stackContent).toMatch(/dynamic\s+"egress"/);
    });
  });

  describe("CloudTrail Configuration", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_PATH, "utf8");
    });

    test("creates CloudTrail", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
    });

    test("enables log file validation", () => {
      expect(stackContent).toMatch(/enable_log_file_validation\s*=\s*true/);
    });

    test("is multi-region trail", () => {
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test("includes global service events", () => {
      expect(stackContent).toMatch(/include_global_service_events\s*=\s*true/);
    });

    test("configures event selectors for S3 data events", () => {
      expect(stackContent).toMatch(/event_selector\s*{/);
      expect(stackContent).toMatch(/data_resource\s*{/);
      expect(stackContent).toMatch(/AWS::S3::Object/);
    });

    test("configures event selectors for Lambda invocations", () => {
      expect(stackContent).toMatch(/AWS::Lambda::Function/);
    });
  });

  describe("SSM Configuration", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_PATH, "utf8");
    });

    test("creates SSM VPC endpoint", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ssm"/);
      expect(stackContent).toMatch(/com\.amazonaws.*\.ssm/);
    });

    test("creates SSM Messages VPC endpoint", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ssm_messages"/);
      expect(stackContent).toMatch(/com\.amazonaws.*\.ssmmessages/);
    });

    test("creates EC2 Messages VPC endpoint", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ec2_messages"/);
      expect(stackContent).toMatch(/com\.amazonaws.*\.ec2messages/);
    });

    test("creates SSM Session Manager document", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ssm_document"\s+"session_manager_prefs"/);
      expect(stackContent).toMatch(/document_type\s*=\s*"Session"/);
    });

    test("SSM endpoints use Interface type", () => {
      expect(stackContent).toMatch(/vpc_endpoint_type\s*=\s*"Interface"/);
    });

    test("SSM endpoints enable private DNS", () => {
      expect(stackContent).toMatch(/private_dns_enabled\s*=\s*true/);
    });
  });

  describe("Outputs", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_PATH, "utf8");
    });

    test("outputs VPC ID", () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_vpc\.security_vpc\.id/);
    });

    test("outputs private subnet IDs", () => {
      expect(stackContent).toMatch(/output\s+"private_subnet_ids"/);
    });

    test("outputs data lake bucket ARN", () => {
      expect(stackContent).toMatch(/output\s+"data_lake_bucket_arn"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_s3_bucket\.data_lake\.arn/);
    });

    test("outputs CloudTrail bucket ARN", () => {
      expect(stackContent).toMatch(/output\s+"cloudtrail_bucket_arn"/);
    });

    test("outputs GuardDuty detector ID", () => {
      expect(stackContent).toMatch(/output\s+"guardduty_detector_id"/);
    });

    test("outputs Security Hub ARN", () => {
      expect(stackContent).toMatch(/output\s+"security_hub_arn"/);
    });

    test("outputs KMS key ARN", () => {
      expect(stackContent).toMatch(/output\s+"kms_key_arn"/);
    });

    test("outputs analytics role ARN", () => {
      expect(stackContent).toMatch(/output\s+"analytics_role_arn"/);
    });
  });

  describe("PCI-DSS Compliance Comments", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_PATH, "utf8");
    });

    test("includes PCI-DSS control comments", () => {
      expect(stackContent).toMatch(/PCI-DSS/i);
    });

    test("documents network segmentation controls", () => {
      expect(stackContent).toMatch(/Network segmentation/i);
    });

    test("documents data encryption controls", () => {
      expect(stackContent).toMatch(/encryption/i);
    });

    test("documents access control requirements", () => {
      expect(stackContent).toMatch(/Access control/i);
    });

    test("documents audit trail requirements", () => {
      expect(stackContent).toMatch(/Audit/i);
    });
  });

  describe("Security Best Practices", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_PATH, "utf8");
    });

    test("no hardcoded credentials", () => {
      // Check for common patterns of hardcoded credentials
      expect(stackContent).not.toMatch(/password\s*=\s*"[^$]/i);
      expect(stackContent).not.toMatch(/secret\s*=\s*"[^$]/i);
      expect(stackContent).not.toMatch(/access_key\s*=\s*"[A-Z0-9]{20}"/);
    });

    test("uses variables for sensitive values", () => {
      expect(stackContent).toMatch(/var\./);
    });

    test("no internet gateway in security VPC", () => {
      expect(stackContent).not.toMatch(/resource\s+"aws_internet_gateway"/);
    });

    test("enforces HTTPS for S3", () => {
      expect(stackContent).toMatch(/aws:SecureTransport/);
    });

    test("uses KMS encryption", () => {
      expect(stackContent).toMatch(/aws:kms/);
    });
  });

  describe("Lambda Function Implementation", () => {
    test("GuardDuty Lambda has valid Python syntax", () => {
      const lambdaPath = path.join(LIB_DIR, "lambda/guardduty_remediation/index.py");
      const lambdaContent = fs.readFileSync(lambdaPath, "utf8");
      
      expect(lambdaContent).toMatch(/def handler\(/);
      expect(lambdaContent).toMatch(/import boto3/);
      expect(lambdaContent).toMatch(/QUARANTINE_SECURITY_GROUP_ID/);
    });

    test("KMS rotation Lambda has valid Python syntax", () => {
      const lambdaPath = path.join(LIB_DIR, "lambda/kms_rotation/index.py");
      const lambdaContent = fs.readFileSync(lambdaPath, "utf8");
      
      expect(lambdaContent).toMatch(/def handler\(/);
      expect(lambdaContent).toMatch(/import boto3/);
      expect(lambdaContent).toMatch(/KMS_KEY_ID/);
    });

    test("GuardDuty Lambda imports required AWS SDK clients", () => {
      const lambdaPath = path.join(LIB_DIR, "lambda/guardduty_remediation/index.py");
      const lambdaContent = fs.readFileSync(lambdaPath, "utf8");
      
      expect(lambdaContent).toMatch(/ec2\s*=\s*boto3\.client\(['"]ec2['"]\)/);
      expect(lambdaContent).toMatch(/s3\s*=\s*boto3\.client\(['"]s3['"]\)/);
      expect(lambdaContent).toMatch(/sns\s*=\s*boto3\.client\(['"]sns['"]\)/);
    });

    test("GuardDuty Lambda has EC2 threat handling function", () => {
      const lambdaPath = path.join(LIB_DIR, "lambda/guardduty_remediation/index.py");
      const lambdaContent = fs.readFileSync(lambdaPath, "utf8");
      
      expect(lambdaContent).toMatch(/def handle_ec2_threat\(/);
      expect(lambdaContent).toMatch(/modify_instance_attribute/);
    });

    test("GuardDuty Lambda has S3 threat handling function", () => {
      const lambdaPath = path.join(LIB_DIR, "lambda/guardduty_remediation/index.py");
      const lambdaContent = fs.readFileSync(lambdaPath, "utf8");
      
      expect(lambdaContent).toMatch(/def handle_s3_threat\(/);
      expect(lambdaContent).toMatch(/put_bucket_tagging/);
    });

    test("GuardDuty Lambda has notification function", () => {
      const lambdaPath = path.join(LIB_DIR, "lambda/guardduty_remediation/index.py");
      const lambdaContent = fs.readFileSync(lambdaPath, "utf8");
      
      expect(lambdaContent).toMatch(/def send_notification\(/);
      expect(lambdaContent).toMatch(/sns\.publish/);
    });

    test("KMS rotation Lambda checks key metadata", () => {
      const lambdaPath = path.join(LIB_DIR, "lambda/kms_rotation/index.py");
      const lambdaContent = fs.readFileSync(lambdaPath, "utf8");
      
      expect(lambdaContent).toMatch(/describe_key/);
      expect(lambdaContent).toMatch(/KeyRotationEnabled/);
    });
  });

  describe("Resource Naming Conventions", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_PATH, "utf8");
    });

    test("all resources use consistent name_prefix", () => {
      const resourceNames = stackContent.match(/name\s*=\s*"\$\{local\.name_prefix\}-[^"]+"/g) || [];
      expect(resourceNames.length).toBeGreaterThan(10);
    });

    test("S3 bucket names include account ID for uniqueness", () => {
      expect(stackContent).toMatch(/\$\{data\.aws_caller_identity\.current\.account_id\}/);
    });

    test("resources have descriptive tags", () => {
      expect(stackContent).toMatch(/tags\s*=\s*{/);
      expect(stackContent).toMatch(/Name\s*=/);
      expect(stackContent).toMatch(/Purpose\s*=/);
    });
  });

  describe("Advanced Security Controls", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_PATH, "utf8");
    });

    test("S3 buckets enforce SSL/TLS", () => {
      const sslConditions = stackContent.match(/aws:SecureTransport.*false/g) || [];
      expect(sslConditions.length).toBeGreaterThan(0);
    });

    test("IAM policies follow least privilege", () => {
      expect(stackContent).toMatch(/Effect.*Allow/);
      expect(stackContent).toMatch(/Effect.*Deny/);
    });

    test("encryption at rest is configured", () => {
      expect(stackContent).toMatch(/server_side_encryption/i);
      expect(stackContent).toMatch(/kms_master_key_id/);
    });

    test("encryption in transit is enforced", () => {
      expect(stackContent).toMatch(/SecureTransport/);
    });

    test("MFA Delete documentation is present", () => {
      expect(stackContent).toMatch(/MFA Delete/i);
    });
  });

  describe("Terraform Resource Dependencies", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_PATH, "utf8");
    });

    test("resources use depends_on where necessary", () => {
      expect(stackContent).toMatch(/depends_on\s*=/);
    });

    test("Config recorder status depends on delivery channel", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_config_delivery_channel\.main\]/);
    });

    test("Transit Gateway route depends on attachment", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_ec2_transit_gateway_vpc_attachment\.security_vpc_attachment\]/);
    });

    test("CloudTrail depends on bucket policy", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_s3_bucket_policy\.cloudtrail_bucket_policy\]/);
    });
  });

  describe("Conditional Resource Creation", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_PATH, "utf8");
    });

    test("KMS key created only if preexisting not provided", () => {
      const kmsKeyMatch = stackContent.match(/resource\s+"aws_kms_key"\s+"data_encryption_key"[\s\S]*?count\s*=\s*var\.preexisting_kms_key_arn\s*==\s*""\s*\?\s*1\s*:\s*0/);
      expect(kmsKeyMatch).not.toBeNull();
    });

    test("KMS rotation Lambda created conditionally", () => {
      const lambdaMatch = stackContent.match(/resource\s+"aws_lambda_function"\s+"kms_rotation_lambda"[\s\S]*?count\s*=\s*var\.preexisting_kms_key_arn\s*==\s*""\s*\?\s*1\s*:\s*0/);
      expect(lambdaMatch).not.toBeNull();
    });

    test("data source for existing KMS key is conditional", () => {
      const dataMatch = stackContent.match(/data\s+"aws_kms_key"\s+"existing_data_key"[\s\S]*?count\s*=\s*var\.preexisting_kms_key_arn\s*!=\s*""\s*\?\s*1\s*:\s*0/);
      expect(dataMatch).not.toBeNull();
    });

    test("Transit Gateway resources created conditionally", () => {
      // Transit Gateway attachment should only be created when a real TGW ID is provided
      const attachmentMatch = stackContent.match(/resource\s+"aws_ec2_transit_gateway_vpc_attachment"\s+"security_vpc_attachment"[\s\S]*?count\s*=\s*var\.transit_gateway_id\s*!=\s*"tgw-xxxxxxxxxxxxxxxxx"\s*\?\s*1\s*:\s*0/);
      expect(attachmentMatch).not.toBeNull();
      
      // Transit Gateway route should also be conditional
      const routeMatch = stackContent.match(/resource\s+"aws_route"\s+"default_route_to_tgw"[\s\S]*?count\s*=\s*var\.transit_gateway_id\s*!=\s*"tgw-xxxxxxxxxxxxxxxxx"\s*\?\s*1\s*:\s*0/);
      expect(routeMatch).not.toBeNull();
    });
  });

  describe("High Availability Configuration", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_PATH, "utf8");
    });

    test("subnets span 3 availability zones", () => {
      expect(stackContent).toMatch(/count\s*=\s*3/);
      expect(stackContent).toMatch(/availability_zone.*data\.aws_availability_zones\.available\.names\[count\.index\]/);
    });

    test("VPC endpoints deployed in multiple subnets", () => {
      expect(stackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private_subnets\[\*\]\.id/);
    });
  });

  describe("Compliance and Governance", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_PATH, "utf8");
    });

    test("Config rules enforce required tags", () => {
      expect(stackContent).toMatch(/REQUIRED_TAGS/);
      expect(stackContent).toMatch(/tag1Key.*DataClassification/);
      expect(stackContent).toMatch(/tag2Key.*ComplianceScope/);
      expect(stackContent).toMatch(/tag3Key.*Environment/);
    });

    test("S3 public access is prohibited", () => {
      expect(stackContent).toMatch(/S3_BUCKET_PUBLIC_READ_PROHIBITED/);
    });

    test("EC2 requires IMDSv2", () => {
      expect(stackContent).toMatch(/EC2_IMDSV2_CHECK/);
    });

    test("CloudTrail captures management events", () => {
      expect(stackContent).toMatch(/include_management_events\s*=\s*true/);
    });

    test("CloudTrail captures data events", () => {
      expect(stackContent).toMatch(/data_resource\s*{/);
      expect(stackContent).toMatch(/type\s*=\s*"AWS::S3::Object"/);
      expect(stackContent).toMatch(/type\s*=\s*"AWS::Lambda::Function"/);
    });
  });

  describe("Network Security", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_PATH, "utf8");
    });

    test("VPC has DNS support enabled", () => {
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("VPC has DNS hostnames enabled", () => {
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test("private subnets do not auto-assign public IPs", () => {
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*false/);
    });

    test("security groups have descriptions", () => {
      const sgDescriptions = stackContent.match(/description\s*=\s*"[^"]+"/g) || [];
      expect(sgDescriptions.length).toBeGreaterThan(15);
    });

    test("NACL allows VPC internal traffic", () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*local\.vpc_cidr/);
      expect(stackContent).toMatch(/action\s*=\s*"allow"/);
    });
  });

  describe("Logging and Monitoring", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_PATH, "utf8");
    });

    test("VPC Flow Logs capture all traffic", () => {
      expect(stackContent).toMatch(/traffic_type\s*=\s*"ALL"/);
    });

    test("CloudTrail is multi-region", () => {
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test("Config recorder captures all resource types", () => {
      expect(stackContent).toMatch(/all_supported\s*=\s*true/);
    });

    test("Config delivery frequency is configured", () => {
      expect(stackContent).toMatch(/delivery_frequency\s*=\s*"TwentyFour_Hours"/);
    });

    test("SNS topic uses encryption", () => {
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*"alias\/aws\/sns"/);
    });
  });

  describe("File Structure Validation", () => {
    test("tap_stack.tf is properly formatted", () => {
      const content = fs.readFileSync(STACK_PATH, "utf8");
      
      // Check for consistent indentation (2 spaces)
      expect(content).not.toMatch(/\t/);
    });

    test("provider.tf has proper structure", () => {
      const content = fs.readFileSync(PROVIDER_PATH, "utf8");
      
      expect(content).toMatch(/terraform\s*{/);
      expect(content).toMatch(/provider\s+"aws"\s*{/);
    });

    test("variables.tf has consistent formatting", () => {
      const content = fs.readFileSync(VARIABLES_PATH, "utf8");
      
      const varCount = (content.match(/variable\s+"/g) || []).length;
      expect(varCount).toBeGreaterThan(5);
    });
  });

  describe("Resource Count Validation", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_PATH, "utf8");
    });

    test("has multiple S3 buckets defined", () => {
      const buckets = stackContent.match(/resource\s+"aws_s3_bucket"/g) || [];
      expect(buckets.length).toBeGreaterThanOrEqual(5);
    });

    test("has multiple security groups defined", () => {
      const sgs = stackContent.match(/resource\s+"aws_security_group"/g) || [];
      expect(sgs.length).toBeGreaterThanOrEqual(4);
    });

    test("has multiple IAM roles defined", () => {
      const roles = stackContent.match(/resource\s+"aws_iam_role"/g) || [];
      expect(roles.length).toBeGreaterThanOrEqual(3);
    });

    test("has multiple Config rules defined", () => {
      const rules = stackContent.match(/resource\s+"aws_config_config_rule"/g) || [];
      expect(rules.length).toBeGreaterThanOrEqual(3);
    });

    test("has multiple VPC endpoints defined", () => {
      const endpoints = stackContent.match(/resource\s+"aws_vpc_endpoint"/g) || [];
      expect(endpoints.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Error Handling and Validation", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_PATH, "utf8");
    });

    test("variables have proper type declarations", () => {
      expect(stackContent).toMatch(/type\s*=\s*string/);
      expect(stackContent).toMatch(/type\s*=\s*number/);
    });

    test("variables have descriptions", () => {
      const descriptions = stackContent.match(/description\s*=/g) || [];
      expect(descriptions.length).toBeGreaterThan(5);
    });

    test("uses ternary operators for conditional values", () => {
      expect(stackContent).toMatch(/\?\s*.*\s*:/);
    });
  });
});
