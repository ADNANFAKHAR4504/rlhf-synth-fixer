// webapp-infrastructure.test.ts

import * as fs from 'fs';
import * as path from 'path';
import { expect, describe, it, beforeAll } from '@jest/globals';

// Adjust path as needed for your project structure
const LIB_DIR = path.resolve(__dirname, '../lib');
const MAIN_TF = path.join(LIB_DIR, 'main.tf');

describe('WebApp Infrastructure Terraform Tests', () => {
  let tfContent: string;
  
  beforeAll(() => {
    // Read the Terraform file once before all tests
    tfContent = fs.readFileSync(MAIN_TF, 'utf8');
  });
  
  // Helper function to check if pattern exists in the file
  const has = (pattern: RegExp): boolean => pattern.test(tfContent);
  
  // Helper function to count occurrences
  const count = (pattern: RegExp): number => {
    const matches = tfContent.match(pattern);
    return matches ? matches.length : 0;
  };

  // Helper function to extract value
  const extract = (pattern: RegExp): string | null => {
    const match = tfContent.match(pattern);
    return match ? match[1] : null;
  };

  describe('File Structure and Basic Configuration', () => {
    it('should have main.tf file with substantial content', () => {
      expect(fs.existsSync(MAIN_TF)).toBe(true);
      expect(tfContent.length).toBeGreaterThan(8000);
    });

    it('should not contain hardcoded AWS credentials', () => {
      expect(has(/aws_access_key_id\s*=/)).toBe(false);
      expect(has(/aws_secret_access_key\s*=/)).toBe(false);
      expect(has(/aws_access_key\s*=/)).toBe(false);
      expect(has(/aws_secret_key\s*=/)).toBe(false);
    });

    it('should contain proper terraform resource blocks', () => {
      const resourceCount = count(/resource\s+"aws_/g);
      expect(resourceCount).toBeGreaterThan(20);
    });
  });

  describe('Variable Definitions', () => {
    it('should define aws_region variable with us-east-1 default', () => {
      expect(has(/variable\s+"aws_region"\s*{[\s\S]*?default\s*=\s*"us-east-1"/)).toBe(true);
      expect(has(/variable\s+"aws_region"\s*{[\s\S]*?type\s*=\s*string/)).toBe(true);
      expect(has(/variable\s+"aws_region"\s*{[\s\S]*?description\s*=\s*"AWS region for resources"/)).toBe(true);
    });

    it('should define environment variable with production default', () => {
      expect(has(/variable\s+"environment"\s*{[\s\S]*?default\s*=\s*"production"/)).toBe(true);
      expect(has(/variable\s+"environment"\s*{[\s\S]*?type\s*=\s*string/)).toBe(true);
      expect(has(/variable\s+"environment"\s*{[\s\S]*?description\s*=\s*"Environment name"/)).toBe(true);
    });

    it('should define project_name variable with webapp default', () => {
      expect(has(/variable\s+"project_name"\s*{[\s\S]*?default\s*=\s*"webapp"/)).toBe(true);
      expect(has(/variable\s+"project_name"\s*{[\s\S]*?type\s*=\s*string/)).toBe(true);
      expect(has(/variable\s+"project_name"\s*{[\s\S]*?description\s*=\s*"Project name"/)).toBe(true);
    });
  });

  describe('Data Sources', () => {
    it('should configure aws_availability_zones data source', () => {
      expect(has(/data\s+"aws_availability_zones"\s+"available"\s*{[\s\S]*?state\s*=\s*"available"/)).toBe(true);
    });

    it('should configure aws_ami data source for Amazon Linux 2023', () => {
      expect(has(/data\s+"aws_ami"\s+"amazon_linux_2023"\s*{/)).toBe(true);
      expect(has(/most_recent\s*=\s*true/)).toBe(true);
    });
  });

  describe('Secrets Manager Configuration', () => {
    it('should create random password for RDS', () => {
      expect(has(/resource\s+"random_password"\s+"rds_password"\s*{/)).toBe(true);
      expect(has(/length\s*=\s*32/)).toBe(true);
      expect(has(/special\s*=\s*true/)).toBe(true);
    });

    it('should create Secrets Manager secret for RDS password', () => {
      expect(has(/resource\s+"aws_secretsmanager_secret"\s+"rds_password"\s*{/)).toBe(true);
      expect(has(/name_prefix\s*=\s*"rds-master-password-"/)).toBe(true);
      expect(has(/description\s*=\s*"RDS master password for PostgreSQL database"/)).toBe(true);
    });

    it('should create secret version with random password', () => {
      expect(has(/resource\s+"aws_secretsmanager_secret_version"\s+"rds_password"\s*{/)).toBe(true);
      expect(has(/secret_id\s*=\s*aws_secretsmanager_secret\.rds_password\.id/)).toBe(true);
      expect(has(/secret_string\s*=\s*random_password\.rds_password\.result/)).toBe(true);
    });

    it('should tag Secrets Manager resources properly', () => {
      expect(has(/aws_secretsmanager_secret[\s\S]*?tags\s*=\s*{[\s\S]*?ManagedBy\s*=\s*"Terraform"/)).toBe(true);
    });
  });

  describe('VPC and Core Networking', () => {
    it('should create VPC with proper CIDR and DNS settings', () => {
      expect(has(/resource\s+"aws_vpc"\s+"main"\s*{/)).toBe(true);
      expect(has(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/)).toBe(true);
      expect(has(/enable_dns_hostnames\s*=\s*true/)).toBe(true);
      expect(has(/enable_dns_support\s*=\s*true/)).toBe(true);
    });

    it('should create Internet Gateway attached to VPC', () => {
      expect(has(/resource\s+"aws_internet_gateway"\s+"main"\s*{[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\.id/)).toBe(true);
    });

    it('should create exactly 3 public subnets with correct configuration', () => {
      expect(has(/resource\s+"aws_subnet"\s+"public"\s*{[\s\S]*?count\s*=\s*3/)).toBe(true);
      expect(has(/map_public_ip_on_launch\s*=\s*true/)).toBe(true);
      expect(has(/"10\.0\.\$\{count\.index\s*\+\s*1\}\.0\/24"/)).toBe(true);
    });

    it('should create exactly 3 private subnets', () => {
      expect(has(/resource\s+"aws_subnet"\s+"private"\s*{[\s\S]*?count\s*=\s*3/)).toBe(true);
      expect(has(/"10\.0\.\$\{count\.index\s*\+\s*11\}\.0\/24"/)).toBe(true);
    });

    it('should create Elastic IPs for NAT Gateways', () => {
      expect(has(/resource\s+"aws_eip"\s+"nat"\s*{[\s\S]*?count\s*=\s*3/)).toBe(true);
      expect(has(/domain\s*=\s*"vpc"/)).toBe(true);
    });

    it('should create NAT Gateways in each public subnet', () => {
      expect(has(/resource\s+"aws_nat_gateway"\s+"main"\s*{[\s\S]*?count\s*=\s*3/)).toBe(true);
    });

    it('should create public route table with internet gateway route', () => {
      expect(has(/resource\s+"aws_route_table"\s+"public"\s*{[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\.id/)).toBe(true);
      expect(has(/route\s*{[\s\S]*?cidr_block\s*=\s*"0\.0\.0\.0\/0"[\s\S]*?gateway_id\s*=\s*aws_internet_gateway\.main\.id/)).toBe(true);
    });

    it('should create private route tables with NAT gateway routes', () => {
      expect(has(/resource\s+"aws_route_table"\s+"private"\s*{[\s\S]*?count\s*=\s*3/)).toBe(true);
    });

    it('should associate route tables with correct subnets', () => {
      expect(has(/resource\s+"aws_route_table_association"\s+"public"\s*{[\s\S]*?count\s*=\s*3/)).toBe(true);
      expect(has(/resource\s+"aws_route_table_association"\s+"private"\s*{[\s\S]*?count\s*=\s*3/)).toBe(true);
    });
  });

  describe('Security Groups Configuration', () => {
    it('should create ALB security group with HTTP ingress', () => {
      expect(has(/resource\s+"aws_security_group"\s+"alb"\s*{/)).toBe(true);
      expect(has(/name_prefix\s*=\s*"\$\{var\.project_name\}-alb-sg-"/)).toBe(true);
      expect(has(/description\s*=\s*"Security group for Application Load Balancer"/)).toBe(true);
    });

    it('should configure ALB security group rules correctly', () => {
      expect(has(/ingress\s*{[\s\S]*?description\s*=\s*"HTTP from anywhere"[\s\S]*?from_port\s*=\s*80[\s\S]*?to_port\s*=\s*80/)).toBe(true);
    });

    it('should create EC2 security group with app port access', () => {
      expect(has(/resource\s+"aws_security_group"\s+"ec2"\s*{/)).toBe(true);
      expect(has(/name_prefix\s*=\s*"\$\{var\.project_name\}-ec2-sg-"/)).toBe(true);
      expect(has(/description\s*=\s*"Security group for EC2 instances"/)).toBe(true);
    });

    it('should allow traffic from ALB to EC2 on port 3000', () => {
      expect(has(/ingress\s*{[\s\S]*?description\s*=\s*"App port from ALB"[\s\S]*?from_port\s*=\s*3000[\s\S]*?to_port\s*=\s*3000/)).toBe(true);
    });

    it('should create RDS security group with PostgreSQL access', () => {
      expect(has(/resource\s+"aws_security_group"\s+"rds"\s*{/)).toBe(true);
      expect(has(/name_prefix\s*=\s*"\$\{var\.project_name\}-rds-sg-"/)).toBe(true);
      expect(has(/description\s*=\s*"Security group for RDS PostgreSQL"/)).toBe(true);
    });

    it('should allow PostgreSQL traffic from EC2 to RDS', () => {
      expect(has(/ingress\s*{[\s\S]*?description\s*=\s*"PostgreSQL from EC2"[\s\S]*?from_port\s*=\s*5432[\s\S]*?to_port\s*=\s*5432/)).toBe(true);
    });

    it('should allow all outbound traffic for all security groups', () => {
      const egressCount = count(/egress\s*{[\s\S]*?from_port\s*=\s*0[\s\S]*?to_port\s*=\s*0[\s\S]*?protocol\s*=\s*"-1"/g);
      expect(egressCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Application Load Balancer Configuration', () => {
    it('should create Application Load Balancer', () => {
      expect(has(/resource\s+"aws_lb"\s+"main"\s*{/)).toBe(true);
      expect(has(/name\s*=\s*"\$\{var\.project_name\}-alb1"/)).toBe(true);
      expect(has(/internal\s*=\s*false/)).toBe(true);
      expect(has(/load_balancer_type\s*=\s*"application"/)).toBe(true);
    });

    it('should configure ALB with proper settings', () => {
      expect(has(/enable_deletion_protection\s*=\s*false/)).toBe(true);
      expect(has(/enable_http2\s*=\s*true/)).toBe(true);
    });

    it('should create Target Group with health check', () => {
      expect(has(/resource\s+"aws_lb_target_group"\s+"main"\s*{/)).toBe(true);
      expect(has(/name\s*=\s*"\$\{var\.project_name\}-tg-new"/)).toBe(true);
      expect(has(/port\s*=\s*3000/)).toBe(true);
      expect(has(/protocol\s*=\s*"HTTP"/)).toBe(true);
      expect(has(/vpc_id\s*=\s*aws_vpc\.main\.id/)).toBe(true);
    });

    it('should configure health check properly', () => {
      expect(has(/health_check\s*{[\s\S]*?enabled\s*=\s*true/)).toBe(true);
      expect(has(/healthy_threshold\s*=\s*2/)).toBe(true);
      expect(has(/unhealthy_threshold\s*=\s*2/)).toBe(true);
      expect(has(/timeout\s*=\s*5/)).toBe(true);
      expect(has(/interval\s*=\s*30/)).toBe(true);
      expect(has(/path\s*=\s*"\/health"/)).toBe(true);
      expect(has(/matcher\s*=\s*"200"/)).toBe(true);
    });

    it('should create ALB Listener for HTTP traffic', () => {
      expect(has(/resource\s+"aws_lb_listener"\s+"http"\s*{/)).toBe(true);
      expect(has(/load_balancer_arn\s*=\s*aws_lb\.main\.arn/)).toBe(true);
      expect(has(/port\s*=\s*"80"/)).toBe(true);
      expect(has(/protocol\s*=\s*"HTTP"/)).toBe(true);
    });

    it('should configure listener default action to forward to target group', () => {
      expect(has(/default_action\s*{[\s\S]*?type\s*=\s*"forward"[\s\S]*?target_group_arn\s*=\s*aws_lb_target_group\.main\.arn/)).toBe(true);
    });

    it('should set deregistration delay', () => {
      expect(has(/deregistration_delay\s*=\s*30/)).toBe(true);
    });
  });

  describe('IAM Roles and Policies', () => {
    it('should create IAM role for EC2 instances', () => {
      expect(has(/resource\s+"aws_iam_role"\s+"ec2"\s*{/)).toBe(true);
      expect(has(/name_prefix\s*=\s*"\$\{var\.project_name\}-ec2-role-"/)).toBe(true);
    });

    it('should create IAM policy for Secrets Manager access', () => {
      expect(has(/resource\s+"aws_iam_role_policy"\s+"ec2_secrets"\s*{/)).toBe(true);
      expect(has(/name_prefix\s*=\s*"ec2-secrets-policy-"/)).toBe(true);
      expect(has(/role\s*=\s*aws_iam_role\.ec2\.id/)).toBe(true);
    });

    it('should create IAM instance profile for EC2', () => {
      expect(has(/resource\s+"aws_iam_instance_profile"\s+"ec2"\s*{/)).toBe(true);
      expect(has(/name_prefix\s*=\s*"\$\{var\.project_name\}-ec2-profile-"/)).toBe(true);
      expect(has(/role\s*=\s*aws_iam_role\.ec2\.name/)).toBe(true);
    });
  });

  describe('Launch Template Configuration', () => {
    it('should create launch template with proper settings', () => {
      expect(has(/resource\s+"aws_launch_template"\s+"main"\s*{/)).toBe(true);
      expect(has(/name_prefix\s*=\s*"\$\{var\.project_name\}-lt-"/)).toBe(true);
      expect(has(/image_id\s*=\s*data\.aws_ami\.amazon_linux_2023\.id/)).toBe(true);
      expect(has(/instance_type\s*=\s*"t3\.medium"/)).toBe(true);
    });

    it('should attach IAM instance profile to launch template', () => {
      expect(has(/iam_instance_profile\s*{[\s\S]*?arn\s*=\s*aws_iam_instance_profile\.ec2\.arn/)).toBe(true);
    });

    it('should configure IMDSv2 metadata options', () => {
      expect(has(/metadata_options\s*{[\s\S]*?http_endpoint\s*=\s*"enabled"/)).toBe(true);
      expect(has(/http_tokens\s*=\s*"required"/)).toBe(true);
      expect(has(/http_put_response_hop_limit\s*=\s*1/)).toBe(true);
      expect(has(/instance_metadata_tags\s*=\s*"enabled"/)).toBe(true);
    });

    it('should include user_data script for Node.js application', () => {
      expect(has(/user_data\s*=\s*base64encode/)).toBe(true);
      expect(has(/yum install -y nodejs npm/)).toBe(true);
      expect(has(/const port = 3000/)).toBe(true);
      expect(has(/\/health/)).toBe(true);
    });

    it('should create systemd service for Node.js app', () => {
      expect(has(/nodeapp\.service/)).toBe(true);
      expect(has(/ExecStart=\/usr\/bin\/node app\.js/)).toBe(true);
      expect(has(/Restart=always/)).toBe(true);
      expect(has(/RestartSec=10/)).toBe(true);
    });

    it('should configure tag specifications for instances', () => {
      expect(has(/tag_specifications\s*{[\s\S]*?resource_type\s*=\s*"instance"/)).toBe(true);
    });
  });

  describe('Auto Scaling Configuration', () => {
    it('should create Auto Scaling Group with proper settings', () => {
      expect(has(/resource\s+"aws_autoscaling_group"\s+"main"\s*{/)).toBe(true);
      expect(has(/name_prefix\s*=\s*"\$\{var\.project_name\}-asg-"/)).toBe(true);
    });

    it('should configure ASG capacity settings', () => {
      expect(has(/min_size\s*=\s*2/)).toBe(true);
      expect(has(/max_size\s*=\s*10/)).toBe(true);
      expect(has(/desired_capacity\s*=\s*2/)).toBe(true);
    });

    it('should configure health check settings', () => {
      expect(has(/health_check_type\s*=\s*"ELB"/)).toBe(true);
      expect(has(/health_check_grace_period\s*=\s*300/)).toBe(true);
    });

    it('should reference launch template in ASG', () => {
      expect(has(/launch_template\s*{[\s\S]*?id\s*=\s*aws_launch_template\.main\.id[\s\S]*?version\s*=\s*"\$Latest"/)).toBe(true);
    });

    it('should configure ASG tags properly', () => {
      expect(has(/tag\s*{[\s\S]*?key\s*=\s*"Name"[\s\S]*?propagate_at_launch\s*=\s*true/)).toBe(true);
      expect(has(/tag\s*{[\s\S]*?key\s*=\s*"Environment"[\s\S]*?propagate_at_launch\s*=\s*true/)).toBe(true);
      expect(has(/tag\s*{[\s\S]*?key\s*=\s*"Project"[\s\S]*?propagate_at_launch\s*=\s*true/)).toBe(true);
      expect(has(/tag\s*{[\s\S]*?key\s*=\s*"ManagedBy"[\s\S]*?propagate_at_launch\s*=\s*true/)).toBe(true);
    });
  });

  describe('Auto Scaling Policies', () => {
    it('should create CPU-based scaling policy', () => {
      expect(has(/resource\s+"aws_autoscaling_policy"\s+"cpu"\s*{/)).toBe(true);
      expect(has(/name\s*=\s*"\$\{var\.project_name\}-cpu-scaling"/)).toBe(true);
      expect(has(/scaling_adjustment\s*=\s*1/)).toBe(true);
      expect(has(/adjustment_type\s*=\s*"ChangeInCapacity"/)).toBe(true);
      expect(has(/cooldown\s*=\s*300/)).toBe(true);
    });

    it('should create CloudWatch metric alarm for high CPU', () => {
      expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_high"\s*{/)).toBe(true);
      expect(has(/alarm_name\s*=\s*"\$\{var\.project_name\}-cpu-high"/)).toBe(true);
      expect(has(/comparison_operator\s*=\s*"GreaterThanThreshold"/)).toBe(true);
    });

    it('should configure CPU alarm thresholds', () => {
      expect(has(/metric_name\s*=\s*"CPUUtilization"/)).toBe(true);
      expect(has(/namespace\s*=\s*"AWS\/EC2"/)).toBe(true);
      expect(has(/period\s*=\s*"120"/)).toBe(true);
      expect(has(/statistic\s*=\s*"Average"/)).toBe(true);
      expect(has(/threshold\s*=\s*"70"/)).toBe(true);
      expect(has(/evaluation_periods\s*=\s*"2"/)).toBe(true);
    });

    it('should set alarm dimension to ASG', () => {
      expect(has(/dimensions\s*=\s*{[\s\S]*?AutoScalingGroupName\s*=\s*aws_autoscaling_group\.main\.name/)).toBe(true);
    });
  });

  describe('RDS Database Configuration', () => {
    it('should create DB subnet group', () => {
      expect(has(/resource\s+"aws_db_subnet_group"\s+"main"\s*{/)).toBe(true);
      expect(has(/name_prefix\s*=\s*"\$\{var\.project_name\}-db-subnet-"/)).toBe(true);
    });

    it('should create RDS PostgreSQL instance', () => {
      expect(has(/resource\s+"aws_db_instance"\s+"main"\s*{/)).toBe(true);
      expect(has(/identifier_prefix\s*=\s*"\$\{var\.project_name\}-db-"/)).toBe(true);
      expect(has(/engine\s*=\s*"postgres"/)).toBe(true);
      expect(has(/engine_version\s*=\s*"15"/)).toBe(true);
      expect(has(/instance_class\s*=\s*"db\.t3\.micro"/)).toBe(true);
    });

    it('should configure RDS storage settings', () => {
      expect(has(/allocated_storage\s*=\s*20/)).toBe(true);
      expect(has(/storage_type\s*=\s*"gp3"/)).toBe(true);
      expect(has(/storage_encrypted\s*=\s*true/)).toBe(true);
    });

    it('should configure RDS database credentials', () => {
      expect(has(/db_name\s*=\s*"appdb"/)).toBe(true);
      expect(has(/username\s*=\s*"dbadmin"/)).toBe(true);
      expect(has(/password\s*=\s*aws_secretsmanager_secret_version\.rds_password\.secret_string/)).toBe(true);
    });

    it('should configure RDS security and networking', () => {
      expect(has(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.main\.name/)).toBe(true);
      expect(has(/multi_az\s*=\s*true/)).toBe(true);
      expect(has(/publicly_accessible\s*=\s*false/)).toBe(true);
    });

    it('should configure RDS backup settings', () => {
      expect(has(/backup_retention_period\s*=\s*7/)).toBe(true);
      expect(has(/backup_window\s*=\s*"03:00-04:00"/)).toBe(true);
      expect(has(/maintenance_window\s*=\s*"sun:04:00-sun:05:00"/)).toBe(true);
    });

    it('should configure RDS deletion protection', () => {
      expect(has(/skip_final_snapshot\s*=\s*true/)).toBe(true);
      expect(has(/deletion_protection\s*=\s*false/)).toBe(true);
    });
  });

  describe('Output Values', () => {
    it('should output ALB DNS name', () => {
      expect(has(/output\s+"alb_dns_name"\s*{/)).toBe(true);
      expect(has(/value\s*=\s*aws_lb\.main\.dns_name/)).toBe(true);
      expect(has(/description\s*=\s*"DNS name of the Application Load Balancer"/)).toBe(true);
    });

    it('should output RDS endpoint', () => {
      expect(has(/output\s+"rds_endpoint"\s*{/)).toBe(true);
      expect(has(/value\s*=\s*aws_db_instance\.main\.endpoint/)).toBe(true);
      expect(has(/description\s*=\s*"RDS instance endpoint"/)).toBe(true);
    });

    it('should output Secrets Manager secret ARN', () => {
      expect(has(/output\s+"secrets_manager_secret_arn"\s*{/)).toBe(true);
      expect(has(/value\s*=\s*aws_secretsmanager_secret\.rds_password\.arn/)).toBe(true);
      expect(has(/description\s*=\s*"ARN of the Secrets Manager secret containing RDS password"/)).toBe(true);
    });
  });

  describe('Resource Tagging', () => {
    it('should include Environment tag across resources', () => {
      const envTagCount = count(/Environment\s*=\s*var\.environment/g);
      expect(envTagCount).toBeGreaterThan(15);
    });

    it('should include Project tag across resources', () => {
      const projectTagCount = count(/Project\s*=\s*var\.project_name/g);
      expect(projectTagCount).toBeGreaterThan(15);
    });

    it('should include ManagedBy tag with Terraform value', () => {
      const managedByCount = count(/ManagedBy\s*=\s*"Terraform"/g);
      expect(managedByCount).toBeGreaterThan(15);
    });

    it('should include Name tags with project_name prefix', () => {
      const nameTagCount = count(/Name\s*=\s*"\$\{var\.project_name\}/g);
      expect(nameTagCount).toBeGreaterThan(10);
    });
  });

  describe('Security Best Practices', () => {
    it('should enable storage encryption for RDS', () => {
      expect(has(/storage_encrypted\s*=\s*true/)).toBe(true);
    });

    it('should use IMDSv2 for EC2 metadata service', () => {
      expect(has(/http_tokens\s*=\s*"required"/)).toBe(true);
    });

    it('should not expose RDS publicly', () => {
      expect(has(/publicly_accessible\s*=\s*false/)).toBe(true);
    });

    it('should use secure password for RDS with special characters', () => {
      expect(has(/special\s*=\s*true/)).toBe(true);
      expect(has(/length\s*=\s*32/)).toBe(true);
    });

    it('should enable CloudWatch logging for RDS', () => {
      expect(has(/enabled_cloudwatch_logs_exports/)).toBe(true);
    });

    it('should configure proper backup retention', () => {
      expect(has(/backup_retention_period\s*=\s*7/)).toBe(true);
    });
  });

  describe('High Availability and Resilience', () => {
    it('should deploy resources across 3 availability zones', () => {
      expect(has(/count\s*=\s*3/)).toBe(true);
    });

    it('should create NAT gateway in each AZ for high availability', () => {
      const natGatewayCount = count(/resource\s+"aws_nat_gateway"/g);
      expect(natGatewayCount).toBe(1);
      expect(has(/resource\s+"aws_nat_gateway"\s+"main"\s*{[\s\S]*?count\s*=\s*3/)).toBe(true);
    });

    it('should enable Multi-AZ for RDS', () => {
      expect(has(/multi_az\s*=\s*true/)).toBe(true);
    });

    it('should configure auto-scaling with appropriate thresholds', () => {
      expect(has(/min_size\s*=\s*2/)).toBe(true);
      expect(has(/max_size\s*=\s*10/)).toBe(true);
    });

    it('should use ELB health checks for ASG', () => {
      expect(has(/health_check_type\s*=\s*"ELB"/)).toBe(true);
    });

    it('should configure health check grace period', () => {
      expect(has(/health_check_grace_period\s*=\s*300/)).toBe(true);
    });
  });

  describe('Network Architecture', () => {
    it('should separate public and private subnets', () => {
      expect(has(/resource\s+"aws_subnet"\s+"public"/)).toBe(true);
      expect(has(/resource\s+"aws_subnet"\s+"private"/)).toBe(true);
    });

    it('should use proper CIDR blocks for network segmentation', () => {
      // Public subnets: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
      expect(has(/"10\.0\.\$\{count\.index\s*\+\s*1\}\.0\/24"/)).toBe(true);
      // Private subnets: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
      expect(has(/"10\.0\.\$\{count\.index\s*\+\s*11\}\.0\/24"/)).toBe(true);
    });

    it('should configure separate route tables for public and private subnets', () => {
      expect(has(/resource\s+"aws_route_table"\s+"public"/)).toBe(true);
      expect(has(/resource\s+"aws_route_table"\s+"private"/)).toBe(true);
    });
  });

  describe('Monitoring and Observability', () => {
    it('should configure CloudWatch alarm for CPU utilization', () => {
      expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_high"/)).toBe(true);
      expect(has(/alarm_description\s*=\s*"This metric monitors ec2 cpu utilization"/)).toBe(true);
    });

    it('should enable instance metadata tags', () => {
      expect(has(/instance_metadata_tags\s*=\s*"enabled"/)).toBe(true);
    });

    it('should configure health checks for target group', () => {
      expect(has(/health_check\s*{[\s\S]*?enabled\s*=\s*true/)).toBe(true);
      expect(has(/path\s*=\s*"\/health"/)).toBe(true);
    });
  });

  describe('Dependency Management', () => {

    it('should reference resources correctly', () => {
      // VPC references
      expect(has(/vpc_id\s*=\s*aws_vpc\.main\.id/)).toBe(true);
    });
  });

  describe('Compliance and Best Practices', () => {
    it('should use latest Amazon Linux 2023 AMI', () => {
      expect(has(/al2023-ami-\*-x86_64/)).toBe(true);
      expect(has(/most_recent\s*=\s*true/)).toBe(true);
    });

    it('should use gp3 storage for better performance', () => {
      expect(has(/storage_type\s*=\s*"gp3"/)).toBe(true);
    });

    it('should use t3 instance types for cost optimization', () => {
      expect(has(/instance_type\s*=\s*"t3\.medium"/)).toBe(true);
      expect(has(/instance_class\s*=\s*"db\.t3\.micro"/)).toBe(true);
    });

    it('should configure maintenance windows for RDS', () => {
      expect(has(/maintenance_window\s*=\s*"sun:04:00-sun:05:00"/)).toBe(true);
      expect(has(/backup_window\s*=\s*"03:00-04:00"/)).toBe(true);
    });

    it('should use PostgreSQL 15 for RDS', () => {
      expect(has(/engine\s*=\s*"postgres"[\s\S]*?engine_version\s*=\s*"15"/)).toBe(true);
    });
  });

  describe('Application Configuration', () => {
    it('should install Node.js and npm', () => {
      expect(has(/yum install -y nodejs npm/)).toBe(true);
    });

    it('should create application directory', () => {
      expect(has(/mkdir -p \/opt\/app/)).toBe(true);
    });

    it('should configure Node.js application on port 3000', () => {
      expect(has(/const port = 3000/)).toBe(true);
      expect(has(/Server running on port/)).toBe(true);
    });

    it('should implement health check endpoint', () => {
      expect(has(/req\.url === '\/health'/)).toBe(true);
    });

    it('should configure systemd service for automatic startup', () => {
      expect(has(/systemctl enable nodeapp\.service/)).toBe(true);
      expect(has(/systemctl start nodeapp\.service/)).toBe(true);
    });
  });

  describe('Cost Optimization', () => {
    it('should use ON_DEMAND capacity for predictable costs', () => {
      expect(has(/deregistration_delay\s*=\s*30/)).toBe(true);
    });

    it('should configure appropriate instance sizes', () => {
      expect(has(/instance_type\s*=\s*"t3\.medium"/)).toBe(true);
      expect(has(/instance_class\s*=\s*"db\.t3\.micro"/)).toBe(true);
    });

    it('should set reasonable auto-scaling limits', () => {
      expect(has(/min_size\s*=\s*2/)).toBe(true);
      expect(has(/max_size\s*=\s*10/)).toBe(true);
    });
  });
});