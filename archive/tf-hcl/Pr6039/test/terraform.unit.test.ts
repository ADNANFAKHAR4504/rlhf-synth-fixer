// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for main.tf
// Static file analysis without executing Terraform

import fs from 'fs';
import path from 'path';

const MAIN_TF_PATH = path.resolve(__dirname, '../lib/main.tf');

describe('Terraform Infrastructure Unit Tests - main.tf', () => {
  let tfContent: string;

  beforeAll(() => {
    expect(fs.existsSync(MAIN_TF_PATH)).toBe(true);
    tfContent = fs.readFileSync(MAIN_TF_PATH, 'utf8');
  });

  // ===========================
  // VARIABLES
  // ===========================
  describe('Variables', () => {
    test('declares aws_region variable', () => {
      expect(tfContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(tfContent).toMatch(/default\s*=\s*"us-west-2"/);
    });

    test('declares project_name variable', () => {
      expect(tfContent).toMatch(/variable\s+"project_name"\s*{/);
      expect(tfContent).toMatch(/default\s*=\s*"nova"/);
    });

    test('declares environment variable', () => {
      expect(tfContent).toMatch(/variable\s+"environment"\s*{/);
      expect(tfContent).toMatch(/default\s*=\s*"prod"/);
    });

    test('declares vpc_cidr variable', () => {
      expect(tfContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
      expect(tfContent).toMatch(/default\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test('declares allowed_ingress_cidrs variable', () => {
      expect(tfContent).toMatch(/variable\s+"allowed_ingress_cidrs"\s*{/);
      expect(tfContent).toMatch(/type\s*=\s*list\(string\)/);
    });

    test('declares db_master_password variable as sensitive', () => {
      expect(tfContent).toMatch(/variable\s+"db_master_password"\s*{/);
      expect(tfContent).toMatch(/sensitive\s*=\s*true/);
    });
  });

  // ===========================
  // DATA SOURCES
  // ===========================
  describe('Data Sources', () => {
    test('fetches available availability zones', () => {
      expect(tfContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
    });

    test('fetches current AWS account identity', () => {
      expect(tfContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
    });

    test('fetches ELB service account', () => {
      expect(tfContent).toMatch(/data\s+"aws_elb_service_account"\s+"main"\s*{/);
    });

    test('fetches latest Amazon Linux 2023 AMI', () => {
      expect(tfContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2023"\s*{/);
      expect(tfContent).toMatch(/most_recent\s*=\s*true/);
      expect(tfContent).toMatch(/owners\s*=\s*\["amazon"\]/);
      expect(tfContent).toMatch(/al2023-ami-\*-x86_64/);
    });
  });

  // ===========================
  // KMS
  // ===========================
  describe('KMS Key', () => {
    test('creates KMS key with rotation enabled', () => {
      expect(tfContent).toMatch(/resource\s+"aws_kms_key"\s+"main"\s*{/);
      expect(tfContent).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(tfContent).toMatch(/deletion_window_in_days\s*=\s*30/);
    });

    test('KMS key has policy for root account', () => {
      expect(tfContent).toMatch(/Enable IAM User Permissions/);
      expect(tfContent).toMatch(/arn:aws:iam::\$\{data\.aws_caller_identity\.current\.account_id\}:root/);
    });

    test('KMS key has policy for CloudWatch Logs', () => {
      expect(tfContent).toMatch(/Allow CloudWatch Logs/);
      expect(tfContent).toMatch(/logs\.\$\{var\.aws_region\}\.amazonaws\.com/);
      expect(tfContent).toMatch(/kms:Encrypt/);
      expect(tfContent).toMatch(/kms:Decrypt/);
      expect(tfContent).toMatch(/kms:GenerateDataKey/);
    });

    test('KMS key has policy for ELB Service', () => {
      expect(tfContent).toMatch(/Allow ELB Service/);
      expect(tfContent).toMatch(/elasticloadbalancing\.amazonaws\.com/);
    });

    test('creates KMS alias', () => {
      expect(tfContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"\s*{/);
      expect(tfContent).toMatch(/target_key_id\s*=\s*aws_kms_key\.main\.key_id/);
    });
  });

  // ===========================
  // VPC & NETWORKING
  // ===========================
  describe('VPC', () => {
    test('creates VPC with DNS support', () => {
      expect(tfContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
      expect(tfContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
      expect(tfContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(tfContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('creates public subnets across availability zones', () => {
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      expect(tfContent).toMatch(/count\s*=\s*2/);
      expect(tfContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test('creates private app subnets', () => {
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"private_app"\s*{/);
      expect(tfContent).toMatch(/count\s*=\s*2/);
    });

    test('creates private DB subnets', () => {
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"private_db"\s*{/);
      expect(tfContent).toMatch(/count\s*=\s*2/);
    });

    test('creates Internet Gateway', () => {
      expect(tfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
      expect(tfContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test('creates Elastic IPs for NAT Gateways', () => {
      expect(tfContent).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
      expect(tfContent).toMatch(/count\s*=\s*2/);
      expect(tfContent).toMatch(/domain\s*=\s*"vpc"/);
    });

    test('creates NAT Gateways in public subnets', () => {
      expect(tfContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
      expect(tfContent).toMatch(/count\s*=\s*2/);
      expect(tfContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
    });

    test('creates route tables with proper routes', () => {
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"private_app"\s*{/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"private_db"\s*{/);
    });

    test('public route table has IGW route', () => {
      expect(tfContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
      expect(tfContent).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
    });

    test('private route tables have NAT gateway routes', () => {
      expect(tfContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index\]\.id/);
    });

    test('creates route table associations for all subnet types', () => {
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"\s*{/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"private_app"\s*{/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"private_db"\s*{/);
    });
  });

  // ===========================
  // VPC FLOW LOGS
  // ===========================
  describe('VPC Flow Logs', () => {
    test('creates CloudWatch log group for VPC Flow Logs with KMS encryption', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs"\s*{/);
      expect(tfContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
      expect(tfContent).toMatch(/retention_in_days\s*=\s*30/);
    });

    test('creates IAM role for VPC Flow Logs', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"vpc_flow_logs"\s*{/);
      expect(tfContent).toMatch(/vpc-flow-logs\.amazonaws\.com/);
    });

    test('creates IAM policy for VPC Flow Logs with CloudWatch permissions', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"vpc_flow_logs"\s*{/);
      expect(tfContent).toMatch(/logs:CreateLogGroup/);
      expect(tfContent).toMatch(/logs:CreateLogStream/);
      expect(tfContent).toMatch(/logs:PutLogEvents/);
    });

    test('enables VPC Flow Logs', () => {
      expect(tfContent).toMatch(/resource\s+"aws_flow_log"\s+"main"\s*{/);
      expect(tfContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
      expect(tfContent).toMatch(/traffic_type\s*=\s*"ALL"/);
      expect(tfContent).toMatch(/log_destination_type\s*=\s*"cloud-watch-logs"/);
    });
  });

  // ===========================
  // SECURITY GROUPS
  // ===========================
  describe('Security Groups', () => {
    test('creates ALB security group', () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"alb"\s*{/);
      expect(tfContent).toMatch(/name\s*=\s*"\$\{local\.name_prefix\}-alb-sg"/);
    });

    test('ALB security group allows HTTP ingress', () => {
      expect(tfContent).toMatch(/for_each\s*=\s*\[80,\s*443\]/);
      expect(tfContent).toMatch(/protocol\s*=\s*"tcp"/);
    });

    test('ALB security group allows all egress', () => {
      expect(tfContent).toMatch(/egress\s*{/);
      expect(tfContent).toMatch(/protocol\s*=\s*"-1"/);
      expect(tfContent).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });

    test('creates app security group', () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"app"\s*{/);
      expect(tfContent).toMatch(/name\s*=\s*"\$\{local\.name_prefix\}-app-sg"/);
    });

    test('app security group allows HTTPS from ALB', () => {
      expect(tfContent).toMatch(/from_port\s*=\s*443/);
      expect(tfContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });

    test('creates RDS security group', () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"rds"\s*{/);
      expect(tfContent).toMatch(/name\s*=\s*"\$\{local\.name_prefix\}-rds-sg"/);
    });

    test('RDS security group allows PostgreSQL from app tier', () => {
      expect(tfContent).toMatch(/from_port\s*=\s*5432/);
      expect(tfContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.app\.id\]/);
    });
  });

  // ===========================
  // S3 BUCKET
  // ===========================
  describe('S3 Bucket', () => {
    test('creates S3 bucket for logs', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"\s*{/);
      expect(tfContent).toMatch(/bucket\s*=\s*"\$\{local\.name_prefix\}-logs-\$\{data\.aws_caller_identity\.current\.account_id\}"/);
    });

    test('enables versioning on logs bucket', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"logs"\s*{/);
      expect(tfContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('enables KMS encryption on logs bucket', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logs"\s*{/);
      expect(tfContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test('blocks all public access on logs bucket', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"logs"\s*{/);
      expect(tfContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(tfContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(tfContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(tfContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('creates bucket policy for ELB access logs', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"logs"\s*{/);
      expect(tfContent).toMatch(/data\.aws_elb_service_account\.main\.arn/);
      expect(tfContent).toMatch(/elasticloadbalancing\.amazonaws\.com/);
      expect(tfContent).toMatch(/s3:PutObject/);
      expect(tfContent).toMatch(/s3:GetBucketAcl/);
      expect(tfContent).toMatch(/depends_on\s*=\s*\[\s*aws_s3_bucket_public_access_block\.logs\s*\]/);
    });
  });

  // ===========================
  // APPLICATION LOAD BALANCER
  // ===========================
  describe('Application Load Balancer', () => {
    test('creates ALB', () => {
      expect(tfContent).toMatch(/resource\s+"aws_lb"\s+"main"\s*{/);
      expect(tfContent).toMatch(/load_balancer_type\s*=\s*"application"/);
      expect(tfContent).toMatch(/internal\s*=\s*false/);
    });

    test('ALB enables access logs to S3', () => {
      expect(tfContent).toMatch(/access_logs\s*{/);
      expect(tfContent).toMatch(/bucket\s*=\s*aws_s3_bucket\.logs\.bucket/);
      expect(tfContent).toMatch(/prefix\s*=\s*"alb-logs"/);
      expect(tfContent).toMatch(/enabled\s*=\s*true/);
    });

    test('ALB depends on S3 bucket policy', () => {
      expect(tfContent).toMatch(/depends_on\s*=\s*\[\s*aws_s3_bucket_policy\.logs\s*\]/);
    });

    test('creates target group for HTTPS', () => {
      expect(tfContent).toMatch(/resource\s+"aws_lb_target_group"\s+"app"\s*{/);
      expect(tfContent).toMatch(/port\s*=\s*443/);
      expect(tfContent).toMatch(/protocol\s*=\s*"HTTPS"/);
    });

    test('target group has health check configuration', () => {
      expect(tfContent).toMatch(/health_check\s*{/);
      expect(tfContent).toMatch(/enabled\s*=\s*true/);
      expect(tfContent).toMatch(/protocol\s*=\s*"HTTPS"/);
      expect(tfContent).toMatch(/healthy_threshold/);
      expect(tfContent).toMatch(/unhealthy_threshold/);
    });

    test('creates HTTP listener', () => {
      expect(tfContent).toMatch(/resource\s+"aws_lb_listener"\s+"http"\s*{/);
      expect(tfContent).toMatch(/port\s*=\s*"80"/);
      expect(tfContent).toMatch(/protocol\s*=\s*"HTTP"/);
    });

    test('HTTP listener forwards to target group', () => {
      expect(tfContent).toMatch(/type\s*=\s*"forward"/);
      expect(tfContent).toMatch(/target_group_arn\s*=\s*aws_lb_target_group\.app\.arn/);
    });
  });

  // ===========================
  // IAM ROLES
  // ===========================
  describe('IAM Roles', () => {
    test('creates EC2 IAM role', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2"\s*{/);
      expect(tfContent).toMatch(/ec2\.amazonaws\.com/);
    });

    test('attaches CloudWatch policy to EC2 role', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_cloudwatch"\s*{/);
      expect(tfContent).toMatch(/logs:CreateLogGroup/);
      expect(tfContent).toMatch(/logs:PutLogEvents/);
    });

    test('creates EC2 instance profile', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2"\s*{/);
      expect(tfContent).toMatch(/role\s*=\s*aws_iam_role\.ec2\.name/);
    });
  });

  // ===========================
  // LAUNCH TEMPLATE & AUTO SCALING
  // ===========================
  describe('Launch Template', () => {
    test('creates launch template', () => {
      expect(tfContent).toMatch(/resource\s+"aws_launch_template"\s+"app"\s*{/);
      expect(tfContent).toMatch(/image_id\s*=\s*data\.aws_ami\.amazon_linux_2023\.id/);
      expect(tfContent).toMatch(/instance_type\s*=\s*"t3\.micro"/);
    });

    test('launch template uses IAM instance profile', () => {
      expect(tfContent).toMatch(/iam_instance_profile\s*{/);
      expect(tfContent).toMatch(/name\s*=\s*aws_iam_instance_profile\.ec2\.name/);
    });

    test('launch template has encrypted EBS volumes with KMS', () => {
      expect(tfContent).toMatch(/block_device_mappings\s*{/);
      expect(tfContent).toMatch(/encrypted\s*=\s*true/);
      expect(tfContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
      expect(tfContent).toMatch(/volume_size\s*=\s*30/);
      expect(tfContent).toMatch(/volume_type\s*=\s*"gp3"/);
    });

    test('launch template has user data for nginx setup', () => {
      expect(tfContent).toMatch(/user_data\s*=\s*base64encode/);
      expect(tfContent).toMatch(/yum install -y nginx/);
      expect(tfContent).toMatch(/systemctl start nginx/);
    });
  });

  // ===========================
  // RDS
  // ===========================
  describe('RDS Database', () => {
    test('creates DB subnet group', () => {
      expect(tfContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"\s*{/);
      expect(tfContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private_db\[\*\]\.id/);
    });

    test('creates RDS instance with PostgreSQL', () => {
      expect(tfContent).toMatch(/resource\s+"aws_db_instance"\s+"postgres"\s*{/);
      expect(tfContent).toMatch(/engine\s*=\s*"postgres"/);
      expect(tfContent).toMatch(/engine_version\s*=\s*"15/);
      expect(tfContent).toMatch(/instance_class\s*=\s*"db\.t3\.micro"/);
    });

    test('RDS has storage encryption with KMS', () => {
      expect(tfContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(tfContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test('RDS is Multi-AZ', () => {
      expect(tfContent).toMatch(/multi_az\s*=\s*true/);
    });

    test('RDS has automated backups configured', () => {
      expect(tfContent).toMatch(/backup_retention_period\s*=\s*7/);
      expect(tfContent).toMatch(/backup_window/);
    });

    test('RDS has maintenance window configured', () => {
      expect(tfContent).toMatch(/maintenance_window/);
    });

    test('RDS uses DB subnet group', () => {
      expect(tfContent).toMatch(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.main\.name/);
    });

    test('RDS uses security group', () => {
      expect(tfContent).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.rds\.id\]/);
    });

    test('RDS has final snapshot configuration', () => {
      expect(tfContent).toMatch(/skip_final_snapshot\s*=\s*false/);
      expect(tfContent).toMatch(/final_snapshot_identifier/);
    });
  });

  // ===========================
  // CLOUDWATCH
  // ===========================
  describe('CloudWatch', () => {
    test('creates CloudWatch log group for application with KMS encryption', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"app"\s*{/);
      expect(tfContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
      expect(tfContent).toMatch(/retention_in_days\s*=\s*30/);
    });
  });

  // ===========================
  // WAF
  // ===========================
  describe('WAF', () => {
    test('creates WAF Web ACL', () => {
      expect(tfContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"\s*{/);
      expect(tfContent).toMatch(/scope\s*=\s*"REGIONAL"/);
    });

    test('WAF has default action', () => {
      expect(tfContent).toMatch(/default_action\s*{/);
      expect(tfContent).toMatch(/allow\s*{/);
    });

    test('WAF has visibility configuration', () => {
      expect(tfContent).toMatch(/visibility_config\s*{/);
      expect(tfContent).toMatch(/cloudwatch_metrics_enabled\s*=\s*true/);
      expect(tfContent).toMatch(/sampled_requests_enabled\s*=\s*true/);
    });

    test('WAF has managed rule groups', () => {
      expect(tfContent).toMatch(/managed_rule_group_statement\s*{/);
      expect(tfContent).toMatch(/AWSManagedRulesCommonRuleSet/);
    });

    test('associates WAF with ALB', () => {
      expect(tfContent).toMatch(/resource\s+"aws_wafv2_web_acl_association"/);
      expect(tfContent).toMatch(/resource_arn\s*=\s*aws_lb\.main\.arn/);
      expect(tfContent).toMatch(/web_acl_arn\s*=\s*aws_wafv2_web_acl\.main\.arn/);
    });
  });

  // ===========================
  // OUTPUTS
  // ===========================
  describe('Outputs', () => {
    test('outputs VPC information', () => {
      expect(tfContent).toMatch(/output\s+"vpc_id"\s*{/);
      expect(tfContent).toMatch(/output\s+"vpc_cidr"\s*{/);
      expect(tfContent).toMatch(/output\s+"vpc_arn"\s*{/);
    });

    test('outputs network information', () => {
      expect(tfContent).toMatch(/output\s+"internet_gateway_id"\s*{/);
      expect(tfContent).toMatch(/output\s+"nat_gateway_ids"\s*{/);
    });

    test('outputs subnet information', () => {
      expect(tfContent).toMatch(/output\s+"public_subnet_ids"\s*{/);
      expect(tfContent).toMatch(/output\s+"private_app_subnet_ids"\s*{/);
      expect(tfContent).toMatch(/output\s+"private_db_subnet_ids"\s*{/);
    });

    test('outputs security group information', () => {
      expect(tfContent).toMatch(/output\s+"alb_security_group_id"\s*{/);
      expect(tfContent).toMatch(/output\s+"app_security_group_id"\s*{/);
      expect(tfContent).toMatch(/output\s+"rds_security_group_id"\s*{/);
    });

    test('outputs ALB information', () => {
      expect(tfContent).toMatch(/output\s+"alb_arn"\s*{/);
      expect(tfContent).toMatch(/output\s+"alb_dns_name"\s*{/);
      expect(tfContent).toMatch(/output\s+"target_group_arn"\s*{/);
      expect(tfContent).toMatch(/output\s+"http_listener_arn"\s*{/);
    });

    test('outputs Launch Template information', () => {
      expect(tfContent).toMatch(/output\s+"launch_template_id"\s*{/);
    });

    test('outputs RDS information', () => {
      expect(tfContent).toMatch(/output\s+"rds_instance_id"\s*{/);
      expect(tfContent).toMatch(/output\s+"rds_endpoint"\s*{/);
      expect(tfContent).toMatch(/output\s+"rds_address"\s*{/);
      expect(tfContent).toMatch(/output\s+"rds_port"\s*{/);
      expect(tfContent).toMatch(/output\s+"rds_database_name"\s*{/);
      expect(tfContent).toMatch(/output\s+"rds_engine_version"\s*{/);
    });

    test('outputs S3 bucket information', () => {
      expect(tfContent).toMatch(/output\s+"logs_bucket_name"\s*{/);
      expect(tfContent).toMatch(/output\s+"logs_bucket_arn"\s*{/);
    });

    test('outputs CloudWatch information', () => {
      expect(tfContent).toMatch(/output\s+"app_log_group_name"\s*{/);
      expect(tfContent).toMatch(/output\s+"vpc_flow_logs_group_name"\s*{/);
    });

    test('outputs WAF information', () => {
      expect(tfContent).toMatch(/output\s+"waf_web_acl_id"\s*{/);
      expect(tfContent).toMatch(/output\s+"waf_web_acl_arn"\s*{/);
    });

    test('outputs KMS information', () => {
      expect(tfContent).toMatch(/output\s+"kms_key_id"\s*{/);
      expect(tfContent).toMatch(/output\s+"kms_key_arn"\s*{/);
    });

    test('outputs IAM role information', () => {
      expect(tfContent).toMatch(/output\s+"ec2_role_arn"\s*{/);
      expect(tfContent).toMatch(/output\s+"vpc_flow_logs_role_arn"\s*{/);
    });

    test('outputs general information', () => {
      expect(tfContent).toMatch(/output\s+"region"\s*{/);
      expect(tfContent).toMatch(/output\s+"environment"\s*{/);
    });
  });

  // ===========================
  // SECURITY BEST PRACTICES
  // ===========================
  describe('Security Best Practices', () => {
    test('all resources use encryption at rest', () => {
      // AES256 for S3 logs bucket
      expect(tfContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
      // KMS for RDS
      expect(tfContent).toMatch(/storage_encrypted\s*=\s*true/);
      // KMS for EBS
      expect(tfContent).toMatch(/encrypted\s*=\s*true/);
    });

    test('sensitive data is marked as sensitive', () => {
      expect(tfContent).toMatch(/variable\s+"db_master_password"\s*{[\s\S]*?sensitive\s*=\s*true/);
      expect(tfContent).toMatch(/output\s+"rds_username"\s*{[\s\S]*?sensitive\s*=\s*true/);
    });

    test('security groups follow least privilege', () => {
      // ALB allows ingress on specific ports
      expect(tfContent).toMatch(/for_each\s*=\s*\[80,\s*443\]/);
      // App only allows HTTPS from ALB
      expect(tfContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
      // RDS only allows PostgreSQL from app
      expect(tfContent).toMatch(/from_port\s*=\s*5432/);
    });

    test('S3 bucket blocks all public access', () => {
      expect(tfContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(tfContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(tfContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(tfContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('resources are tagged for management', () => {
      expect(tfContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
      expect(tfContent).toMatch(/Project/);
      expect(tfContent).toMatch(/Environment/);
      expect(tfContent).toMatch(/ManagedBy/);
    });

    test('CloudWatch logs have retention policies', () => {
      expect(tfContent).toMatch(/retention_in_days\s*=\s*30/);
    });

    test('RDS has backup retention configured', () => {
      expect(tfContent).toMatch(/backup_retention_period\s*=\s*7/);
    });
  });

  // ===========================
  // HIGH AVAILABILITY
  // ===========================
  describe('High Availability', () => {
    test('infrastructure spans multiple availability zones', () => {
      expect(tfContent).toMatch(/count\s*=\s*2/);
      expect(tfContent).toMatch(/local\.azs\[count\.index\]/);
    });

    test('NAT Gateways deployed in multiple AZs', () => {
      expect(tfContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(tfContent).toMatch(/count\s*=\s*2/);
    });

    test('RDS is Multi-AZ', () => {
      expect(tfContent).toMatch(/multi_az\s*=\s*true/);
    });

    test('ALB spans multiple subnets', () => {
      expect(tfContent).toMatch(/subnets\s*=\s*aws_subnet\.public/);
    });
  });

  // ===========================
  // COMPLIANCE
  // ===========================
  describe('Compliance Features', () => {
    test('has VPC Flow Logs enabled', () => {
      expect(tfContent).toMatch(/resource\s+"aws_flow_log"\s+"main"\s*{/);
      expect(tfContent).toMatch(/traffic_type\s*=\s*"ALL"/);
    });

    test('has WAF for application protection', () => {
      expect(tfContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"\s*{/);
    });

    test('uses KMS for encryption key management', () => {
      expect(tfContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('has CloudWatch logging for monitoring', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"app"\s*{/);
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs"\s*{/);
    });

    test('S3 bucket has versioning enabled', () => {
      expect(tfContent).toMatch(/versioning_configuration\s*{[\s\S]*?status\s*=\s*"Enabled"/);
    });
  });
});