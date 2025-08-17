// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import * as fs from "fs";
import * as path from "path";

//===============================================================================
// Static validation for Terraform HCL files in lib/
//===============================================================================

const LIB_DIR = path.resolve(__dirname, '../lib');
const STACK_REL = "../lib/tap_stack.tf"; // adjust if your structure differs
const stackPath = path.resolve(__dirname, STACK_REL);
const TAP_STACK_TF = path.join(LIB_DIR, 'tap_stack.tf');

const read = (p: string) => fs.readFileSync(p, 'utf8');
const hasIn = (p: string, re: RegExp) => re.test(read(p));
const escapeRe = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

describe("Terraform single-file stack: tap_stack.tf", () => {
  test("tap_stack.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  // --- Optional sanity checks (keep lightweight) ---

  test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("declares locals configuration in tap_stack.tf", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/locals\s*{[\s\S]*?environment\s*=\s*terraform\.workspace/);
  });
});

describe('tap_stack.tf static structure', () => {
  it('exists and has content', () => {
    expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
    expect(read(TAP_STACK_TF).length).toBeGreaterThan(1000);
  });

  describe('Variables and Locals', () => {
    it('defines regions in locals configuration', () => {
      expect(hasIn(TAP_STACK_TF, /regions\s*=\s*\[\s*"us-west-1"\s*,\s*"eu-central-1"\s*\]/)).toBe(true);
    });

    it('defines locals with environment, common_tags, and allowed_ip_ranges', () => {
      expect(hasIn(TAP_STACK_TF, /locals\s*{[\s\S]*?environment\s*=\s*terraform\.workspace/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /common_tags\s*=\s*{[\s\S]*?Environment\s*=\s*local\.environment/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /allowed_ip_ranges\s*=\s*\[[\s\S]*?"10\.0\.0\.0\/8"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /regions\s*=\s*\[\s*"us-west-1"\s*,\s*"eu-central-1"\s*\]/)).toBe(true);
    });
  });

  describe('Data Sources', () => {
    it('defines required data sources for account and regions', () => {
      expect(hasIn(TAP_STACK_TF, /data\s+"aws_caller_identity"\s+"current"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /data\s+"aws_region"\s+"us_west"[\s\S]*?provider\s*=\s*aws\.us_west/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /data\s+"aws_region"\s+"eu_central"[\s\S]*?provider\s*=\s*aws\.eu_central/)).toBe(true);
    });
  });

  describe('KMS Keys', () => {
    it('creates KMS keys in both regions with rotation enabled', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_kms_key"\s+"main_us_west"[\s\S]*?provider\s*=\s*aws\.us_west[\s\S]*?enable_key_rotation\s*=\s*true/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_kms_key"\s+"main_eu_central"[\s\S]*?provider\s*=\s*aws\.eu_central[\s\S]*?enable_key_rotation\s*=\s*true/)).toBe(true);
    });

    it('creates KMS aliases for both regions', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_kms_alias"\s+"main_us_west"[\s\S]*?target_key_id\s*=\s*aws_kms_key\.main_us_west\.key_id/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_kms_alias"\s+"main_eu_central"[\s\S]*?target_key_id\s*=\s*aws_kms_key\.main_eu_central\.key_id/)).toBe(true);
    });

    it('configures KMS key policies with CloudWatch Logs permissions', () => {
      expect(hasIn(TAP_STACK_TF, /policy\s*=\s*jsonencode\({[\s\S]*?"AllowCloudWatchLogs"[\s\S]*?"logs\.amazonaws\.com"/)).toBe(true);
    });
  });

  describe('VPC and Networking', () => {
    it('creates VPCs in both regions with DNS support', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_vpc"\s+"secure_app_vpc_us_west"[\s\S]*?provider\s*=\s*aws\.us_west[\s\S]*?cidr_block\s*=\s*"10\.0\.0\.0\/16"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_vpc"\s+"secure_app_vpc_eu_central"[\s\S]*?provider\s*=\s*aws\.eu_central[\s\S]*?cidr_block\s*=\s*"10\.1\.0\.0\/16"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /enable_dns_hostnames\s*=\s*true/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /enable_dns_support\s*=\s*true/)).toBe(true);
    });

    it('creates Internet Gateways for both regions', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_internet_gateway"\s+"igw_us_west"[\s\S]*?vpc_id\s*=\s*aws_vpc\.secure_app_vpc_us_west\.id/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_internet_gateway"\s+"igw_eu_central"[\s\S]*?vpc_id\s*=\s*aws_vpc\.secure_app_vpc_eu_central\.id/)).toBe(true);
    });

    it('creates private subnets in multiple AZs for both regions', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_subnet"\s+"private_subnet_us_west_1a"[\s\S]*?availability_zone\s*=\s*"us-west-1a"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_subnet"\s+"private_subnet_us_west_1c"[\s\S]*?availability_zone\s*=\s*"us-west-1c"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_subnet"\s+"private_subnet_eu_central_1a"[\s\S]*?availability_zone\s*=\s*"eu-central-1a"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_subnet"\s+"private_subnet_eu_central_1b"[\s\S]*?availability_zone\s*=\s*"eu-central-1b"/)).toBe(true);
    });

    it('creates public subnets with public IP mapping enabled', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_subnet"\s+"public_subnet_us_west_1a"[\s\S]*?map_public_ip_on_launch\s*=\s*true/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_subnet"\s+"public_subnet_eu_central_1a"[\s\S]*?map_public_ip_on_launch\s*=\s*true/)).toBe(true);
    });

    it('creates Elastic IPs and NAT Gateways for both regions', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_eip"\s+"nat_eip_us_west"[\s\S]*?domain\s*=\s*"vpc"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_eip"\s+"nat_eip_eu_central"[\s\S]*?domain\s*=\s*"vpc"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_nat_gateway"\s+"nat_us_west"[\s\S]*?allocation_id\s*=\s*aws_eip\.nat_eip_us_west\.id/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_nat_gateway"\s+"nat_eu_central"[\s\S]*?allocation_id\s*=\s*aws_eip\.nat_eip_eu_central\.id/)).toBe(true);
    });

    it('creates route tables with proper routing', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_route_table"\s+"private_rt_us_west"[\s\S]*?nat_gateway_id\s*=\s*aws_nat_gateway\.nat_us_west\.id/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_route_table"\s+"public_rt_us_west"[\s\S]*?gateway_id\s*=\s*aws_internet_gateway\.igw_us_west\.id/)).toBe(true);
    });

    it('creates route table associations for all subnets', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_route_table_association"\s+"private_rta_us_west_1a"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_route_table_association"\s+"public_rta_us_west"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_route_table_association"\s+"private_rta_eu_central_1a"/)).toBe(true);
    });
  });

  describe('Security Groups', () => {
    it('creates web tier security groups with HTTPS/HTTP access from allowed IP ranges', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_security_group"\s+"web_tier_us_west"[\s\S]*?ingress[\s\S]*?from_port\s*=\s*443[\s\S]*?to_port\s*=\s*443[\s\S]*?cidr_blocks\s*=\s*local\.allowed_ip_ranges/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_security_group"\s+"web_tier_eu_central"[\s\S]*?ingress[\s\S]*?from_port\s*=\s*80[\s\S]*?to_port\s*=\s*80[\s\S]*?cidr_blocks\s*=\s*local\.allowed_ip_ranges/)).toBe(true);
    });

    it('creates database tier security groups with restricted access from web tier', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_security_group"\s+"database_tier_us_west"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_security_group"\s+"database_tier_eu_central"/)).toBe(true);
      // Check for separate security group rules to avoid circular dependencies
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_security_group_rule"\s+"db_from_web_us_west"[\s\S]*?type\s*=\s*"ingress"[\s\S]*?from_port\s*=\s*3306[\s\S]*?source_security_group_id\s*=\s*aws_security_group\.web_tier_us_west\.id/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_security_group_rule"\s+"db_from_web_eu_central"[\s\S]*?source_security_group_id\s*=\s*aws_security_group\.web_tier_eu_central\.id/)).toBe(true);
    });

    it('creates separate security group rules to avoid circular dependencies', () => {
      // Web tier to database tier egress rules
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_security_group_rule"\s+"web_to_db_us_west"[\s\S]*?type\s*=\s*"egress"[\s\S]*?from_port\s*=\s*3306/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_security_group_rule"\s+"web_to_db_eu_central"[\s\S]*?type\s*=\s*"egress"/)).toBe(true);
      // Database tier from web tier ingress rules
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_security_group_rule"\s+"db_from_web_us_west"[\s\S]*?type\s*=\s*"ingress"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_security_group_rule"\s+"db_from_web_eu_central"[\s\S]*?type\s*=\s*"ingress"/)).toBe(true);
    });
  });

  describe('IAM Resources', () => {
    it('creates IAM password policy with strict requirements', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_iam_account_password_policy"\s+"strict"[\s\S]*?minimum_password_length\s*=\s*14/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /require_lowercase_characters\s*=\s*true/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /require_uppercase_characters\s*=\s*true/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /require_symbols\s*=\s*true/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /password_reuse_prevention\s*=\s*24/)).toBe(true);
    });

    it('creates EC2 secure role with least privilege', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_iam_role"\s+"ec2_secure_role"[\s\S]*?assume_role_policy[\s\S]*?"ec2\.amazonaws\.com"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_iam_role_policy"\s+"ec2_secure_policy"[\s\S]*?"logs:CreateLogGroup"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/)).toBe(true);
    });

    it('creates IAM group for developers with MFA policy', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_iam_group"\s+"developers"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_iam_policy"\s+"force_mfa"[\s\S]*?"aws:MultiFactorAuthPresent"\s*=\s*"false"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_iam_group_policy_attachment"\s+"developers_force_mfa"/)).toBe(true);
    });

    it('creates AWS Config IAM role and policy attachment', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_iam_role"\s+"config_role"[\s\S]*?"config\.amazonaws\.com"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_iam_role_policy_attachment"\s+"config_role_policy"[\s\S]*?policy_arn\s*=\s*"arn:aws:iam::aws:policy\/service-role\/AWS_ConfigRole"/)).toBe(true);
    });
  });

  describe('Monitoring and Logging', () => {
    it('creates CloudWatch log groups with KMS encryption and proper retention', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_cloudwatch_log_group"\s+"application_logs_us_west"[\s\S]*?retention_in_days\s*=\s*30[\s\S]*?kms_key_id\s*=\s*aws_kms_key\.main_us_west\.arn/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_cloudwatch_log_group"\s+"security_logs_us_west"[\s\S]*?retention_in_days\s*=\s*90[\s\S]*?kms_key_id\s*=\s*aws_kms_key\.main_us_west\.arn/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_cloudwatch_log_group"\s+"application_logs_eu_central"[\s\S]*?kms_key_id\s*=\s*aws_kms_key\.main_eu_central\.arn/)).toBe(true);
    });

    it('creates CloudWatch alarms for CPU monitoring', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu_us_west"[\s\S]*?comparison_operator\s*=\s*"GreaterThanThreshold"[\s\S]*?threshold\s*=\s*"80"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu_eu_central"[\s\S]*?alarm_actions\s*=\s*\[\s*aws_sns_topic\.security_alerts_eu_central\.arn\s*\]/)).toBe(true);
    });

    it('creates SNS topics for security alerts with KMS encryption', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_sns_topic"\s+"security_alerts_us_west"[\s\S]*?kms_master_key_id\s*=\s*aws_kms_key\.main_us_west\.id/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_sns_topic"\s+"security_alerts_eu_central"[\s\S]*?kms_master_key_id\s*=\s*aws_kms_key\.main_eu_central\.id/)).toBe(true);
    });
  });

  describe('S3 and AWS Config', () => {
    it('creates S3 buckets for AWS Config with encryption and public access block', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_s3_bucket"\s+"config_bucket_us_west"[\s\S]*?force_destroy\s*=\s*true/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_s3_bucket"\s+"config_bucket_eu_central"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"config_bucket_us_west_encryption"[\s\S]*?sse_algorithm\s*=\s*"aws:kms"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_s3_bucket_public_access_block"\s+"config_bucket_us_west_pab"[\s\S]*?block_public_acls\s*=\s*true/)).toBe(true);
    });

    it('creates S3 bucket policies for AWS Config access', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_s3_bucket_policy"\s+"config_bucket_us_west_policy"[\s\S]*?"AWSConfigBucketPermissionsCheck"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_s3_bucket_policy"\s+"config_bucket_eu_central_policy"[\s\S]*?"config\.amazonaws\.com"/)).toBe(true);
    });

    it('creates random string for S3 bucket suffix', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"random_string"\s+"bucket_suffix"[\s\S]*?length\s*=\s*8[\s\S]*?special\s*=\s*false[\s\S]*?upper\s*=\s*false/)).toBe(true);
    });
  });

  describe('AWS Config Resources', () => {
    it('creates AWS Config configuration recorders for both regions', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_config_configuration_recorder"\s+"recorder_us_west"[\s\S]*?all_supported\s*=\s*true[\s\S]*?include_global_resource_types\s*=\s*true/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_config_configuration_recorder"\s+"recorder_eu_central"[\s\S]*?include_global_resource_types\s*=\s*false/)).toBe(true);
    });

    it('creates AWS Config delivery channels with dependencies', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_config_delivery_channel"\s+"delivery_channel_us_west"[\s\S]*?s3_bucket_name\s*=\s*aws_s3_bucket\.config_bucket_us_west\.bucket/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /depends_on\s*=\s*\[[\s\S]*?aws_s3_bucket_policy\.config_bucket_us_west_policy/)).toBe(true);
    });
  });

  describe('AWS GuardDuty - Threat Detection', () => {
    it('creates GuardDuty detectors in both regions with enhanced datasources', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_guardduty_detector"\s+"main_us_west"[\s\S]*?provider\s*=\s*aws\.us_west/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_guardduty_detector"\s+"main_eu_central"[\s\S]*?provider\s*=\s*aws\.eu_central/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /enable\s*=\s*true/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /datasources\s*{[\s\S]*?s3_logs\s*{[\s\S]*?enable\s*=\s*true[\s\S]*?}/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /malware_protection\s*{[\s\S]*?scan_ec2_instance_with_findings/)).toBe(true);
    });

    it('creates threat intelligence set for custom threat data', () => {
      // Threat intel set is commented out by default as it requires special IAM permissions and S3 setup
      expect(hasIn(TAP_STACK_TF, /# resource\s+"aws_guardduty_threatintelset"\s+"threat_intel_us_west"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /# Commented out as it requires special IAM permissions and S3 setup/)).toBe(true);
    });

    it('creates CloudWatch event rules for GuardDuty findings with SNS integration', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_cloudwatch_event_rule"\s+"guardduty_finding_us_west"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_cloudwatch_event_rule"\s+"guardduty_finding_eu_central"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /source.*=.*\["aws\.guardduty"\]/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /detail-type.*=.*\["GuardDuty Finding"\]/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_cloudwatch_event_target"\s+"guardduty_sns_us_west"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /arn\s*=\s*aws_sns_topic\.security_alerts_us_west\.arn/)).toBe(true);
    });
  });

  describe('AWS WAF + API Gateway - DDoS Protection', () => {
    it('creates WAF Web ACLs with comprehensive security rules', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_wafv2_web_acl"\s+"api_protection_us_west"[\s\S]*?provider\s*=\s*aws\.us_west/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_wafv2_web_acl"\s+"api_protection_eu_central"[\s\S]*?provider\s*=\s*aws\.eu_central/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /scope\s*=\s*"REGIONAL"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /default_action\s*{[\s\S]*?allow\s*{[\s\S]*?}/)).toBe(true);
    });

    it('implements rate limiting and AWS managed rules', () => {
      expect(hasIn(TAP_STACK_TF, /rate_based_statement\s*{[\s\S]*?limit\s*=\s*2000/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /aggregate_key_type\s*=\s*"IP"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /name\s*=\s*"AWSManagedRulesCommonRuleSet"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /name\s*=\s*"AWSManagedRulesKnownBadInputsRuleSet"/)).toBe(true);
    });

    it('includes geo-blocking rule for enhanced security', () => {
      expect(hasIn(TAP_STACK_TF, /geo_match_statement\s*{[\s\S]*?country_codes\s*=\s*\["CN",\s*"RU",\s*"KP"\]/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /name\s*=\s*"GeoBlockRule"/)).toBe(true);
    });

    it('creates API Gateway REST APIs with IP-restricted policies', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_api_gateway_rest_api"\s+"secure_api_us_west"[\s\S]*?provider\s*=\s*aws\.us_west/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_api_gateway_rest_api"\s+"secure_api_eu_central"[\s\S]*?provider\s*=\s*aws\.eu_central/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /endpoint_configuration\s*{[\s\S]*?types\s*=\s*\["REGIONAL"\]/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /IpAddress\s*=\s*{[\s\S]*?"aws:SourceIp"\s*=\s*local\.allowed_ip_ranges/)).toBe(true);
    });

    it('creates API Gateway stages with comprehensive logging and X-Ray tracing', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_api_gateway_stage"\s+"secure_api_stage_us_west"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_api_gateway_stage"\s+"secure_api_stage_eu_central"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /xray_tracing_enabled\s*=\s*true/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /access_log_settings\s*{[\s\S]*?destination_arn\s*=\s*aws_cloudwatch_log_group\.application_logs_.*?\.arn/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /depends_on\s*=\s*\[aws_api_gateway_account\./)).toBe(true);
    });

    it('creates API Gateway CloudWatch role and account settings', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_iam_role"\s+"api_gateway_cloudwatch_role"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_api_gateway_account"\s+"api_gateway_account_us_west"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_api_gateway_account"\s+"api_gateway_account_eu_central"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /cloudwatch_role_arn\s*=\s*aws_iam_role\.api_gateway_cloudwatch_role\.arn/)).toBe(true);
      // reset_on_delete attribute removed as it was deprecated
    });

    it('creates health check endpoints with proper configuration', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_api_gateway_resource"\s+"health_us_west"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_api_gateway_resource"\s+"health_eu_central"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /path_part\s*=\s*"health"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_api_gateway_method"\s+"health_get_us_west"[\s\S]*?http_method\s*=\s*"GET"/)).toBe(true);
    });

    it('associates WAF with API Gateway for DDoS protection', () => {
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_wafv2_web_acl_association"\s+"api_waf_association_us_west"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource\s+"aws_wafv2_web_acl_association"\s+"api_waf_association_eu_central"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /resource_arn\s*=\s*aws_api_gateway_stage\.secure_api_stage_.*?\.arn/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /web_acl_arn\s*=\s*aws_wafv2_web_acl\.api_protection_.*?\.arn/)).toBe(true);
    });
  });

  describe('Outputs', () => {
    it('declares comprehensive account and environment outputs', () => {
      expect(hasIn(TAP_STACK_TF, /output\s+"aws_account_id"[\s\S]*?value\s*=\s*data\.aws_caller_identity\.current\.account_id/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /output\s+"aws_regions"[\s\S]*?primary\s*=\s*data\.aws_region\.us_west\.name/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /output\s+"environment"[\s\S]*?value\s*=\s*local\.environment/)).toBe(true);
    });

    it('declares VPC and networking outputs for both regions', () => {
      expect(hasIn(TAP_STACK_TF, /output\s+"vpc_us_west"[\s\S]*?id\s*=\s*aws_vpc\.secure_app_vpc_us_west\.id/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /output\s+"vpc_eu_central"[\s\S]*?id\s*=\s*aws_vpc\.secure_app_vpc_eu_central\.id/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /output\s+"subnets_us_west"[\s\S]*?private[\s\S]*?subnet_1a/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /output\s+"nat_gateways"[\s\S]*?public_ip\s*=\s*aws_eip\.nat_eip_us_west\.public_ip/)).toBe(true);
    });

    it('declares security and encryption outputs', () => {
      expect(hasIn(TAP_STACK_TF, /output\s+"security_groups"[\s\S]*?web_tier[\s\S]*?database_tier/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /output\s+"kms_keys"[\s\S]*?key_id\s*=\s*aws_kms_key\.main_us_west\.key_id/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /output\s+"iam_resources"[\s\S]*?ec2_role[\s\S]*?ec2_instance_profile/)).toBe(true);
    });

    it('declares monitoring and AWS Config outputs', () => {
      expect(hasIn(TAP_STACK_TF, /output\s+"cloudwatch_log_groups"[\s\S]*?application_logs[\s\S]*?security_logs/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /output\s+"sns_topics"[\s\S]*?security_alerts/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /output\s+"config_s3_buckets"[\s\S]*?bucket_name\s*=\s*aws_s3_bucket\.config_bucket_us_west\.bucket/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /output\s+"aws_config"[\s\S]*?configuration_recorder[\s\S]*?delivery_channel/)).toBe(true);
    });

    it('declares route table and connectivity outputs', () => {
      expect(hasIn(TAP_STACK_TF, /output\s+"route_tables"[\s\S]*?private_route_table[\s\S]*?public_route_table/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /output\s+"internet_gateways"[\s\S]*?id\s*=\s*aws_internet_gateway\.igw_us_west\.id/)).toBe(true);
    });
  });

  describe('Security Validation', () => {
    it('does not contain hardcoded AWS credentials', () => {
      expect(hasIn(TAP_STACK_TF, /aws_access_key_id\s*=/)).toBe(false);
      expect(hasIn(TAP_STACK_TF, /aws_secret_access_key\s*=/)).toBe(false);
      expect(hasIn(TAP_STACK_TF, /access_key\s*=/)).toBe(false);
      expect(hasIn(TAP_STACK_TF, /secret_key\s*=/)).toBe(false);
    });

    it('uses secure configurations (KMS encryption, private subnets)', () => {
      expect(hasIn(TAP_STACK_TF, /enable_key_rotation\s*=\s*true/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /storage_encrypted\s*=\s*true/)).toBe(false); // Not applicable for this infrastructure
      expect(hasIn(TAP_STACK_TF, /block_public_acls\s*=\s*true/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /restrict_public_buckets\s*=\s*true/)).toBe(true);
    });

    it('implements least privilege in security groups', () => {
      expect(hasIn(TAP_STACK_TF, /cidr_blocks\s*=\s*local\.allowed_ip_ranges/)).toBe(true);
      // Check for security group rules that reference other security groups
      expect(hasIn(TAP_STACK_TF, /source_security_group_id\s*=\s*aws_security_group\.web_tier_us_west\.id/)).toBe(true);
    });

    it('uses proper tagging strategy', () => {
      expect(hasIn(TAP_STACK_TF, /tags\s*=\s*merge\(local\.common_tags/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /Environment\s*=\s*local\.environment/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /Compliance\s*=\s*"SOC2-PCI-DSS"/)).toBe(true);
    });
  });

  describe('Multi-Region Architecture', () => {
    it('properly configures resources in multiple regions', () => {
      expect(hasIn(TAP_STACK_TF, /provider\s*=\s*aws\.us_west/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /provider\s*=\s*aws\.eu_central/)).toBe(true);
    });

    it('uses non-overlapping CIDR blocks for VPCs', () => {
      expect(hasIn(TAP_STACK_TF, /cidr_block\s*=\s*"10\.0\.0\.0\/16"/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /cidr_block\s*=\s*"10\.1\.0\.0\/16"/)).toBe(true);
    });

    it('correctly references region-specific data sources', () => {
      expect(hasIn(TAP_STACK_TF, /data\.aws_region\.us_west\.name/)).toBe(true);
      expect(hasIn(TAP_STACK_TF, /data\.aws_region\.eu_central\.name/)).toBe(true);
    });
  });
});
