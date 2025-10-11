import { readFileSync } from 'fs';
import { join } from 'path';

const terraformCode = readFileSync(
  join(__dirname, '../lib/tap_stack.tf'),
  'utf-8'
);

describe('Terraform Infrastructure Unit Tests - HIPAA Compliant Healthcare System', () => {

  // =============================================================================
  // Variables Section Tests
  // =============================================================================

  describe('Variables', () => {
    test('should define aws_region variable with default us-east-1', () => {
      expect(terraformCode).toMatch(/variable\s+"aws_region"\s+\{[\s\S]*?default\s*=\s*"us-east-1"/);
    });

    test('should define environment variable with validation', () => {
      expect(terraformCode).toMatch(/variable\s+"environment"\s+\{[\s\S]*?validation\s*\{/);
      expect(terraformCode).toMatch(/production.*staging.*development/);
    });

    test('should define application variable with default', () => {
      expect(terraformCode).toMatch(/variable\s+"application"\s+\{[\s\S]*?default\s*=\s*"healthcare-system"/);
    });

    test('should define owner variable', () => {
      expect(terraformCode).toMatch(/variable\s+"owner"\s+\{/);
      expect(terraformCode).toMatch(/default\s*=\s*"healthcare-ops"/);
    });

    test('should define vpc_cidr variable with validation', () => {
      expect(terraformCode).toMatch(/variable\s+"vpc_cidr"\s+\{[\s\S]*?default\s*=\s*"10\.0\.0\.0\/16"/);
      expect(terraformCode).toMatch(/can\(cidrhost\(var\.vpc_cidr/);
    });

    test('should define public_subnet_cidrs variable as list', () => {
      expect(terraformCode).toMatch(/variable\s+"public_subnet_cidrs"\s+\{[\s\S]*?type\s*=\s*list\(string\)/);
      expect(terraformCode).toMatch(/"10\.0\.1\.0\/24".*"10\.0\.2\.0\/24"/);
    });

    test('should define private_subnet_cidrs variable as list', () => {
      expect(terraformCode).toMatch(/variable\s+"private_subnet_cidrs"\s+\{[\s\S]*?type\s*=\s*list\(string\)/);
      expect(terraformCode).toMatch(/"10\.0\.10\.0\/24".*"10\.0\.11\.0\/24"/);
    });

    test('should define availability_zone_count with validation', () => {
      expect(terraformCode).toMatch(/variable\s+"availability_zone_count"\s+\{[\s\S]*?default\s*=\s*2/);
      expect(terraformCode).toMatch(/availability_zone_count >= 2 && var\.availability_zone_count <= 4/);
    });

    test('should define bastion_cidr variable', () => {
      expect(terraformCode).toMatch(/variable\s+"bastion_cidr"\s+\{/);
    });

    test('should define log_retention_days with validation', () => {
      expect(terraformCode).toMatch(/variable\s+"log_retention_days"\s+\{[\s\S]*?default\s*=\s*365/);
      expect(terraformCode).toMatch(/validation\s*\{[\s\S]*?contains\(\[/);
    });

    test('should define s3_log_transition_days variable', () => {
      expect(terraformCode).toMatch(/variable\s+"s3_log_transition_days"\s+\{[\s\S]*?default\s*=\s*90/);
    });

    test('should define s3_log_expiration_days variable', () => {
      expect(terraformCode).toMatch(/variable\s+"s3_log_expiration_days"\s+\{[\s\S]*?default\s*=\s*365/);
    });

    test('should define notification_email with email validation', () => {
      expect(terraformCode).toMatch(/variable\s+"notification_email"\s+\{/);
      expect(terraformCode).toMatch(/can\(regex\(".*@.*"/);
    });

    test('should define enable_cloudtrail_cloudwatch variable', () => {
      expect(terraformCode).toMatch(/variable\s+"enable_cloudtrail_cloudwatch"\s+\{[\s\S]*?type\s*=\s*bool/);
      expect(terraformCode).toMatch(/default\s*=\s*true/);
    });

    test('should define compliance_check_schedule variable', () => {
      expect(terraformCode).toMatch(/variable\s+"compliance_check_schedule"\s+\{/);
      expect(terraformCode).toMatch(/default\s*=\s*"rate\(1 hour\)"/);
    });

    test('should define environment_suffix variable', () => {
      expect(terraformCode).toMatch(/variable\s+"environment_suffix"\s+\{/);
      expect(terraformCode).toMatch(/default\s*=\s*""/);
    });

    test('should define enable_multi_region_trail variable', () => {
      expect(terraformCode).toMatch(/variable\s+"enable_multi_region_trail"\s+\{[\s\S]*?type\s*=\s*bool/);
    });

    test('should define enable_vpc_flow_logs variable', () => {
      expect(terraformCode).toMatch(/variable\s+"enable_vpc_flow_logs"\s+\{[\s\S]*?type\s*=\s*bool/);
    });
  });

  // =============================================================================
  // Data Sources Tests
  // =============================================================================

  describe('Data Sources', () => {
    test('should define aws_caller_identity data source', () => {
      expect(terraformCode).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test('should define aws_availability_zones data source', () => {
      expect(terraformCode).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(terraformCode).toMatch(/state\s*=\s*"available"/);
    });

    test('should define archive_file data source for Lambda', () => {
      expect(terraformCode).toMatch(/data\s+"archive_file"\s+"compliance_lambda"/);
      expect(terraformCode).toMatch(/type\s*=\s*"zip"/);
      expect(terraformCode).toMatch(/lambda\/compliance_check\.py/);
    });
  });

  // =============================================================================
  // Random Resources Tests
  // =============================================================================

  describe('Random Resources', () => {
    test('should define random_string resource for unique naming', () => {
      expect(terraformCode).toMatch(/resource\s+"random_string"\s+"environment_suffix"/);
      expect(terraformCode).toMatch(/length\s*=\s*8/);
      expect(terraformCode).toMatch(/special\s*=\s*false/);
      expect(terraformCode).toMatch(/upper\s*=\s*false/);
    });

    test('should use count for conditional random_string creation', () => {
      expect(terraformCode).toMatch(/random_string.*environment_suffix[\s\S]*?count\s*=\s*var\.environment_suffix == "" \? 1 : 0/);
    });
  });

  // =============================================================================
  // Locals Tests
  // =============================================================================

  describe('Locals', () => {
    test('should define env_suffix in locals', () => {
      expect(terraformCode).toMatch(/locals\s+\{[\s\S]*?env_suffix\s*=/);
    });

    test('should define common_tags in locals', () => {
      expect(terraformCode).toMatch(/locals\s+\{[\s\S]*?common_tags\s*=/);
    });

    test('should include Environment tag in common_tags', () => {
      expect(terraformCode).toMatch(/common_tags\s*=\s*\{[\s\S]*?Environment\s*=\s*var\.environment/);
    });

    test('should include Application tag in common_tags', () => {
      expect(terraformCode).toMatch(/common_tags[\s\S]*?Application\s*=\s*var\.application/);
    });

    test('should include Owner tag in common_tags', () => {
      expect(terraformCode).toMatch(/common_tags[\s\S]*?Owner\s*=\s*var\.owner/);
    });

    test('should include ManagedBy tag in common_tags', () => {
      expect(terraformCode).toMatch(/common_tags[\s\S]*?ManagedBy\s*=\s*"Terraform"/);
    });

    test('should include Compliance tag in common_tags', () => {
      expect(terraformCode).toMatch(/common_tags[\s\S]*?Compliance\s*=\s*"HIPAA"/);
    });

    test('should define azs in locals using slice function', () => {
      expect(terraformCode).toMatch(/azs\s*=\s*slice\(data\.aws_availability_zones\.available\.names/);
    });
  });

  // =============================================================================
  // KMS Encryption Tests
  // =============================================================================

  describe('KMS Encryption', () => {
    test('should define KMS key resource', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
    });

    test('should enable key rotation', () => {
      expect(terraformCode).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('should have deletion window of 30 days', () => {
      expect(terraformCode).toMatch(/deletion_window_in_days\s*=\s*30/);
    });

    test('should include CloudTrail service principal in KMS policy', () => {
      expect(terraformCode).toMatch(/Service.*cloudtrail\.amazonaws\.com/);
    });

    test('should include CloudWatch Logs service principal in KMS policy', () => {
      expect(terraformCode).toMatch(/Service.*logs\.\$\{var\.aws_region\}\.amazonaws\.com/);
    });

    test('should include S3 service principal in KMS policy', () => {
      expect(terraformCode).toMatch(/Service.*s3\.amazonaws\.com/);
    });

    test('should include IAM root permissions in KMS policy', () => {
      expect(terraformCode).toMatch(/arn:aws:iam::\$\{data\.aws_caller_identity\.current\.account_id\}:root/);
    });

    test('should define KMS alias with unique name', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
      expect(terraformCode).toMatch(/name\s*=\s*"alias\/cloudtrail-encryption-key-\$\{local\.env_suffix\}"/);
    });
  });

  // =============================================================================
  // VPC and Networking Tests
  // =============================================================================

  describe('VPC and Networking', () => {
    test('should define VPC resource', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    });

    test('should enable DNS hostnames in VPC', () => {
      expect(terraformCode).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test('should enable DNS support in VPC', () => {
      expect(terraformCode).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('should define public subnets with count', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_subnet"\s+"public"[\s\S]*?count\s*=\s*var\.availability_zone_count/);
    });

    test('should define private subnets with count', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_subnet"\s+"private"[\s\S]*?count\s*=\s*var\.availability_zone_count/);
    });

    test('should enable public IP on launch for public subnets', () => {
      expect(terraformCode).toMatch(/aws_subnet.*public[\s\S]*?map_public_ip_on_launch\s*=\s*true/);
    });

    test('should define Internet Gateway', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test('should define Elastic IPs for NAT Gateways', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(terraformCode).toMatch(/domain\s*=\s*"vpc"/);
    });

    test('should define NAT Gateways with count', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_nat_gateway"\s+"main"[\s\S]*?count\s*=\s*var\.availability_zone_count/);
    });

    test('should define public route table', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    });

    test('should define route to Internet Gateway in public route table', () => {
      expect(terraformCode).toMatch(/route\s*\{[\s\S]*?cidr_block\s*=\s*"0\.0\.0\.0\/0"[\s\S]*?gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });

    test('should define private route tables with count', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_route_table"\s+"private"[\s\S]*?count\s*=\s*var\.availability_zone_count/);
    });

    test('should define route to NAT Gateway in private route tables', () => {
      expect(terraformCode).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index\]\.id/);
    });

    test('should define public route table associations', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
    });

    test('should define private route table associations', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });
  });

  // =============================================================================
  // VPC Flow Logs Tests
  // =============================================================================

  describe('VPC Flow Logs', () => {
    test('should define CloudWatch log group for VPC Flow Logs', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs"/);
    });

    test('should use KMS encryption for VPC Flow Logs', () => {
      expect(terraformCode).toMatch(/aws_cloudwatch_log_group.*vpc_flow_logs[\s\S]*?kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test('should define IAM role for VPC Flow Logs', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role"\s+"vpc_flow_logs"/);
    });

    test('should define IAM policy for VPC Flow Logs', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role_policy"\s+"vpc_flow_logs"/);
    });

    test('should define VPC Flow Log resource', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_flow_log"\s+"main"/);
    });

    test('should capture ALL traffic in VPC Flow Logs', () => {
      expect(terraformCode).toMatch(/traffic_type\s*=\s*"ALL"/);
    });
  });

  // =============================================================================
  // Security Groups Tests
  // =============================================================================

  describe('Security Groups - Three-Tier Architecture', () => {
    test('should define web tier security group', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_security_group"\s+"web"/);
    });

    test('should define app tier security group', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_security_group"\s+"app"/);
    });

    test('should define database tier security group', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_security_group"\s+"database"/);
    });

    test('should define bastion security group', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_security_group"\s+"bastion"/);
    });

    test('should have unique names for security groups using env_suffix', () => {
      const matches = terraformCode.match(/resource\s+"aws_security_group"[\s\S]*?name\s*=.*\$\{local\.env_suffix\}/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(3);
    });

    test('should define HTTPS ingress rule for web tier', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_security_group_rule"\s+"web_ingress_https"/);
      expect(terraformCode).toMatch(/from_port\s*=\s*443/);
      expect(terraformCode).toMatch(/to_port\s*=\s*443/);
    });

    test('should define HTTP ingress rule for web tier', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_security_group_rule"\s+"web_ingress_http"/);
      expect(terraformCode).toMatch(/from_port\s*=\s*80/);
      expect(terraformCode).toMatch(/to_port\s*=\s*80/);
    });

    test('should allow app tier traffic only from web tier', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_security_group_rule"\s+"app_ingress_from_web"/);
      expect(terraformCode).toMatch(/source_security_group_id\s*=\s*aws_security_group\.web\.id/);
    });

    test('should allow MySQL traffic in database tier', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_security_group_rule"\s+"db_ingress_mysql"/);
      expect(terraformCode).toMatch(/from_port\s*=\s*3306/);
    });

    test('should allow PostgreSQL traffic in database tier', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_security_group_rule"\s+"db_ingress_postgres"/);
      expect(terraformCode).toMatch(/from_port\s*=\s*5432/);
    });

    test('should allow database traffic only from app tier', () => {
      expect(terraformCode).toMatch(/db_ingress[\s\S]*?source_security_group_id\s*=\s*aws_security_group\.app\.id/);
    });

    test('should define SSH rule for bastion from designated CIDR', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_security_group_rule"\s+"bastion_ingress_ssh"/);
      expect(terraformCode).toMatch(/from_port\s*=\s*22/);
      expect(terraformCode).toMatch(/cidr_blocks\s*=\s*\[var\.bastion_cidr\]/);
    });

    test('should define egress rules for all security groups', () => {
      const egressRules = terraformCode.match(/resource\s+"aws_security_group_rule".*egress/g);
      expect(egressRules).not.toBeNull();
      expect(egressRules!.length).toBeGreaterThanOrEqual(4);
    });
  });

  // =============================================================================
  // S3 Bucket Tests (continuing...)
  // =============================================================================

  describe('S3 Buckets', () => {
    test('should define CloudTrail logs bucket with unique name', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail_logs"/);
      expect(terraformCode).toMatch(/bucket\s*=\s*"\$\{var\.application\}-cloudtrail-logs-\$\{local\.env_suffix\}"/);
    });

    test('should enable versioning for CloudTrail logs bucket', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"cloudtrail_logs"/);
      expect(terraformCode).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('should enable KMS encryption for CloudTrail logs bucket', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"cloudtrail_logs"/);
      expect(terraformCode).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      expect(terraformCode).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test('should block all public access for CloudTrail logs bucket', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"cloudtrail_logs"/);
      expect(terraformCode).toMatch(/block_public_acls\s*=\s*true/);
      expect(terraformCode).toMatch(/block_public_policy\s*=\s*true/);
      expect(terraformCode).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(terraformCode).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('should define lifecycle policy for CloudTrail logs', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"cloudtrail_logs"/);
    });

    test('should transition logs to Glacier', () => {
      expect(terraformCode).toMatch(/transition\s*\{[\s\S]*?storage_class\s*=\s*"GLACIER"/);
      expect(terraformCode).toMatch(/days\s*=\s*var\.s3_log_transition_days/);
    });

    test('should expire old logs', () => {
      expect(terraformCode).toMatch(/expiration\s*\{[\s\S]*?days\s*=\s*var\.s3_log_expiration_days/);
    });

    test('should define S3 bucket policy for CloudTrail', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail_logs"/);
    });

    test('should deny unencrypted uploads in bucket policy', () => {
      expect(terraformCode).toMatch(/DenyUnencryptedObjectUploads/);
    });

    test('should deny insecure transport in bucket policy', () => {
      expect(terraformCode).toMatch(/DenyInsecureTransport/);
      expect(terraformCode).toMatch(/aws:SecureTransport.*false/);
    });

    test('should define access logs bucket', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket"\s+"access_logs"/);
    });

    test('should enable logging for CloudTrail bucket', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_logging"\s+"cloudtrail_logs"/);
    });
  });

  // =============================================================================
  // CloudTrail Tests (continuing...)
  // =============================================================================

  describe('CloudTrail', () => {
    test('should define CloudWatch log group for CloudTrail', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"cloudtrail"/);
    });

    test('should define IAM role for CloudTrail CloudWatch integration', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role"\s+"cloudtrail_cloudwatch"/);
    });

    test('should define CloudTrail resource with unique name', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
      expect(terraformCode).toMatch(/name\s*=\s*"\$\{var\.application\}-trail-\$\{local\.env_suffix\}"/);
    });

    test('should enable multi-region trail', () => {
      expect(terraformCode).toMatch(/is_multi_region_trail\s*=\s*var\.enable_multi_region_trail/);
    });

    test('should enable log file validation', () => {
      expect(terraformCode).toMatch(/enable_log_file_validation\s*=\s*true/);
    });

    test('should use KMS encryption for CloudTrail', () => {
      expect(terraformCode).toMatch(/aws_cloudtrail.*main[\s\S]*?kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test('should include global service events', () => {
      expect(terraformCode).toMatch(/include_global_service_events\s*=\s*true/);
    });

    test('should define event selector for management events', () => {
      expect(terraformCode).toMatch(/event_selector\s*\{[\s\S]*?include_management_events\s*=\s*true/);
    });

    test('should define data events for S3', () => {
      expect(terraformCode).toMatch(/data_resource\s*\{[\s\S]*?type\s*=\s*"AWS::S3::Object"/);
    });

    test('should define data events for Lambda', () => {
      expect(terraformCode).toMatch(/data_resource\s*\{[\s\S]*?type\s*=\s*"AWS::Lambda::Function"/);
    });

    test('should enable CloudTrail Insights', () => {
      expect(terraformCode).toMatch(/insight_selector\s*\{[\s\S]*?insight_type\s*=\s*"ApiCallRateInsight"/);
    });
  });

  // =============================================================================
  // SNS Topic Tests (continuing...)
  // =============================================================================

  describe('SNS Topic', () => {
    test('should define SNS topic with unique name', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_sns_topic"\s+"security_alerts"/);
      expect(terraformCode).toMatch(/name\s*=\s*"\$\{var\.application\}-security-alerts-\$\{local\.env_suffix\}"/);
    });

    test('should encrypt SNS topic with KMS', () => {
      expect(terraformCode).toMatch(/aws_sns_topic.*security_alerts[\s\S]*?kms_master_key_id\s*=\s*aws_kms_key\.main\.id/);
    });

    test('should define SNS topic subscription', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"security_alerts_email"/);
    });

    test('should configure email protocol for subscription', () => {
      expect(terraformCode).toMatch(/protocol\s*=\s*"email"/);
      expect(terraformCode).toMatch(/endpoint\s*=\s*var\.notification_email/);
    });

    test('should define SNS topic policy for EventBridge', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_sns_topic_policy"\s+"security_alerts_eventbridge"/);
    });
  });

  // =============================================================================
  // CloudWatch Monitoring Tests (continuing...)
  // =============================================================================

  describe('CloudWatch Metric Filters and Alarms', () => {
    test('should define metric filter for unauthorized API calls', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"unauthorized_api_calls"/);
      expect(terraformCode).toMatch(/UnauthorizedOperation.*AccessDenied/);
    });

    test('should define alarm for unauthorized API calls', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"unauthorized_api_calls"/);
      expect(terraformCode).toMatch(/metric_name\s*=\s*"UnauthorizedAPICalls"/);
    });

    test('should define metric filter for root account usage', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"root_account_usage"/);
      expect(terraformCode).toMatch(/userIdentity\.type.*Root/);
    });

    test('should define alarm for root account usage', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"root_account_usage"/);
    });

    test('should define metric filter for security group changes', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"security_group_changes"/);
      expect(terraformCode).toMatch(/AuthorizeSecurityGroupIngress/);
    });

    test('should define alarm for security group changes', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"security_group_changes"/);
    });

    test('should define metric filter for network ACL changes', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"network_acl_changes"/);
      expect(terraformCode).toMatch(/CreateNetworkAcl/);
    });

    test('should define alarm for network ACL changes', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"network_acl_changes"/);
    });

    test('should define metric filter for IAM policy changes', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"iam_policy_changes"/);
      expect(terraformCode).toMatch(/PutGroupPolicy.*PutRolePolicy/);
    });

    test('should define alarm for IAM policy changes', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"iam_policy_changes"/);
    });

    test('should define metric filter for failed console logins', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"failed_console_logins"/);
      expect(terraformCode).toMatch(/ConsoleLogin.*Failed authentication/);
    });

    test('should define alarm for failed console logins with threshold 5', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"failed_console_logins"/);
      expect(terraformCode).toMatch(/threshold\s*=\s*"5"/);
    });

    test('should send all alarms to SNS topic', () => {
      const alarmActions = terraformCode.match(/alarm_actions\s*=\s*\[aws_sns_topic\.security_alerts\.arn\]/g);
      expect(alarmActions).not.toBeNull();
      expect(alarmActions!.length).toBeGreaterThanOrEqual(6);
    });
  });

  // =============================================================================
  // Lambda Function Tests (continuing...)
  // =============================================================================

  describe('Lambda Compliance Function', () => {
    test('should define CloudWatch log group for Lambda', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"compliance_lambda"/);
      expect(terraformCode).toMatch(/\/aws\/lambda\/.*compliance-check/);
    });

    test('should define IAM role for Lambda', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role"\s+"compliance_lambda"/);
    });

    test('should define IAM policy for Lambda with necessary permissions', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role_policy"\s+"compliance_lambda"/);
      expect(terraformCode).toMatch(/ec2:DescribeSecurityGroups/);
      expect(terraformCode).toMatch(/s3:GetBucketEncryption/);
      expect(terraformCode).toMatch(/cloudtrail:DescribeTrails/);
      expect(terraformCode).toMatch(/sns:Publish/);
      expect(terraformCode).toMatch(/cloudwatch:PutMetricData/);
    });

    test('should define Lambda function with unique name', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_lambda_function"\s+"compliance_check"/);
      expect(terraformCode).toMatch(/function_name\s*=\s*"\$\{var\.application\}-compliance-check-\$\{local\.env_suffix\}"/);
    });

    test('should use Python 3.12 runtime', () => {
      expect(terraformCode).toMatch(/runtime\s*=\s*"python3\.12"/);
    });

    test('should set Lambda timeout to 300 seconds', () => {
      expect(terraformCode).toMatch(/timeout\s*=\s*300/);
    });

    test('should set Lambda memory to 256 MB', () => {
      expect(terraformCode).toMatch(/memory_size\s*=\s*256/);
    });

    test('should define Lambda environment variables', () => {
      expect(terraformCode).toMatch(/aws_lambda_function.*compliance_check[\s\S]*?environment\s*\{/);
      expect(terraformCode).toMatch(/SNS_TOPIC_ARN/);
      expect(terraformCode).toMatch(/CLOUDTRAIL_NAME/);
      expect(terraformCode).toMatch(/VPC_ID/);
      expect(terraformCode).toMatch(/ENVIRONMENT.*var\.environment/);
      expect(terraformCode).toMatch(/APPLICATION.*var\.application/);
    });

    test('should have proper dependencies for Lambda', () => {
      expect(terraformCode).toMatch(/depends_on\s*=\s*\[[\s\S]*?aws_iam_role_policy\.compliance_lambda/);
      expect(terraformCode).toMatch(/depends_on[\s\S]*?aws_cloudwatch_log_group\.compliance_lambda/);
    });
  });

  // =============================================================================
  // EventBridge Rules Tests (continuing...)
  // =============================================================================

  describe('EventBridge Automation', () => {
    test('should define scheduled compliance check rule', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"compliance_check_schedule"/);
      expect(terraformCode).toMatch(/schedule_expression\s*=\s*var\.compliance_check_schedule/);
    });

    test('should define EventBridge target for compliance Lambda', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"compliance_check_schedule"/);
      expect(terraformCode).toMatch(/arn\s*=\s*aws_lambda_function\.compliance_check\.arn/);
    });

    test('should define Lambda permission for EventBridge', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_lambda_permission"\s+"compliance_check_schedule"/);
      expect(terraformCode).toMatch(/principal\s*=\s*"events\.amazonaws\.com"/);
    });

    test('should define real-time security group change detection', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"security_group_changes_realtime"/);
      expect(terraformCode).toMatch(/event_pattern/);
      expect(terraformCode).toMatch(/AuthorizeSecurityGroupIngress/);
    });

    test('should define EventBridge target for security group changes', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"security_group_changes_realtime"/);
    });

    test('should define root login detection rule', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"root_login_realtime"/);
      expect(terraformCode).toMatch(/aws\.signin/);
    });

    test('should define IAM changes detection rule', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"iam_changes_realtime"/);
      expect(terraformCode).toMatch(/aws\.iam/);
    });

    test('should use input transformers for EventBridge notifications', () => {
      expect(terraformCode).toMatch(/input_transformer\s*\{/);
      expect(terraformCode).toMatch(/input_paths\s*=/);
      expect(terraformCode).toMatch(/input_template\s*=/);
    });
  });

  // =============================================================================
  // Outputs Tests (continuing...)
  // =============================================================================

  describe('Outputs', () => {
    test('should output VPC ID', () => {
      expect(terraformCode).toMatch(/output\s+"vpc_id"\s+\{[\s\S]*?value\s*=\s*aws_vpc\.main\.id/);
    });

    test('should output VPC CIDR', () => {
      expect(terraformCode).toMatch(/output\s+"vpc_cidr"\s+\{[\s\S]*?value\s*=\s*aws_vpc\.main\.cidr_block/);
    });

    test('should output public subnet IDs', () => {
      expect(terraformCode).toMatch(/output\s+"public_subnet_ids"\s+\{[\s\S]*?value\s*=\s*aws_subnet\.public\[\*\]\.id/);
    });

    test('should output private subnet IDs', () => {
      expect(terraformCode).toMatch(/output\s+"private_subnet_ids"\s+\{[\s\S]*?value\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });

    test('should output Internet Gateway ID', () => {
      expect(terraformCode).toMatch(/output\s+"internet_gateway_id"/);
    });

    test('should output NAT Gateway IDs', () => {
      expect(terraformCode).toMatch(/output\s+"nat_gateway_ids"/);
    });

    test('should output all security group IDs', () => {
      expect(terraformCode).toMatch(/output\s+"web_security_group_id"/);
      expect(terraformCode).toMatch(/output\s+"app_security_group_id"/);
      expect(terraformCode).toMatch(/output\s+"database_security_group_id"/);
      expect(terraformCode).toMatch(/output\s+"bastion_security_group_id"/);
    });

    test('should output CloudTrail ARN and name', () => {
      expect(terraformCode).toMatch(/output\s+"cloudtrail_arn"/);
      expect(terraformCode).toMatch(/output\s+"cloudtrail_name"/);
    });

    test('should output S3 bucket information', () => {
      expect(terraformCode).toMatch(/output\s+"cloudtrail_s3_bucket_name"/);
      expect(terraformCode).toMatch(/output\s+"cloudtrail_s3_bucket_arn"/);
    });

    test('should output KMS key information', () => {
      expect(terraformCode).toMatch(/output\s+"kms_key_id"/);
      expect(terraformCode).toMatch(/output\s+"kms_key_arn"/);
    });

    test('should output SNS topic ARN', () => {
      expect(terraformCode).toMatch(/output\s+"sns_topic_arn"\s+\{[\s\S]*?value\s*=\s*aws_sns_topic\.security_alerts\.arn/);
    });

    test('should output Lambda function information', () => {
      expect(terraformCode).toMatch(/output\s+"compliance_lambda_function_name"/);
      expect(terraformCode).toMatch(/output\s+"compliance_lambda_function_arn"/);
    });

    test('should output CloudWatch log group names', () => {
      expect(terraformCode).toMatch(/output\s+"vpc_flow_log_group_name"/);
      expect(terraformCode).toMatch(/output\s+"cloudtrail_log_group_name"/);
    });

    test('should output environment suffix', () => {
      expect(terraformCode).toMatch(/output\s+"environment_suffix"\s+\{[\s\S]*?value\s*=\s*local\.env_suffix/);
    });

    test('should have at least 20 outputs total', () => {
      const outputs = terraformCode.match(/output\s+"/g);
      expect(outputs).not.toBeNull();
      expect(outputs!.length).toBeGreaterThanOrEqual(20);
    });
  });

  // =============================================================================
  // Compliance and Security Tests (continuing...)
  // =============================================================================

  describe('Compliance and Security', () => {
    test('should have encryption enabled for all storage', () => {
      expect(terraformCode).toMatch(/kms_key_id/);
      expect(terraformCode).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test('should use customer-managed KMS keys', () => {
      const kmsReferences = terraformCode.match(/kms_key_id\s*=\s*aws_kms_key\.main\.(arn|id)/g);
      expect(kmsReferences).not.toBeNull();
      expect(kmsReferences!.length).toBeGreaterThanOrEqual(3);
    });

    test('should have proper tagging on all resources', () => {
      const tagMatches = terraformCode.match(/tags\s*=/g);
      expect(tagMatches).not.toBeNull();
      expect(tagMatches!.length).toBeGreaterThanOrEqual(20);
    });

    test('should use common_tags or merge with common_tags', () => {
      const commonTagsUsage = terraformCode.match(/(tags\s*=\s*local\.common_tags|merge\(\s*local\.common_tags)/g);
      expect(commonTagsUsage).not.toBeNull();
      expect(commonTagsUsage!.length).toBeGreaterThanOrEqual(15);
    });

    test('should enforce HTTPS/TLS for S3', () => {
      expect(terraformCode).toMatch(/aws:SecureTransport/);
    });

    test('should block public access for S3 buckets', () => {
      expect(terraformCode).toMatch(/block_public_acls\s*=\s*true/);
      expect(terraformCode).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('should have comprehensive audit logging', () => {
      expect(terraformCode).toMatch(/enable_log_file_validation\s*=\s*true/);
      expect(terraformCode).toMatch(/traffic_type\s*=\s*"ALL"/);
    });

    test('should have multi-AZ architecture for high availability', () => {
      expect(terraformCode).toMatch(/availability_zone_count/);
      expect(terraformCode).toMatch(/count\s*=\s*var\.availability_zone_count/);
    });
  });

  // =============================================================================
  // File Structure Tests (continuing...)
  // =============================================================================

  describe('File Structure', () => {
    test('should be a comprehensive single Terraform file', () => {
      expect(terraformCode.length).toBeGreaterThan(10000);
    });

    test('should not have provider block (should be in provider.tf)', () => {
      expect(terraformCode).not.toMatch(/provider\s+"aws"\s+\{/);
    });

    test('should not have terraform block (should be in provider.tf)', () => {
      expect(terraformCode).not.toMatch(/terraform\s+\{[\s\S]*?required_providers/);
    });

    test('should have proper section organization with comments', () => {
      expect(terraformCode).toMatch(/Variables Section/);
      expect(terraformCode).toMatch(/Data Sources/);
      expect(terraformCode).toMatch(/Locals/);
      expect(terraformCode).toMatch(/KMS Encryption/);
      expect(terraformCode).toMatch(/VPC and Networking/);
      expect(terraformCode).toMatch(/Security Groups/);
      expect(terraformCode).toMatch(/CloudTrail/);
      expect(terraformCode).toMatch(/Lambda/);
      expect(terraformCode).toMatch(/EventBridge/);
      expect(terraformCode).toMatch(/Outputs/);
    });
  });
});
