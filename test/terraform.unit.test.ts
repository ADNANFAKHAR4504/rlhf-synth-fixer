// test/terraform.unit.test.ts

import * as fs from 'fs';
import * as path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');
const MAIN_TF = path.join(LIB_DIR, 'main.tf');

const file = () => fs.readFileSync(MAIN_TF, 'utf8');
const has = (re: RegExp) => re.test(file());

describe('Terraform Infrastructure Tests', () => {
  
  describe('File Structure and Basic Setup', () => {
    it('main.tf exists and has substantial content', () => {
      expect(fs.existsSync(MAIN_TF)).toBe(true);
      expect(file().length).toBeGreaterThan(5000);
    });

    it('does not contain hardcoded AWS credentials', () => {
      expect(has(/aws_access_key_id\s*=/)).toBe(false);
      expect(has(/aws_secret_access_key\s*=/)).toBe(false);
      expect(has(/access_key\s*=/)).toBe(false);
      expect(has(/secret_key\s*=/)).toBe(false);
    });
  });

  describe('Variables Configuration', () => {
    it('declares required variables with proper types', () => {
      expect(has(/variable\s+"aws_region"[\s\S]*?type\s*=\s*string/)).toBe(true);
      expect(has(/variable\s+"project_name"[\s\S]*?type\s*=\s*string/)).toBe(true);
      expect(has(/variable\s+"environment"[\s\S]*?type\s*=\s*string/)).toBe(true);
    });

    it('sets default values for critical variables', () => {
      expect(has(/variable\s+"aws_region"[\s\S]*?default\s*=\s*"us-west-2"/)).toBe(true);
      expect(has(/variable\s+"project_name"[\s\S]*?default\s*=\s*"prod-infra2"/)).toBe(true);
      expect(has(/variable\s+"environment"[\s\S]*?default\s*=\s*"Production"/)).toBe(true);
    });
  });

  describe('Data Sources', () => {
    it('configures aws_availability_zones data source', () => {
      expect(has(/data\s+"aws_availability_zones"\s+"available"[\s\S]*?state\s*=\s*"available"/)).toBe(true);
    });

    it('configures aws_caller_identity data source', () => {
      expect(has(/data\s+"aws_caller_identity"\s+"current"/)).toBe(true);
    });
  });

  describe('Networking Resources', () => {
    it('creates VPC with DNS support enabled', () => {
      expect(has(/resource\s+"aws_vpc"\s+"main"[\s\S]*?cidr_block\s*=\s*"10\.0\.0\.0\/16"/)).toBe(true);
      expect(has(/enable_dns_hostnames\s*=\s*true/)).toBe(true);
      expect(has(/enable_dns_support\s*=\s*true/)).toBe(true);
    });

    it('creates Internet Gateway attached to VPC', () => {
      expect(has(/resource\s+"aws_internet_gateway"\s+"main"[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\.id/)).toBe(true);
    });

    it('creates public subnets with proper configuration', () => {
      expect(has(/resource\s+"aws_subnet"\s+"public"[\s\S]*?count\s*=\s*2/)).toBe(true);
      expect(has(/resource\s+"aws_subnet"\s+"public"[\s\S]*?map_public_ip_on_launch\s*=\s*true/)).toBe(true);
      expect(has(/resource\s+"aws_subnet"\s+"public"[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\.id/)).toBe(true);
    });

    it('creates private subnets', () => {
      expect(has(/resource\s+"aws_subnet"\s+"private"[\s\S]*?count\s*=\s*2/)).toBe(true);
      expect(has(/resource\s+"aws_subnet"\s+"private"[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\.id/)).toBe(true);
    });

    it('creates database subnets separately', () => {
      expect(has(/resource\s+"aws_subnet"\s+"database"[\s\S]*?count\s*=\s*2/)).toBe(true);
      expect(has(/resource\s+"aws_subnet"\s+"database"[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\.id/)).toBe(true);
    });

    it('creates Elastic IPs for NAT Gateway', () => {
      expect(has(/resource\s+"aws_eip"\s+"nat"[\s\S]*?count\s*=\s*2/)).toBe(true);
      expect(has(/resource\s+"aws_eip"\s+"nat"[\s\S]*?domain\s*=\s*"vpc"/)).toBe(true);
    });

    it('creates route tables for public subnets', () => {
      expect(has(/resource\s+"aws_route_table"\s+"public"/)).toBe(true);
      expect(has(/resource\s+"aws_route"\s+"public_internet"[\s\S]*?gateway_id\s*=\s*aws_internet_gateway\.main\.id/)).toBe(true);
    });

    it('creates route table associations', () => {
      expect(has(/resource\s+"aws_route_table_association"\s+"public"/)).toBe(true);
      expect(has(/resource\s+"aws_route_table_association"\s+"private"/)).toBe(true);
    });

    it('creates VPC Flow Logs', () => {
      expect(has(/resource\s+"aws_flow_log"\s+"main"[\s\S]*?traffic_type\s*=\s*"ALL"/)).toBe(true);
      expect(has(/resource\s+"aws_flow_log"\s+"main"[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\.id/)).toBe(true);
    });

    it('creates CloudWatch log group for flow logs', () => {
      expect(has(/resource\s+"aws_cloudwatch_log_group"\s+"flow_log"[\s\S]*?retention_in_days\s*=\s*7/)).toBe(true);
    });
  });

  describe('VPN Connection', () => {
    it('creates Customer Gateway', () => {
      expect(has(/resource\s+"aws_customer_gateway"\s+"main"[\s\S]*?bgp_asn\s*=\s*65000/)).toBe(true);
      expect(has(/resource\s+"aws_customer_gateway"\s+"main"[\s\S]*?type\s*=\s*"ipsec\.1"/)).toBe(true);
    });

    it('creates Virtual Private Gateway', () => {
      expect(has(/resource\s+"aws_vpn_gateway"\s+"main"[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\.id/)).toBe(true);
    });

    it('creates VPN Connection', () => {
      expect(has(/resource\s+"aws_vpn_connection"\s+"main"[\s\S]*?type\s*=\s*"ipsec\.1"/)).toBe(true);
      expect(has(/static_routes_only\s*=\s*true/)).toBe(true);
    });
  });

  describe('Security Groups', () => {
    it('creates ALB security group with HTTPS/HTTP ingress', () => {
      expect(has(/resource\s+"aws_security_group"\s+"alb"[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\.id/)).toBe(true);
      expect(has(/ingress[\s\S]*?from_port\s*=\s*443[\s\S]*?to_port\s*=\s*443[\s\S]*?protocol\s*=\s*"tcp"/)).toBe(true);
      expect(has(/ingress[\s\S]*?from_port\s*=\s*80[\s\S]*?to_port\s*=\s*80[\s\S]*?protocol\s*=\s*"tcp"/)).toBe(true);
    });

    it('configures egress rules for security groups', () => {
      expect(has(/egress[\s\S]*?from_port\s*=\s*0[\s\S]*?to_port\s*=\s*0[\s\S]*?protocol\s*=\s*"-1"/)).toBe(true);
    });
  });

  describe('IAM Roles and Policies', () => {
    it('creates IAM role for EC2 instances', () => {
      expect(has(/resource\s+"aws_iam_role"\s+"ec2"/)).toBe(true);
      expect(has(/assume_role_policy[\s\S]*?"sts:AssumeRole"/)).toBe(true);
      expect(has(/Service\s*=\s*"ec2\.amazonaws\.com"/)).toBe(true);
    });

    it('creates IAM instance profile for EC2', () => {
      expect(has(/resource\s+"aws_iam_instance_profile"\s+"ec2"[\s\S]*?role\s*=\s*aws_iam_role\.ec2\.name/)).toBe(true);
    });

    it('attaches SSM and CloudWatch policies to EC2 role', () => {
      expect(has(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_ssm"[\s\S]*?policy_arn\s*=\s*"arn:aws:iam::aws:policy\/AmazonSSMManagedInstanceCore"/)).toBe(true);
      expect(has(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_cloudwatch"[\s\S]*?policy_arn\s*=\s*"arn:aws:iam::aws:policy\/CloudWatchAgentServerPolicy"/)).toBe(true);
    });

    it('creates IAM role for Lambda backup function', () => {
      expect(has(/resource\s+"aws_iam_role"\s+"lambda_backup"/)).toBe(true);
      expect(has(/Service\s*=\s*"lambda\.amazonaws\.com"/)).toBe(true);
    });

    it('creates IAM policy for Lambda with RDS permissions', () => {
      expect(has(/resource\s+"aws_iam_role_policy"\s+"lambda_backup"[\s\S]*?"rds:CreateDBSnapshot"/)).toBe(true);
      expect(has(/"rds:DescribeDBInstances"/)).toBe(true);
      expect(has(/"rds:DeleteDBSnapshot"/)).toBe(true);
    });

    it('creates IAM role for VPC Flow Logs', () => {
      expect(has(/resource\s+"aws_iam_role"\s+"flow_log"/)).toBe(true);
      expect(has(/Service\s*=\s*"vpc-flow-logs\.amazonaws\.com"/)).toBe(true);
    });
  });

  describe('Compute Resources', () => {
    it('creates Target Group with health check', () => {
      expect(has(/resource\s+"aws_lb_target_group"\s+"main"[\s\S]*?port\s*=\s*80/)).toBe(true);
      expect(has(/protocol\s*=\s*"HTTP"/)).toBe(true);
      expect(has(/health_check[\s\S]*?path\s*=\s*"\/"/)).toBe(true);
      expect(has(/health_check[\s\S]*?healthy_threshold\s*=\s*2/)).toBe(true);
      expect(has(/health_check[\s\S]*?unhealthy_threshold\s*=\s*2/)).toBe(true);
    });

    it('creates ALB Listener', () => {
      expect(has(/resource\s+"aws_lb_listener"\s+"main"[\s\S]*?port\s*=\s*"80"/)).toBe(true);
      expect(has(/protocol\s*=\s*"HTTP"/)).toBe(true);
      expect(has(/default_action[\s\S]*?type\s*=\s*"forward"/)).toBe(true);
    });

    it('creates Launch Template with user data', () => {
      expect(has(/resource\s+"aws_launch_template"\s+"main"[\s\S]*?instance_type\s*=\s*"t3\.micro"/)).toBe(true);
      expect(has(/image_id\s*=\s*data\.aws_ami\.amazon_linux_2\.id/)).toBe(true);
      expect(has(/user_data\s*=\s*base64encode/)).toBe(true);
      expect(has(/iam_instance_profile[\s\S]*?arn\s*=\s*aws_iam_instance_profile\.ec2\.arn/)).toBe(true);
    });

    it('creates Auto Scaling policies', () => {
      expect(has(/resource\s+"aws_autoscaling_policy"\s+"scale_up"[\s\S]*?scaling_adjustment\s*=\s*1/)).toBe(true);
      expect(has(/resource\s+"aws_autoscaling_policy"\s+"scale_down"[\s\S]*?scaling_adjustment\s*=\s*-1/)).toBe(true);
      expect(has(/adjustment_type\s*=\s*"ChangeInCapacity"/)).toBe(true);
    });
  });

  describe('CloudWatch Monitoring', () => {
    it('creates CloudWatch metric alarms for CPU', () => {
      expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_high"[\s\S]*?metric_name\s*=\s*"CPUUtilization"/)).toBe(true);
      expect(has(/threshold\s*=\s*"70"/)).toBe(true);
      expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_low"[\s\S]*?threshold\s*=\s*"20"/)).toBe(true);
    });

    it('sets proper evaluation periods for alarms', () => {
      expect(has(/evaluation_periods\s*=\s*"2"/)).toBe(true);
      expect(has(/period\s*=\s*"300"/)).toBe(true);
      expect(has(/statistic\s*=\s*"Average"/)).toBe(true);
    });
  });

  describe('RDS Database', () => {
    it('creates RDS instance with MySQL engine', () => {
      expect(has(/resource\s+"aws_db_instance"\s+"main"[\s\S]*?engine\s*=\s*"mysql"/)).toBe(true);
      expect(has(/engine_version\s*=\s*"8\.0"/)).toBe(true);
      expect(has(/instance_class\s*=\s*"db\.t3\.micro"/)).toBe(true);
    });

    it('configures RDS with encryption and Multi-AZ', () => {
      expect(has(/storage_encrypted\s*=\s*true/)).toBe(true);
      expect(has(/multi_az\s*=\s*true/)).toBe(true);
      expect(has(/storage_type\s*=\s*"gp3"/)).toBe(true);
    });

    it('sets RDS backup configuration', () => {
      expect(has(/backup_retention_period\s*=\s*7/)).toBe(true);
      expect(has(/backup_window\s*=\s*"03:00-04:00"/)).toBe(true);
      expect(has(/maintenance_window\s*=\s*"sun:04:00-sun:05:00"/)).toBe(true);
    });

    it('sets security settings for RDS', () => {
      expect(has(/publicly_accessible\s*=\s*false/)).toBe(true);
      expect(has(/skip_final_snapshot\s*=\s*true/)).toBe(true);
      expect(has(/deletion_protection\s*=\s*false/)).toBe(true);
    });
  });

  describe('Lambda Function', () => {
    it('creates Lambda function for RDS backup', () => {
      expect(has(/resource\s+"aws_lambda_function"\s+"rds_backup"[\s\S]*?runtime\s*=\s*"python3\.9"/)).toBe(true);
      expect(has(/handler\s*=\s*"index\.handler"/)).toBe(true);
      expect(has(/timeout\s*=\s*60/)).toBe(true);
    });

    it('configures Lambda environment variables', () => {
      expect(has(/environment[\s\S]*?variables[\s\S]*?DB_INSTANCE_ID\s*=\s*aws_db_instance\.main\.id/)).toBe(true);
    });

    it('creates Lambda deployment package', () => {
      expect(has(/data\s+"archive_file"\s+"rds_backup_zip"[\s\S]*?type\s*=\s*"zip"/)).toBe(true);
      expect(has(/output_path\s*=\s*"\/tmp\/rds_backup_function\.zip"/)).toBe(true);
    });

    it('grants EventBridge permission to invoke Lambda', () => {
      expect(has(/resource\s+"aws_lambda_permission"\s+"allow_eventbridge"[\s\S]*?principal\s*=\s*"events\.amazonaws\.com"/)).toBe(true);
      expect(has(/action\s*=\s*"lambda:InvokeFunction"/)).toBe(true);
    });

    it('creates EventBridge target for Lambda', () => {
      expect(has(/resource\s+"aws_cloudwatch_event_target"\s+"lambda"[\s\S]*?target_id\s*=\s*"LambdaFunction"/)).toBe(true);
      expect(has(/arn\s*=\s*aws_lambda_function\.rds_backup\.arn/)).toBe(true);
    });
  });

  describe('Storage Resources', () => {
    it('creates main S3 bucket', () => {
      expect(has(/resource\s+"aws_s3_bucket"\s+"main"[\s\S]*?bucket\s*=\s*"\$\{var\.project_name\}-storage-\$\{data\.aws_caller_identity\.current\.account_id\}"/)).toBe(true);
    });

    it('enables S3 versioning', () => {
      expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"main"[\s\S]*?status\s*=\s*"Enabled"/)).toBe(true);
    });

    it('enables S3 encryption', () => {
      expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"main"[\s\S]*?sse_algorithm\s*=\s*"AES256"/)).toBe(true);
    });

    it('blocks public access to S3 buckets', () => {
      expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"main"[\s\S]*?block_public_acls\s*=\s*true/)).toBe(true);
      expect(has(/block_public_policy\s*=\s*true/)).toBe(true);
      expect(has(/ignore_public_acls\s*=\s*true/)).toBe(true);
      expect(has(/restrict_public_buckets\s*=\s*true/)).toBe(true);
    });

    it('creates S3 bucket for CloudTrail', () => {
      expect(has(/resource\s+"aws_s3_bucket"\s+"cloudtrail"[\s\S]*?bucket\s*=\s*"\$\{var\.project_name\}-cloudtrail-\$\{data\.aws_caller_identity\.current\.account_id\}"/)).toBe(true);
    });

    it('configures CloudTrail bucket with versioning and encryption', () => {
      expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"cloudtrail"[\s\S]*?status\s*=\s*"Enabled"/)).toBe(true);
      expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"cloudtrail"[\s\S]*?sse_algorithm\s*=\s*"AES256"/)).toBe(true);
    });

    it('creates S3 bucket policy for CloudTrail', () => {
      expect(has(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"[\s\S]*?Service\s*=\s*"cloudtrail\.amazonaws\.com"/)).toBe(true);
      expect(has(/Action\s*=\s*"s3:GetBucketAcl"/)).toBe(true);
      expect(has(/Action\s*=\s*"s3:PutObject"/)).toBe(true);
    });
  });

  describe('CloudFront Distribution', () => {
    it('creates CloudFront Origin Access Identity', () => {
      expect(has(/resource\s+"aws_cloudfront_origin_access_identity"\s+"main"/)).toBe(true);
    });

    it('creates CloudFront distribution', () => {
      expect(has(/resource\s+"aws_cloudfront_distribution"\s+"main"[\s\S]*?enabled\s*=\s*true/)).toBe(true);
      expect(has(/is_ipv6_enabled\s*=\s*true/)).toBe(true);
      expect(has(/default_root_object\s*=\s*"index\.html"/)).toBe(true);
    });

    it('configures S3 origin with OAI', () => {
      expect(has(/origin[\s\S]*?domain_name\s*=\s*aws_s3_bucket\.main\.bucket_regional_domain_name/)).toBe(true);
      expect(has(/s3_origin_config[\s\S]*?origin_access_identity\s*=\s*aws_cloudfront_origin_access_identity\.main\.cloudfront_access_identity_path/)).toBe(true);
    });

    it('configures CloudFront TTL settings', () => {
      expect(has(/min_ttl\s*=\s*0/)).toBe(true);
      expect(has(/default_ttl\s*=\s*3600/)).toBe(true);
      expect(has(/max_ttl\s*=\s*86400/)).toBe(true);
    });

    it('sets CloudFront price class', () => {
      expect(has(/price_class\s*=\s*"PriceClass_100"/)).toBe(true);
    });

    it('configures S3 bucket policy for CloudFront', () => {
      expect(has(/resource\s+"aws_s3_bucket_policy"\s+"cloudfront"[\s\S]*?Principal[\s\S]*?AWS\s*=\s*aws_cloudfront_origin_access_identity\.main\.iam_arn/)).toBe(true);
      expect(has(/Action\s*=\s*"s3:GetObject"/)).toBe(true);
    });
  });

  describe('CloudTrail', () => {
    it('creates CloudTrail', () => {
      expect(has(/resource\s+"aws_cloudtrail"\s+"main"[\s\S]*?s3_bucket_name\s*=\s*aws_s3_bucket\.cloudtrail\.id/)).toBe(true);
      expect(has(/include_global_service_events\s*=\s*true/)).toBe(true);
      expect(has(/is_multi_region_trail\s*=\s*true/)).toBe(true);
      expect(has(/enable_logging\s*=\s*true/)).toBe(true);
    });

    it('configures CloudTrail event selector', () => {
      expect(has(/event_selector[\s\S]*?read_write_type\s*=\s*"All"/)).toBe(true);
      expect(has(/include_management_events\s*=\s*true/)).toBe(true);
    });
  });

  describe('Outputs', () => {
    it('marks sensitive outputs correctly', () => {
      expect(has(/output\s+"rds_endpoint"[\s\S]*?sensitive\s*=\s*true/)).toBe(true);
    });

    it('provides proper output values', () => {
      expect(has(/output\s+"vpc_id"[\s\S]*?value\s*=\s*aws_vpc\.main\.id/)).toBe(true);
      expect(has(/output\s+"alb_dns_name"[\s\S]*?value\s*=\s*aws_lb\.main\.dns_name/)).toBe(true);
      expect(has(/output\s+"cloudfront_domain_name"[\s\S]*?value\s*=\s*aws_cloudfront_distribution\.main\.domain_name/)).toBe(true);
      expect(has(/output\s+"rds_endpoint"[\s\S]*?value\s*=\s*aws_db_instance\.main\.endpoint/)).toBe(true);
    });
  });

  describe('Resource Tagging', () => {
    it('uses common tags local variable', () => {
      expect(has(/locals[\s\S]*?common_tags\s*=\s*{[\s\S]*?Environment\s*=\s*var\.environment/)).toBe(true);
      expect(has(/Project\s*=\s*var\.project_name/)).toBe(true);
      expect(has(/ManagedBy\s*=\s*"Terraform"/)).toBe(true);
    });

    it('includes Name tag for resources', () => {
      expect(has(/Name\s*=\s*"\$\{var\.project_name\}-vpc"/)).toBe(true);
      expect(has(/Name\s*=\s*"\$\{var\.project_name\}-igw"/)).toBe(true);
    });
  });

  describe('Security Best Practices', () => {
    it('uses encrypted storage for RDS', () => {
      expect(has(/storage_encrypted\s*=\s*true/)).toBe(true);
    });

    it('blocks public access to S3 buckets', () => {
      expect(has(/block_public_acls\s*=\s*true/)).toBe(true);
      expect(has(/restrict_public_buckets\s*=\s*true/)).toBe(true);
    });

    it('enables S3 versioning for important buckets', () => {
      expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"main"[\s\S]*?status\s*=\s*"Enabled"/)).toBe(true);
      expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"cloudtrail"[\s\S]*?status\s*=\s*"Enabled"/)).toBe(true);
    });

    it('uses IAM roles instead of access keys', () => {
      expect(has(/resource\s+"aws_iam_role"/)).toBe(true);
      expect(has(/resource\s+"aws_iam_instance_profile"/)).toBe(true);
    });

    it('enables VPC Flow Logs for network monitoring', () => {
      expect(has(/resource\s+"aws_flow_log"\s+"main"/)).toBe(true);
    });

    it('enables CloudTrail for audit logging', () => {
      expect(has(/resource\s+"aws_cloudtrail"\s+"main"[\s\S]*?enable_logging\s*=\s*true/)).toBe(true);
    });
  });

  describe('High Availability Configuration', () => {
    it('enables Multi-AZ for RDS', () => {
      expect(has(/multi_az\s*=\s*true/)).toBe(true);
    });

    it('configures Auto Scaling Group with multiple instances', () => {
      expect(has(/min_size\s*=\s*2/)).toBe(true);
      expect(has(/desired_capacity\s*=\s*2/)).toBe(true);
    });

  });

  describe('Network Architecture', () => {
    it('creates separate database subnets', () => {
      expect(has(/resource\s+"aws_subnet"\s+"database"/)).toBe(true);
      expect(has(/Type\s*=\s*"Database"/)).toBe(true);
    });

  });

  describe('Monitoring and Observability', () => {
    it('configures CloudWatch log retention', () => {
      expect(has(/retention_in_days\s*=\s*7/)).toBe(true);
    });

    it('exports RDS logs to CloudWatch', () => {
      expect(has(/enabled_cloudwatch_logs_exports/)).toBe(true);
    });

    it('creates CloudWatch alarms for auto scaling', () => {
      expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_high"/)).toBe(true);
      expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_low"/)).toBe(true);
    });

    it('configures proper alarm thresholds', () => {
      expect(has(/comparison_operator\s*=\s*"GreaterThanThreshold"/)).toBe(true);
      expect(has(/comparison_operator\s*=\s*"LessThanThreshold"/)).toBe(true);
    });
  });
});