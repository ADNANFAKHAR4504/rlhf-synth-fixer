// test/terraform.unit.test.ts

import * as fs from 'fs';
import * as path from 'path';
import { expect, describe, it } from '@jest/globals';

const LIB_DIR = path.resolve(__dirname, '../lib');
const MAIN_TF = path.join(LIB_DIR, 'main.tf');

const file = () => fs.readFileSync(MAIN_TF, 'utf8');
const has = (re: RegExp) => re.test(file());

describe('Terraform Infrastructure Tests', () => {

  describe('File Structure and Basic Setup', () => {
    it('main.tf exists and has content', () => {
      expect(fs.existsSync(MAIN_TF)).toBe(true);
      expect(file().length).toBeGreaterThan(1000);
    });

    it('does not contain hardcoded AWS credentials', () => {
      expect(has(/aws_access_key_id\s*=/)).toBe(false);
      expect(has(/aws_secret_access_key\s*=/)).toBe(false);
      expect(has(/access_key\s*=/)).toBe(false);
      expect(has(/secret_key\s*=/)).toBe(false);
    });
  });

  describe('Variables Configuration', () => {
    it('defines aws_region variable with default value', () => {
      expect(has(/variable\s+"aws_region"[\s\S]*?default\s*=\s*"us-west-2"/)).toBe(true);
      expect(has(/variable\s+"aws_region"[\s\S]*?type\s*=\s*string/)).toBe(true);
    });

    it('defines environment variable with default production', () => {
      expect(has(/variable\s+"environment"[\s\S]*?default\s*=\s*"production"/)).toBe(true);
    });

    it('defines project_name variable with default webapp', () => {
      expect(has(/variable\s+"project_name"[\s\S]*?default\s*=\s*"webapp"/)).toBe(true);
    });

    it('defines vpc_cidr variable with default 10.0.0.0/16', () => {
      expect(has(/variable\s+"vpc_cidr"[\s\S]*?default\s*=\s*"10\.0\.0\.0\/16"/)).toBe(true);
    });

    it('defines db_username variable with sensitive flag', () => {
      expect(has(/variable\s+"db_username"[\s\S]*?default\s*=\s*"admin"/)).toBe(true);
      expect(has(/variable\s+"db_username"[\s\S]*?sensitive\s*=\s*true/)).toBe(true);
    });

    it('defines db_password variable as sensitive', () => {
      expect(has(/variable\s+"db_password"[\s\S]*?sensitive\s*=\s*true/)).toBe(true);
    });

    it('defines instance_type with t3.medium default', () => {
      expect(has(/variable\s+"instance_type"[\s\S]*?default\s*=\s*"t3\.medium"/)).toBe(true);
    });

    it('defines auto scaling size variables', () => {
      expect(has(/variable\s+"min_size"[\s\S]*?default\s*=\s*2/)).toBe(true);
      expect(has(/variable\s+"max_size"[\s\S]*?default\s*=\s*6/)).toBe(true);
      expect(has(/variable\s+"desired_capacity"[\s\S]*?default\s*=\s*4/)).toBe(true);
    });
  });

  describe('Data Sources', () => {
    it('configures aws_availability_zones data source', () => {
      expect(has(/data\s+"aws_availability_zones"\s+"available"[\s\S]*?state\s*=\s*"available"/)).toBe(true);
    });

    it('configures aws_ami data source for Amazon Linux 2', () => {
      expect(has(/data\s+"aws_ami"\s+"amazon_linux_2"[\s\S]*?most_recent\s*=\s*true/)).toBe(true);
    });

    it('configures aws_caller_identity data source', () => {
      expect(has(/data\s+"aws_caller_identity"\s+"current"\s*{}/)).toBe(true);
    });

    it('configures aws_elb_service_account data source', () => {
      expect(has(/data\s+"aws_elb_service_account"\s+"main"\s*{}/)).toBe(true);
    });
  });

  describe('Local Variables', () => {
    it('defines common_tags with required fields', () => {
      expect(has(/locals\s*{[\s\S]*?common_tags\s*=\s*{[\s\S]*?Environment\s*=\s*var\.environment/)).toBe(true);
      expect(has(/ManagedBy\s*=\s*"Terraform"/)).toBe(true);
      expect(has(/Project\s*=\s*var\.project_name/)).toBe(true);
    });

  });

  describe('VPC and Networking', () => {
    it('creates VPC with DNS support enabled', () => {
      expect(has(/resource\s+"aws_vpc"\s+"main"[\s\S]*?cidr_block\s*=\s*var\.vpc_cidr/)).toBe(true);
      expect(has(/enable_dns_hostnames\s*=\s*true/)).toBe(true);
      expect(has(/enable_dns_support\s*=\s*true/)).toBe(true);
    });

    it('creates Internet Gateway attached to VPC', () => {
      expect(has(/resource\s+"aws_internet_gateway"\s+"main"[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\.id/)).toBe(true);
    });

    it('creates public subnets with auto-assign public IP', () => {
      expect(has(/map_public_ip_on_launch\s*=\s*true/)).toBe(true);
    });

    it('creates private subnets', () => {
      expect(has(/resource\s+"aws_subnet"\s+"private"[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\.id/)).toBe(true);
 
    });

    it('creates database subnets', () => {
      expect(has(/resource\s+"aws_subnet"\s+"database"[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\.id/)).toBe(true);
    });

    it('creates Elastic IPs for NAT Gateways', () => {
      expect(has(/resource\s+"aws_eip"\s+"nat"[\s\S]*?domain\s*=\s*"vpc"/)).toBe(true);
    });

    it('creates public route table with internet gateway route', () => {
      expect(has(/resource\s+"aws_route_table"\s+"public"[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\.id/)).toBe(true);
      expect(has(/route[\s\S]*?cidr_block\s*=\s*"0\.0\.0\.0\/0"[\s\S]*?gateway_id\s*=\s*aws_internet_gateway\.main\.id/)).toBe(true);
    });

    it('creates route table associations for all subnet types', () => {
      expect(has(/resource\s+"aws_route_table_association"\s+"public"/)).toBe(true);
      expect(has(/resource\s+"aws_route_table_association"\s+"private"/)).toBe(true);
      expect(has(/resource\s+"aws_route_table_association"\s+"database"/)).toBe(true);
    });
  });

  describe('Security Groups', () => {
    it('creates ALB security group with HTTP and HTTPS ingress', () => {
      expect(has(/resource\s+"aws_security_group"\s+"alb"[\s\S]*?name\s*=\s*"\$\{local\.name_prefix\}-alb-sg"/)).toBe(true);
      expect(has(/ingress[\s\S]*?from_port\s*=\s*80[\s\S]*?to_port\s*=\s*80/)).toBe(true);
      expect(has(/ingress[\s\S]*?from_port\s*=\s*443[\s\S]*?to_port\s*=\s*443/)).toBe(true);
    });

    it('creates web server security group with ALB access', () => {
      expect(has(/resource\s+"aws_security_group"\s+"web"[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\.id/)).toBe(true);
    });

    it('creates RDS security group with MySQL port', () => {
      expect(has(/resource\s+"aws_security_group"\s+"rds"[\s\S]*?name\s*=\s*"\$\{local\.name_prefix\}-rds-sg"/)).toBe(true);
      expect(has(/ingress[\s\S]*?from_port\s*=\s*3306[\s\S]*?to_port\s*=\s*3306/)).toBe(true);
    });
  });

  describe('S3 Bucket for ALB Logs', () => {
    it('creates S3 bucket for ALB access logs', () => {
      expect(has(/resource\s+"aws_s3_bucket"\s+"alb_logs"[\s\S]*?bucket\s*=\s*"\$\{local\.name_prefix\}-alb-logs-/)).toBe(true);
    });

    it('enables versioning for ALB logs bucket', () => {
      expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"alb_logs"[\s\S]*?status\s*=\s*"Enabled"/)).toBe(true);
    });

    it('enables encryption for ALB logs bucket', () => {
      expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"alb_logs"[\s\S]*?sse_algorithm\s*=\s*"AES256"/)).toBe(true);
    });

    it('blocks public access for ALB logs bucket', () => {
      expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"alb_logs"[\s\S]*?block_public_acls\s*=\s*true/)).toBe(true);
      expect(has(/block_public_policy\s*=\s*true/)).toBe(true);
      expect(has(/ignore_public_acls\s*=\s*true/)).toBe(true);
      expect(has(/restrict_public_buckets\s*=\s*true/)).toBe(true);
    });

    it('creates bucket policy for ALB logs', () => {
      expect(has(/resource\s+"aws_s3_bucket_policy"\s+"alb_logs"/)).toBe(true);
      expect(has(/Principal[\s\S]*?AWS\s*=\s*data\.aws_elb_service_account\.main\.arn/)).toBe(true);
    });

    it('configures lifecycle rules for ALB logs', () => {
      expect(has(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"alb_logs"/)).toBe(true);
      expect(has(/storage_class\s*=\s*"STANDARD_IA"/)).toBe(true);
      expect(has(/storage_class\s*=\s*"GLACIER"/)).toBe(true);
      expect(has(/expiration[\s\S]*?days\s*=\s*365/)).toBe(true);
    });
  });

  describe('Application Load Balancer', () => {
    it('creates ALB with correct configuration', () => {
      expect(has(/resource\s+"aws_lb"\s+"main"[\s\S]*?name\s*=\s*"\$\{local\.name_prefix\}-alb-ts"/)).toBe(true);
      expect(has(/internal\s*=\s*false/)).toBe(true);
      expect(has(/load_balancer_type\s*=\s*"application"/)).toBe(true);
    });

    it('enables ALB features', () => {
      expect(has(/enable_deletion_protection\s*=\s*false/)).toBe(true);
      expect(has(/enable_http2\s*=\s*true/)).toBe(true);
      expect(has(/enable_cross_zone_load_balancing\s*=\s*true/)).toBe(true);
    });

    it('configures ALB access logs', () => {
      expect(has(/access_logs[\s\S]*?bucket\s*=\s*aws_s3_bucket\.alb_logs\.id/)).toBe(true);
      expect(has(/access_logs[\s\S]*?prefix\s*=\s*"alb"/)).toBe(true);
      expect(has(/access_logs[\s\S]*?enabled\s*=\s*true/)).toBe(true);
    });

    it('creates target group with health checks', () => {
      expect(has(/resource\s+"aws_lb_target_group"\s+"web"[\s\S]*?port\s*=\s*80/)).toBe(true);
      expect(has(/protocol\s*=\s*"HTTP"/)).toBe(true);
      expect(has(/target_type\s*=\s*"instance"/)).toBe(true);
      expect(has(/health_check[\s\S]*?path\s*=\s*"\/"/)).toBe(true);
      expect(has(/health_check[\s\S]*?healthy_threshold\s*=\s*2/)).toBe(true);
    });

    it('configures target group stickiness', () => {
      expect(has(/stickiness[\s\S]*?type\s*=\s*"lb_cookie"/)).toBe(true);
      expect(has(/stickiness[\s\S]*?cookie_duration\s*=\s*86400/)).toBe(true);
      expect(has(/stickiness[\s\S]*?enabled\s*=\s*true/)).toBe(true);
    });

    it('creates ALB listener for HTTP', () => {
      expect(has(/resource\s+"aws_lb_listener"\s+"web_http"[\s\S]*?port\s*=\s*"80"/)).toBe(true);
      expect(has(/protocol\s*=\s*"HTTP"/)).toBe(true);
      expect(has(/default_action[\s\S]*?type\s*=\s*"forward"/)).toBe(true);
    });
  });

  describe('Launch Template and Auto Scaling', () => {
    it('creates launch template with correct AMI', () => {
      expect(has(/resource\s+"aws_launch_template"\s+"web"[\s\S]*?image_id\s*=\s*data\.aws_ami\.amazon_linux_2\.id/)).toBe(true);
      expect(has(/instance_type\s*=\s*var\.instance_type/)).toBe(true);
    });

    it('configures launch template with IAM instance profile', () => {
      expect(has(/iam_instance_profile[\s\S]*?name\s*=\s*aws_iam_instance_profile\.web\.name/)).toBe(true);
    });

    it('configures encrypted EBS volume in launch template', () => {
      expect(has(/block_device_mappings[\s\S]*?volume_size\s*=\s*20/)).toBe(true);
      expect(has(/volume_type\s*=\s*"gp3"/)).toBe(true);
      expect(has(/encrypted\s*=\s*true/)).toBe(true);
    });

    it('enables IMDSv2 in launch template', () => {
      expect(has(/metadata_options[\s\S]*?http_endpoint\s*=\s*"enabled"/)).toBe(true);
      expect(has(/metadata_options[\s\S]*?http_tokens\s*=\s*"required"/)).toBe(true);
    });

    it('includes user data script in launch template', () => {
      expect(has(/user_data\s*=\s*base64encode/)).toBe(true);
      expect(has(/yum install -y httpd/)).toBe(true);
    });

    it('creates auto scaling group with correct configuration', () => {
      expect(has(/resource\s+"aws_autoscaling_group"\s+"web"[\s\S]*?min_size\s*=\s*var\.min_size/)).toBe(true);
      expect(has(/max_size\s*=\s*var\.max_size/)).toBe(true);
      expect(has(/desired_capacity\s*=\s*var\.desired_capacity/)).toBe(true);
    });

    it('configures ASG with health checks', () => {
      expect(has(/health_check_type\s*=\s*"ELB"/)).toBe(true);
      expect(has(/health_check_grace_period\s*=\s*300/)).toBe(true);
    });

    it('creates scaling policies', () => {
      expect(has(/resource\s+"aws_autoscaling_policy"\s+"scale_up"[\s\S]*?scaling_adjustment\s*=\s*2/)).toBe(true);
      expect(has(/resource\s+"aws_autoscaling_policy"\s+"scale_down"[\s\S]*?scaling_adjustment\s*=\s*-1/)).toBe(true);
    });

    it('creates CloudWatch alarms for auto scaling', () => {
      expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_high"[\s\S]*?threshold\s*=\s*70/)).toBe(true);
      expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_low"[\s\S]*?threshold\s*=\s*20/)).toBe(true);
    });
  });

  describe('IAM Resources', () => {
    it('creates IAM role for EC2 instances', () => {
      expect(has(/resource\s+"aws_iam_role"\s+"web"[\s\S]*?name\s*=\s*"\$\{local\.name_prefix\}-web-role-ts-123"/)).toBe(true);
      expect(has(/assume_role_policy[\s\S]*?Service\s*=\s*"ec2\.amazonaws\.com"/)).toBe(true);
    });

    it('attaches SSM policy to IAM role', () => {
      expect(has(/resource\s+"aws_iam_role_policy_attachment"\s+"web_ssm"[\s\S]*?policy_arn\s*=\s*"arn:aws:iam::aws:policy\/AmazonSSMManagedInstanceCore"/)).toBe(true);
    });

    it('attaches CloudWatch policy to IAM role', () => {
      expect(has(/resource\s+"aws_iam_role_policy_attachment"\s+"web_cloudwatch"[\s\S]*?policy_arn\s*=\s*"arn:aws:iam::aws:policy\/CloudWatchAgentServerPolicy"/)).toBe(true);
    });

    it('creates IAM instance profile', () => {
      expect(has(/resource\s+"aws_iam_instance_profile"\s+"web"[\s\S]*?role\s*=\s*aws_iam_role\.web\.name/)).toBe(true);
    });
  });

  describe('RDS Database', () => {
    it('creates DB parameter group with MySQL settings', () => {
      expect(has(/resource\s+"aws_db_parameter_group"\s+"mysql"[\s\S]*?family\s*=\s*"mysql8\.0"/)).toBe(true);
      expect(has(/parameter[\s\S]*?name\s*=\s*"character_set_server"[\s\S]*?value\s*=\s*"utf8mb4"/)).toBe(true);
      expect(has(/parameter[\s\S]*?name\s*=\s*"slow_query_log"[\s\S]*?value\s*=\s*"1"/)).toBe(true);
    });

    it('creates RDS MySQL instance with correct configuration', () => {
      expect(has(/resource\s+"aws_db_instance"\s+"main"[\s\S]*?engine\s*=\s*"mysql"/)).toBe(true);
      expect(has(/instance_class\s*=\s*"db\.t3\.medium"/)).toBe(true);
      expect(has(/allocated_storage\s*=\s*100/)).toBe(true);
    });

    it('configures RDS storage with encryption', () => {
      expect(has(/storage_type\s*=\s*"gp3"/)).toBe(true);
      expect(has(/storage_encrypted\s*=\s*true/)).toBe(true);
      expect(has(/max_allocated_storage\s*=\s*500/)).toBe(true);
    });

    it('sets RDS database credentials', () => {
      expect(has(/db_name\s*=\s*"webapp"/)).toBe(true);
      expect(has(/username\s*=\s*var\.db_username/)).toBe(true);
    });

    it('configures RDS backup settings', () => {
      expect(has(/backup_retention_period\s*=\s*30/)).toBe(true);
      expect(has(/backup_window\s*=\s*"03:00-04:00"/)).toBe(true);
      expect(has(/maintenance_window\s*=\s*"sun:04:00-sun:05:00"/)).toBe(true);
    });

    it('enables Multi-AZ for high availability', () => {
      expect(has(/multi_az\s*=\s*true/)).toBe(true);
    });

    it('configures final snapshot settings', () => {
      expect(has(/skip_final_snapshot\s*=\s*false/)).toBe(true);
      expect(has(/final_snapshot_identifier\s*=\s*"\$\{local\.name_prefix\}-mysql-master-final-snapshot-/)).toBe(true);
    });

    it('enables performance insights', () => {
      expect(has(/performance_insights_enabled\s*=\s*true/)).toBe(true);
      expect(has(/performance_insights_retention_period\s*=\s*7/)).toBe(true);
    });

    it('creates RDS read replica', () => {
      expect(has(/resource\s+"aws_db_instance"\s+"read_replica"[\s\S]*?replicate_source_db\s*=\s*aws_db_instance\.main\.identifier/)).toBe(true);
      expect(has(/resource\s+"aws_db_instance"\s+"read_replica"[\s\S]*?count\s*=\s*1/)).toBe(true);
    });
  });

  describe('CloudWatch Log Groups', () => {
     it('creates RDS general log group', () => {
      expect(has(/resource\s+"aws_cloudwatch_log_group"\s+"rds_general"[\s\S]*?name\s*=\s*"\/aws\/rds\/instance\/\$\{aws_db_instance\.main\.identifier\}\/generalts"/)).toBe(true);
    });

    it('creates RDS slow query log group', () => {
      expect(has(/resource\s+"aws_cloudwatch_log_group"\s+"rds_slowquery"[\s\S]*?name\s*=\s*"\/aws\/rds\/instance\/\$\{aws_db_instance\.main\.identifier\}\/slowqueryts"/)).toBe(true);
    });
  });

  describe('Outputs', () => {
    it('outputs ALB DNS name and zone ID', () => {
      expect(has(/output\s+"alb_dns_name"[\s\S]*?value\s*=\s*aws_lb\.main\.dns_name/)).toBe(true);
      expect(has(/output\s+"alb_zone_id"[\s\S]*?value\s*=\s*aws_lb\.main\.zone_id/)).toBe(true);
    });

    it('outputs RDS endpoints as sensitive', () => {
      expect(has(/output\s+"rds_endpoint"[\s\S]*?value\s*=\s*aws_db_instance\.main\.endpoint/)).toBe(true);
      expect(has(/output\s+"rds_endpoint"[\s\S]*?sensitive\s*=\s*true/)).toBe(true);
    });

    it('outputs RDS read replica endpoints', () => {
      expect(has(/output\s+"rds_read_replica_endpoints"[\s\S]*?sensitive\s*=\s*true/)).toBe(true);
    });

    it('outputs VPC and subnet IDs', () => {
      expect(has(/output\s+"vpc_id"[\s\S]*?value\s*=\s*aws_vpc\.main\.id/)).toBe(true);
    });

    it('outputs auto scaling group name', () => {
      expect(has(/output\s+"autoscaling_group_name"[\s\S]*?value\s*=\s*aws_autoscaling_group\.web\.name/)).toBe(true);
    });

    it('outputs S3 logs bucket name', () => {
      expect(has(/output\s+"s3_logs_bucket"[\s\S]*?value\s*=\s*aws_s3_bucket\.alb_logs\.id/)).toBe(true);
    });

    it('outputs security group IDs', () => {
      expect(has(/output\s+"security_group_alb_id"[\s\S]*?value\s*=\s*aws_security_group\.alb\.id/)).toBe(true);
      expect(has(/output\s+"security_group_web_id"[\s\S]*?value\s*=\s*aws_security_group\.web\.id/)).toBe(true);
      expect(has(/output\s+"security_group_rds_id"[\s\S]*?value\s*=\s*aws_security_group\.rds\.id/)).toBe(true);
    });

    it('includes descriptions for outputs', () => {
      expect(has(/output\s+"alb_dns_name"[\s\S]*?description\s*=\s*"DNS name of the Application Load Balancer"/)).toBe(true);
      expect(has(/output\s+"vpc_id"[\s\S]*?description\s*=\s*"ID of the VPC"/)).toBe(true);
    });
  });

  describe('Resource Tagging', () => {
    it('tags VPC with common tags', () => {
      expect(has(/Name\s*=\s*"\$\{local\.name_prefix\}-vpc"/)).toBe(true);
    });

    it('tags subnets with type information', () => {
      expect(has(/resource\s+"aws_subnet"\s+"public"[\s\S]*?Type\s*=\s*"Public"/)).toBe(true);
      expect(has(/resource\s+"aws_subnet"\s+"private"[\s\S]*?Type\s*=\s*"Private"/)).toBe(true);
      expect(has(/resource\s+"aws_subnet"\s+"database"[\s\S]*?Type\s*=\s*"Database"/)).toBe(true);
    });

  });

  describe('Security Best Practices', () => {
    it('uses encrypted storage for all resources', () => {
      expect(has(/encrypted\s*=\s*true/)).toBe(true);
      expect(has(/storage_encrypted\s*=\s*true/)).toBe(true);
    });

    it('enables S3 bucket versioning for ALB logs', () => {
      expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"alb_logs"[\s\S]*?status\s*=\s*"Enabled"/)).toBe(true);
    });

    it('blocks all public access to S3 buckets', () => {
      expect(has(/block_public_acls\s*=\s*true/)).toBe(true);
      expect(has(/block_public_policy\s*=\s*true/)).toBe(true);
      expect(has(/ignore_public_acls\s*=\s*true/)).toBe(true);
      expect(has(/restrict_public_buckets\s*=\s*true/)).toBe(true);
    });

    it('uses IMDSv2 for EC2 metadata service', () => {
      expect(has(/http_tokens\s*=\s*"required"/)).toBe(true);
    });

    it('marks database credentials as sensitive', () => {
      expect(has(/variable\s+"db_password"[\s\S]*?sensitive\s*=\s*true/)).toBe(true);
      expect(has(/variable\s+"db_username"[\s\S]*?sensitive\s*=\s*true/)).toBe(true);
    });

    it('ensures RDS is not publicly accessible', () => {
      expect(has(/publicly_accessible\s*=\s*false/)).toBe(true);
    });
  });

  describe('High Availability and Resilience', () => {
    it('enables RDS Multi-AZ deployment', () => {
      expect(has(/multi_az\s*=\s*true/)).toBe(true);
    });

    it('configures auto scaling with proper thresholds', () => {
      expect(has(/min_size\s*=\s*var\.min_size/)).toBe(true);
      expect(has(/max_size\s*=\s*var\.max_size/)).toBe(true);
    });

    it('enables cross-zone load balancing', () => {
      expect(has(/enable_cross_zone_load_balancing\s*=\s*true/)).toBe(true);
    });
  });

  describe('Monitoring and Logging', () => {
    it('enables detailed monitoring for instances', () => {
      expect(has(/monitoring[\s\S]*?enabled\s*=\s*true/)).toBe(true);
    });

    it('configures CloudWatch log groups with retention', () => {
      expect(has(/retention_in_days\s*=\s*7/)).toBe(true);
    });

    it('enables RDS performance insights', () => {
      expect(has(/performance_insights_enabled\s*=\s*true/)).toBe(true);
    });

    it('enables ALB access logs', () => {
      expect(has(/access_logs[\s\S]*?enabled\s*=\s*true/)).toBe(true);
    });
  });

  describe('Compliance and Governance', () => {
    it('tags resources with cost center information', () => {
      expect(has(/CostCenter\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment\}"/)).toBe(true);
    });

    it('enables auto minor version upgrade for RDS', () => {
      expect(has(/auto_minor_version_upgrade\s*=\s*true/)).toBe(true);
    });
  });
});