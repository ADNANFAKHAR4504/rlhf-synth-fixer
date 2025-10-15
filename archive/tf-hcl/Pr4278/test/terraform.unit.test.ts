import { readFileSync } from 'fs';
import { join } from 'path';

const terraformCode = readFileSync(
  join(__dirname, '../lib/tap_stack.tf'),
  'utf-8'
);

describe('Terraform Infrastructure Unit Tests - Multi-Account VPC Peering', () => {

  describe('File Structure', () => {
    test('should be a single Terraform file', () => {
      expect(terraformCode.length).toBeGreaterThan(1000);
    });

    test('should not have provider block (should be in provider.tf)', () => {
      expect(terraformCode).not.toMatch(/provider\s+"aws"\s+\{/);
    });

    test('should not have terraform block (should be in provider.tf)', () => {
      expect(terraformCode).not.toMatch(/terraform\s+\{[\s\S]*?required_providers/);
    });
  });

  describe('Variables - Basic Configuration', () => {
    test('should define primary_region variable with default', () => {
      expect(terraformCode).toMatch(/variable\s+"primary_region"\s+\{[\s\S]*?default\s*=\s*"us-east-1"/);
    });

    test('should define peer_account_ids variable as list', () => {
      expect(terraformCode).toMatch(/variable\s+"peer_account_ids"\s+\{[\s\S]*?type\s*=\s*list\(string\)/);
    });

    test('should define account_id_map variable', () => {
      expect(terraformCode).toMatch(/variable\s+"account_id_map"\s+\{[\s\S]*?type\s*=\s*map\(string\)/);
    });

    test('should define cross_account_role_name variable with default', () => {
      expect(terraformCode).toMatch(/variable\s+"cross_account_role_name"\s+\{[\s\S]*?default\s*=\s*"TerraformPeeringRole"/);
    });

    test('should define environment variable with validation', () => {
      expect(terraformCode).toMatch(/variable\s+"environment"\s+\{[\s\S]*?validation\s*\{/);
    });

    test('should define project_name variable', () => {
      expect(terraformCode).toMatch(/variable\s+"project_name"\s+\{/);
    });

    test('should define owner variable', () => {
      expect(terraformCode).toMatch(/variable\s+"owner"\s+\{/);
    });
  });

  describe('Variables - VPC Configuration', () => {
    test('should define vpc_count variable with default 10', () => {
      expect(terraformCode).toMatch(/variable\s+"vpc_count"\s+\{[\s\S]*?default\s*=\s*10/);
    });

    test('should have vpc_count validation', () => {
      expect(terraformCode).toMatch(/variable\s+"vpc_count"[\s\S]*?validation\s*\{/);
    });

    test('should define vpc_base_cidr variable', () => {
      expect(terraformCode).toMatch(/variable\s+"vpc_base_cidr"\s+\{/);
    });

    test('should define peering_topology variable', () => {
      expect(terraformCode).toMatch(/variable\s+"peering_topology"\s+\{/);
    });

    test('should have peering_topology validation for full-mesh, hub-spoke, custom', () => {
      expect(terraformCode).toMatch(/variable\s+"peering_topology"[\s\S]*?validation[\s\S]*?full-mesh.*hub-spoke.*custom/);
    });

    test('should define custom_peering_map variable', () => {
      expect(terraformCode).toMatch(/variable\s+"custom_peering_map"\s+\{/);
    });

    test('should define database_access_map variable', () => {
      expect(terraformCode).toMatch(/variable\s+"database_access_map"\s+\{/);
    });
  });

  describe('Variables - Logging and Monitoring', () => {
    test('should define flow_log_retention_days variable', () => {
      expect(terraformCode).toMatch(/variable\s+"flow_log_retention_days"\s+\{/);
    });

    test('should define log_archive_transition_days variable', () => {
      expect(terraformCode).toMatch(/variable\s+"log_archive_transition_days"\s+\{/);
    });

    test('should define log_archive_deletion_days variable', () => {
      expect(terraformCode).toMatch(/variable\s+"log_archive_deletion_days"\s+\{/);
    });

    test('should define sns_topic_email variable', () => {
      expect(terraformCode).toMatch(/variable\s+"sns_topic_email"\s+\{/);
    });

    test('should define compliance_check_schedule variable', () => {
      expect(terraformCode).toMatch(/variable\s+"compliance_check_schedule"\s+\{/);
    });
  });

  describe('Variables - Feature Flags', () => {
    test('should define enable_flow_logs_to_s3 variable', () => {
      expect(terraformCode).toMatch(/variable\s+"enable_flow_logs_to_s3"\s+\{[\s\S]*?type\s*=\s*bool/);
    });

    test('should define enable_compliance_lambda variable', () => {
      expect(terraformCode).toMatch(/variable\s+"enable_compliance_lambda"\s+\{[\s\S]*?type\s*=\s*bool/);
    });

    test('should define enable_cloudtrail variable', () => {
      expect(terraformCode).toMatch(/variable\s+"enable_cloudtrail"\s+\{[\s\S]*?type\s*=\s*bool/);
    });

    test('should define lambda_runtime variable', () => {
      expect(terraformCode).toMatch(/variable\s+"lambda_runtime"\s+\{/);
    });

    test('should define environment_suffix variable', () => {
      expect(terraformCode).toMatch(/variable\s+"environment_suffix"\s+\{/);
    });
  });

  describe('Data Sources', () => {
    test('should define aws_availability_zones data source', () => {
      expect(terraformCode).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });

    test('should filter availability zones by state available', () => {
      expect(terraformCode).toMatch(/data\s+"aws_availability_zones"[\s\S]*?state\s*=\s*"available"/);
    });
  });

  describe('Random Resources', () => {
    test('should define random_string resource for environment suffix', () => {
      expect(terraformCode).toMatch(/resource\s+"random_string"\s+"environment_suffix"/);
    });

    test('should set random_string length to 8', () => {
      expect(terraformCode).toMatch(/resource\s+"random_string"[\s\S]*?length\s*=\s*8/);
    });

    test('should disable special characters in random_string', () => {
      expect(terraformCode).toMatch(/resource\s+"random_string"[\s\S]*?special\s*=\s*false/);
    });

    test('should disable uppercase in random_string', () => {
      expect(terraformCode).toMatch(/resource\s+"random_string"[\s\S]*?upper\s*=\s*false/);
    });
  });

  describe('Locals', () => {
    test('should define locals block', () => {
      expect(terraformCode).toMatch(/locals\s+\{/);
    });

    test('should define env_suffix in locals', () => {
      expect(terraformCode).toMatch(/locals\s+\{[\s\S]*?env_suffix\s*=/);
    });

    test('should define common_tags in locals', () => {
      expect(terraformCode).toMatch(/locals\s+\{[\s\S]*?common_tags\s*=/);
    });

    test('should include Environment tag in common_tags', () => {
      expect(terraformCode).toMatch(/common_tags\s*=[\s\S]*?Environment\s*=\s*var\.environment/);
    });

    test('should include Project tag in common_tags', () => {
      expect(terraformCode).toMatch(/common_tags\s*=[\s\S]*?Project\s*=\s*var\.project_name/);
    });

    test('should include Owner tag in common_tags', () => {
      expect(terraformCode).toMatch(/common_tags\s*=[\s\S]*?Owner\s*=\s*var\.owner/);
    });

    test('should include ManagedBy tag in common_tags', () => {
      expect(terraformCode).toMatch(/common_tags\s*=[\s\S]*?ManagedBy\s*=\s*"Terraform"/);
    });

    test('should define vpc_cidrs in locals', () => {
      expect(terraformCode).toMatch(/locals\s+\{[\s\S]*?vpc_cidrs\s*=/);
    });

    test('should define public_subnet_cidrs in locals', () => {
      expect(terraformCode).toMatch(/locals\s+\{[\s\S]*?public_subnet_cidrs\s*=/);
    });

    test('should define private_subnet_cidrs in locals', () => {
      expect(terraformCode).toMatch(/locals\s+\{[\s\S]*?private_subnet_cidrs\s*=/);
    });

    test('should define peering_connections in locals', () => {
      expect(terraformCode).toMatch(/locals\s+\{[\s\S]*?peering_connections\s*=/);
    });

    test('should define peering_pairs in locals', () => {
      expect(terraformCode).toMatch(/locals\s+\{[\s\S]*?peering_pairs\s*=/);
    });

    test('should define vpc_account_ids in locals', () => {
      expect(terraformCode).toMatch(/locals\s+\{[\s\S]*?vpc_account_ids\s*=/);
    });

    test('should define https_ingress_rules in locals for unique security group rules', () => {
      expect(terraformCode).toMatch(/locals\s+\{[\s\S]*?https_ingress_rules\s*=/);
    });

    test('should define https_ingress_unique in locals to deduplicate rules', () => {
      expect(terraformCode).toMatch(/locals\s+\{[\s\S]*?https_ingress_unique\s*=/);
    });
  });

  describe('VPC Resources', () => {
    test('should define VPC resource', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    });

    test('should use count for multiple VPCs', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_vpc"\s+"main"[\s\S]*?count\s*=\s*var\.vpc_count/);
    });

    test('should enable DNS hostnames in VPC', () => {
      expect(terraformCode).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test('should enable DNS support in VPC', () => {
      expect(terraformCode).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('should use dynamic CIDR blocks for VPCs', () => {
      expect(terraformCode).toMatch(/cidr_block\s*=\s*local\.vpc_cidrs\[count\.index\]/);
    });

    test('should tag VPCs with unique names using env_suffix', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_vpc"[\s\S]*?Name\s*=.*\$\{local\.env_suffix\}/);
    });

    test('should tag VPCs with VPCIndex', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_vpc"[\s\S]*?VPCIndex\s*=/);
    });
  });

  describe('Subnet Resources', () => {
    test('should define public subnet resource', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    });

    test('should define private subnet resource', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test('should create multiple public subnets with count', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_subnet"\s+"public"[\s\S]*?count\s*=\s*var\.vpc_count\s*\*\s*2/);
    });

    test('should create multiple private subnets with count', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_subnet"\s+"private"[\s\S]*?count\s*=\s*var\.vpc_count\s*\*\s*2/);
    });

    test('should enable public IP on launch for public subnets', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_subnet"\s+"public"[\s\S]*?map_public_ip_on_launch\s*=\s*true/);
    });

    test('should use multiple availability zones', () => {
      expect(terraformCode).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names/);
    });

    test('should tag subnets with Type', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_subnet"[\s\S]*?Type\s*=\s*"(Public|Private)"/);
    });
  });

  describe('Internet Gateway Resources', () => {
    test('should define internet gateway resource', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test('should create IGW for each VPC', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_internet_gateway"[\s\S]*?count\s*=\s*var\.vpc_count/);
    });

    test('should attach IGW to VPC', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_internet_gateway"[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\[count\.index\]\.id/);
    });
  });

  describe('NAT Gateway Resources', () => {
    test('should define elastic IP resource for NAT', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_eip"\s+"nat"/);
    });

    test('should define NAT gateway resource', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
    });

    test('should create multiple NAT gateways', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_nat_gateway"[\s\S]*?count\s*=\s*var\.vpc_count\s*\*\s*2/);
    });

    test('should associate EIP with NAT gateway', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_nat_gateway"[\s\S]*?allocation_id\s*=\s*aws_eip\.nat/);
    });

    test('should place NAT gateway in public subnet', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_nat_gateway"[\s\S]*?subnet_id\s*=\s*aws_subnet\.public/);
    });

    test('should have NAT gateway depend on IGW', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_nat_gateway"[\s\S]*?depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });
  });

  describe('Route Table Resources', () => {
    test('should define public route table resource', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    });

    test('should define private route table resource', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_route_table"\s+"private"/);
    });

    test('should create route to internet gateway for public subnets', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_route"\s+"public_internet"/);
    });

    test('should create route to NAT gateway for private subnets', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_route"\s+"private_nat"/);
    });

    test('should define route table associations', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_route_table_association"/);
    });

    test('should tag route tables with Type', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_route_table"[\s\S]*?Type\s*=\s*"(Public|Private)"/);
    });
  });

  describe('VPC Peering Resources', () => {
    test('should define VPC peering connection resource', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_vpc_peering_connection"\s+"main"/);
    });

    test('should create peering connections based on peering_pairs', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_vpc_peering_connection"[\s\S]*?count\s*=\s*length\(local\.peering_pairs\)/);
    });

    test('should set peer_owner_id for cross-account peering', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_vpc_peering_connection"[\s\S]*?peer_owner_id\s*=/);
    });

    test('should define VPC peering connection accepter', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_vpc_peering_connection_accepter"\s+"main"/);
    });

    test('should tag peering connections with Side', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_vpc_peering_connection"[\s\S]*?Side\s*=\s*"Requester"/);
    });
  });

  describe('Peering Routes', () => {
    test('should define peering routes for requester public route tables', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_route"\s+"peering_requester_public"/);
    });

    test('should define peering routes for requester private route tables', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_route"\s+"peering_requester_private"/);
    });

    test('should define peering routes for accepter public route tables', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_route"\s+"peering_accepter_public"/);
    });

    test('should define peering routes for accepter private route tables', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_route"\s+"peering_accepter_private"/);
    });

    test('should have peering routes depend on peering connections', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_route"\s+"peering_[\s\S]*?depends_on\s*=\s*\[aws_vpc_peering_connection\.main\]/);
    });
  });

  describe('Security Groups', () => {
    test('should define security group resource for VPC peering', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_security_group"\s+"vpc_peering"/);
    });

    test('should create security group for each VPC', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_security_group"\s+"vpc_peering"[\s\S]*?count\s*=\s*var\.vpc_count/);
    });

    test('should use name_prefix for security groups', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_security_group"[\s\S]*?name_prefix\s*=/);
    });

    test('should define HTTPS ingress rule', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_security_group_rule"\s+"https_ingress"/);
    });

    test('should use for_each for HTTPS ingress rules to avoid duplicates', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_security_group_rule"\s+"https_ingress"[\s\S]*?for_each\s*=\s*local\.https_ingress_unique/);
    });

    test('should allow port 443 in security group rules', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_security_group_rule"[\s\S]*?from_port\s*=\s*443[\s\S]*?to_port\s*=\s*443/);
    });

    test('should define MySQL ingress rule', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_security_group_rule"\s+"mysql_from_specific_vpcs"/);
    });

    test('should allow port 3306 in MySQL rule', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_security_group_rule"[\s\S]*?from_port\s*=\s*3306[\s\S]*?to_port\s*=\s*3306/);
    });

    test('should define egress rules', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_security_group_rule"\s+"egress_to_all"/);
    });

    test('should have create_before_destroy lifecycle', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_security_group"[\s\S]*?lifecycle\s*\{[\s\S]*?create_before_destroy\s*=\s*true/);
    });
  });

  describe('KMS Encryption', () => {
    test('should define KMS key resource', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
    });

    test('should enable key rotation', () => {
      expect(terraformCode).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('should set deletion window to 30 days', () => {
      expect(terraformCode).toMatch(/deletion_window_in_days\s*=\s*30/);
    });

    test('should include CloudWatch Logs in KMS policy', () => {
      expect(terraformCode).toMatch(/Service.*logs\.\$\{var\.primary_region\}\.amazonaws\.com/);
    });

    test('should include CloudTrail in KMS policy', () => {
      expect(terraformCode).toMatch(/Service.*cloudtrail\.amazonaws\.com/);
    });

    test('should include SNS in KMS policy', () => {
      expect(terraformCode).toMatch(/Service.*sns\.amazonaws\.com/);
    });

    test('should include S3 in KMS policy', () => {
      expect(terraformCode).toMatch(/Service.*s3\.amazonaws\.com/);
    });

    test('should include IAM root permissions in KMS policy', () => {
      expect(terraformCode).toMatch(/arn:aws:iam::\$\{data\.aws_caller_identity\.current\.account_id\}:root/);
    });

    test('should define KMS alias with unique name', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_kms_alias"\s+"main"[\s\S]*?name\s*=\s*"alias\/.*\$\{local\.env_suffix\}"/);
    });
  });

  describe('VPC Flow Logs', () => {
    test('should define CloudWatch log group for flow logs', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"flow_logs"/);
    });

    test('should create log group for each VPC', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"flow_logs"[\s\S]*?count\s*=\s*var\.vpc_count/);
    });

    test('should encrypt log groups with KMS', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_group"[\s\S]*?kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test('should define IAM role for flow logs', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role"\s+"flow_logs"/);
    });

    test('should define IAM policy for flow logs', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role_policy"\s+"flow_logs"/);
    });

    test('should define flow log resource', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_flow_log"\s+"main"/);
    });

    test('should set traffic type to ALL for flow logs', () => {
      expect(terraformCode).toMatch(/traffic_type\s*=\s*"ALL"/);
    });
  });

  describe('S3 Centralized Logging', () => {
    test('should define S3 bucket for logs', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
    });

    test('should use unique bucket name with account ID and suffix', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket"[\s\S]*?bucket\s*=.*data\.aws_caller_identity\.current\.account_id.*local\.env_suffix/);
    });

    test('should enable versioning on S3 bucket', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"logs"/);
    });

    test('should enable server-side encryption with KMS', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logs"/);
    });

    test('should block public access on S3 bucket', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"logs"/);
    });

    test('should define lifecycle configuration', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"logs"/);
    });

    test('should transition to Glacier', () => {
      expect(terraformCode).toMatch(/storage_class\s*=\s*"GLACIER"/);
    });

    test('should define bucket policy', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"logs"/);
    });

    test('should allow CloudTrail to write to bucket', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_policy"[\s\S]*?Service.*cloudtrail\.amazonaws\.com/);
    });

    test('should use concat for conditional cross-account policy statements', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_policy"[\s\S]*?Statement\s*=\s*concat\(/);
    });

    test('should conditionally add cross-account write policy based on peer_account_ids', () => {
      expect(terraformCode).toMatch(/length\(var\.peer_account_ids\)\s*>\s*0\s*\?\s*\[[\s\S]*?AllowCrossAccountWrite/);
    });
  });

  describe('CloudTrail', () => {
    test('should define CloudTrail resource', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
    });

    test('should use conditional count for CloudTrail', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudtrail"[\s\S]*?count\s*=\s*var\.enable_cloudtrail/);
    });

    test('should enable multi-region trail', () => {
      expect(terraformCode).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test('should enable log file validation', () => {
      expect(terraformCode).toMatch(/enable_log_file_validation\s*=\s*true/);
    });

    test('should encrypt with KMS', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudtrail"[\s\S]*?kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test('should include global service events', () => {
      expect(terraformCode).toMatch(/include_global_service_events\s*=\s*true/);
    });
  });

  describe('SNS Topic', () => {
    test('should define SNS topic for alerts', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
    });

    test('should use unique SNS topic name with suffix', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_sns_topic"[\s\S]*?name\s*=.*\$\{local\.env_suffix\}/);
    });

    test('should encrypt SNS topic with KMS', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_sns_topic"[\s\S]*?kms_master_key_id\s*=\s*aws_kms_key\.main\.id/);
    });

    test('should define SNS topic subscription', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"email"/);
    });

    test('should use email protocol for subscription', () => {
      expect(terraformCode).toMatch(/protocol\s*=\s*"email"/);
    });

    test('should define SNS topic policy', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_sns_topic_policy"\s+"alerts"/);
    });

    test('should allow EventBridge to publish to SNS', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_sns_topic_policy"[\s\S]*?Service.*events\.amazonaws\.com/);
    });

    test('should use concat for conditional SNS cross-account policy', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_sns_topic_policy"[\s\S]*?Statement\s*=\s*concat\(/);
    });

    test('should conditionally add cross-account publish policy to SNS based on peer_account_ids', () => {
      expect(terraformCode).toMatch(/length\(var\.peer_account_ids\)\s*>\s*0\s*\?\s*\[[\s\S]*?AllowCrossAccountPublish/);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should define metric filter for rejected connections', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"rejected_connections"/);
    });

    test('should use pattern for REJECT action', () => {
      expect(terraformCode).toMatch(/pattern\s*=.*action=REJECT/);
    });

    test('should define metric transformation', () => {
      expect(terraformCode).toMatch(/metric_transformation\s*\{/);
    });

    test('should use Corp/VPCPeering/Security namespace', () => {
      expect(terraformCode).toMatch(/namespace\s*=\s*"Corp\/VPCPeering\/Security"/);
    });

    test('should include VPC index in metric name', () => {
      expect(terraformCode).toMatch(/name\s*=\s*"RejectedConnections-VPC-\$\{count\.index\}"/);
    });

    test('should not use both dimensions and default_value (mutually exclusive)', () => {
      // Check that default_value is not present when dimensions are used
      const metricTransformationBlocks = terraformCode.match(/metric_transformation\s*\{[\s\S]*?\}/g) || [];
      metricTransformationBlocks.forEach(block => {
        const hasDimensions = /dimensions\s*=/.test(block);
        const hasDefaultValue = /default_value\s*=/.test(block);
        if (hasDimensions) {
          expect(hasDefaultValue).toBe(false);
        }
      });
    });

    test('should define alarm for rejected connections', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rejected_connections"/);
    });

    test('should create alarm for each VPC', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rejected_connections"[\s\S]*?count\s*=\s*var\.vpc_count/);
    });

    test('should set alarm actions to SNS topic', () => {
      expect(terraformCode).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.alerts\.arn\]/);
    });
  });

  describe('EventBridge Rules', () => {
    test('should define rule for peering connection deleted', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"peering_deleted"/);
    });

    test('should capture DeleteVpcPeeringConnection event', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"peering_deleted"[\s\S]*?DeleteVpcPeeringConnection/);
    });

    test('should define rule for security group modified', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"security_group_modified"/);
    });

    test('should capture AuthorizeSecurityGroupIngress event', () => {
      expect(terraformCode).toMatch(/AuthorizeSecurityGroupIngress/);
    });

    test('should define rule for unauthorized API calls', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"unauthorized_api_calls"/);
    });

    test('should capture UnauthorizedOperation error', () => {
      expect(terraformCode).toMatch(/UnauthorizedOperation/);
    });

    test('should define EventBridge targets for SNS', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_event_target"/);
    });
  });

  describe('Lambda Compliance Function', () => {
    test('should define IAM role for Lambda', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role"\s+"compliance_lambda"/);
    });

    test('should use conditional count for Lambda role', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role"\s+"compliance_lambda"[\s\S]*?count\s*=\s*var\.enable_compliance_lambda/);
    });

    test('should define IAM policy for Lambda', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role_policy"\s+"compliance_lambda"/);
    });

    test('should allow Lambda to describe VPCs', () => {
      expect(terraformCode).toMatch(/ec2:DescribeVpcs/);
    });

    test('should allow Lambda to describe peering connections', () => {
      expect(terraformCode).toMatch(/ec2:DescribeVpcPeeringConnections/);
    });

    test('should allow Lambda to assume cross-account roles', () => {
      expect(terraformCode).toMatch(/sts:AssumeRole/);
    });

    test('should use concat for conditional Lambda IAM policy statements', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role_policy"\s+"compliance_lambda"[\s\S]*?Statement\s*=\s*concat\(/);
    });

    test('should conditionally add AssumeRole policy based on peer_account_ids', () => {
      expect(terraformCode).toMatch(/length\(var\.peer_account_ids\)\s*>\s*0\s*\?\s*\[[\s\S]*?sts:AssumeRole/);
    });

    test('should define archive_file data source for Lambda', () => {
      expect(terraformCode).toMatch(/data\s+"archive_file"\s+"compliance_lambda"/);
    });

    test('should define Lambda function resource', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_lambda_function"\s+"compliance"/);
    });

    test('should use Python 3.12 runtime', () => {
      expect(terraformCode).toMatch(/runtime\s*=\s*var\.lambda_runtime/);
    });

    test('should set Lambda timeout to 300 seconds', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_lambda_function"[\s\S]*?timeout\s*=\s*300/);
    });

    test('should define environment variables for Lambda', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_lambda_function"[\s\S]*?environment\s*\{[\s\S]*?variables\s*=/);
    });

    test('should pass VPC_IDS to Lambda environment', () => {
      expect(terraformCode).toMatch(/VPC_IDS\s*=/);
    });

    test('should pass PEERING_CONNECTION_IDS to Lambda environment', () => {
      expect(terraformCode).toMatch(/PEERING_CONNECTION_IDS\s*=/);
    });

    test('should define CloudWatch log group for Lambda', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"compliance_lambda"/);
    });

    test('should define EventBridge rule for scheduled Lambda', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"compliance_schedule"/);
    });

    test('should define EventBridge target for Lambda', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"compliance_lambda"/);
    });

    test('should define Lambda permission for EventBridge', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_eventbridge"/);
    });
  });

  describe('Outputs', () => {
    test('should output vpc_ids', () => {
      expect(terraformCode).toMatch(/output\s+"vpc_ids"\s+\{[\s\S]*?value\s*=.*aws_vpc\.main/);
    });

    test('should output vpc_cidrs', () => {
      expect(terraformCode).toMatch(/output\s+"vpc_cidrs"\s+\{[\s\S]*?value\s*=.*aws_vpc\.main/);
    });

    test('should output peering_connection_ids', () => {
      expect(terraformCode).toMatch(/output\s+"peering_connection_ids"\s+\{/);
    });

    test('should output security_group_ids', () => {
      expect(terraformCode).toMatch(/output\s+"security_group_ids"\s+\{/);
    });

    test('should output cloudwatch_log_group_names', () => {
      expect(terraformCode).toMatch(/output\s+"cloudwatch_log_group_names"\s+\{/);
    });

    test('should output s3_bucket_name', () => {
      expect(terraformCode).toMatch(/output\s+"s3_bucket_name"\s+\{[\s\S]*?value\s*=\s*aws_s3_bucket\.logs\.id/);
    });

    test('should output s3_bucket_arn', () => {
      expect(terraformCode).toMatch(/output\s+"s3_bucket_arn"\s+\{[\s\S]*?value\s*=\s*aws_s3_bucket\.logs\.arn/);
    });

    test('should output cloudtrail_arn', () => {
      expect(terraformCode).toMatch(/output\s+"cloudtrail_arn"\s+\{/);
    });

    test('should output kms_key_arn', () => {
      expect(terraformCode).toMatch(/output\s+"kms_key_arn"\s+\{[\s\S]*?value\s*=\s*aws_kms_key\.main\.arn/);
    });

    test('should output kms_key_id', () => {
      expect(terraformCode).toMatch(/output\s+"kms_key_id"\s+\{[\s\S]*?value\s*=\s*aws_kms_key\.main\.key_id/);
    });

    test('should output sns_topic_arn', () => {
      expect(terraformCode).toMatch(/output\s+"sns_topic_arn"\s+\{[\s\S]*?value\s*=\s*aws_sns_topic\.alerts\.arn/);
    });

    test('should output lambda_function_arn', () => {
      expect(terraformCode).toMatch(/output\s+"lambda_function_arn"\s+\{/);
    });

    test('should output lambda_function_name', () => {
      expect(terraformCode).toMatch(/output\s+"lambda_function_name"\s+\{/);
    });

    test('should output primary_region', () => {
      expect(terraformCode).toMatch(/output\s+"primary_region"\s+\{[\s\S]*?value\s*=\s*var\.primary_region/);
    });

    test('should output environment', () => {
      expect(terraformCode).toMatch(/output\s+"environment"\s+\{[\s\S]*?value\s*=\s*var\.environment/);
    });

    test('should output peering_topology', () => {
      expect(terraformCode).toMatch(/output\s+"peering_topology"\s+\{[\s\S]*?value\s*=\s*var\.peering_topology/);
    });

    test('should have at least 15 outputs', () => {
      const matches = terraformCode.match(/output\s+"/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(15);
    });
  });

  describe('Security and Compliance', () => {
    test('should have encryption enabled for all storage', () => {
      // Match both kms_key_id and kms_master_key_id patterns
      const kmsKeyIdMatches = terraformCode.match(/kms_key_id\s*=\s*aws_kms_key\.main\.(arn|id)/g) || [];
      const kmsMasterKeyIdMatches = terraformCode.match(/kms_master_key_id\s*=\s*aws_kms_key\.main\.(arn|id)/g) || [];
      const totalKmsMatches = kmsKeyIdMatches.length + kmsMasterKeyIdMatches.length;
      expect(totalKmsMatches).toBeGreaterThanOrEqual(5);
    });

    test('should have proper tagging on resources', () => {
      const tagMatches = terraformCode.match(/tags\s*=/g);
      expect(tagMatches).not.toBeNull();
      expect(tagMatches!.length).toBeGreaterThanOrEqual(20);
    });

    test('should use merge for common tags', () => {
      const mergeMatches = terraformCode.match(/merge\(local\.common_tags/g);
      expect(mergeMatches).not.toBeNull();
      expect(mergeMatches!.length).toBeGreaterThanOrEqual(10);
    });

    test('should use unique naming with env_suffix', () => {
      const suffixMatches = terraformCode.match(/\$\{local\.env_suffix\}/g);
      expect(suffixMatches).not.toBeNull();
      expect(suffixMatches!.length).toBeGreaterThanOrEqual(20);
    });

    test('should have monitoring enabled', () => {
      expect(terraformCode).toMatch(/aws_flow_log/);
      expect(terraformCode).toMatch(/aws_cloudwatch_metric_alarm/);
      expect(terraformCode).toMatch(/aws_cloudwatch_log_metric_filter/);
    });
  });
});
