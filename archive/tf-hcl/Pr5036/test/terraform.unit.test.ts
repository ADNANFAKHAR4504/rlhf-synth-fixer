/**
 * Unit Tests for Terraform Auto-Scaling Blog Platform Infrastructure
 * Tests static analysis of lib/main.tf and lib/provider.tf files
 * Requirements: 90%+ code coverage, no hardcoded environment suffixes
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure Unit Tests', () => {
  let mainTfContent: string;
  let providerTfContent: string;

  // Helper function to check if content contains a pattern
  const has = (content: string, pattern: string): boolean => {
    const regex = new RegExp(pattern, 'i');
    return regex.test(content);
  };

  // Helper function to count occurrences of a pattern
  const count = (content: string, pattern: string): number => {
    const regex = new RegExp(pattern, 'gi');
    const matches = content.match(regex);
    return matches ? matches.length : 0;
  };

  beforeAll(() => {
    // Read Terraform configuration files
    const libDir = path.join(process.cwd(), 'lib');
    mainTfContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf-8');
    providerTfContent = fs.readFileSync(path.join(libDir, 'provider.tf'), 'utf-8');
  });

  describe('File Structure & Separation', () => {
    it('should have main.tf file containing infrastructure resources', () => {
      expect(mainTfContent).toBeDefined();
      expect(mainTfContent.length).toBeGreaterThan(0);
    });

    it('should have provider.tf file containing provider configuration', () => {
      expect(providerTfContent).toBeDefined();
      expect(providerTfContent.length).toBeGreaterThan(0);
    });

    it('should separate provider configuration from main infrastructure', () => {
      expect(has(providerTfContent, 'provider\\s+"aws"')).toBe(true);
      expect(has(providerTfContent, 'terraform\\s*{')).toBe(true);
      expect(has(mainTfContent, 'resource\\s+"aws_')).toBe(true);
    });

    it('should contain appropriate file headers and structure', () => {
      expect(has(mainTfContent, '# Data Sources')).toBe(true);
      expect(has(mainTfContent, '# Variables')).toBe(true);
      expect(has(mainTfContent, '# Outputs')).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    it('should require Terraform version >= 1.0', () => {
      expect(has(providerTfContent, 'required_version\\s*=\\s*">=\\s*1\\.0"')).toBe(true);
    });

    it('should use AWS provider version ~> 5.0', () => {
      expect(has(providerTfContent, 'version\\s*=\\s*"~>\\s*5\\.0"')).toBe(true);
    });

    it('should use random provider version ~> 3.5', () => {
      expect(has(providerTfContent, 'version\\s*=\\s*"~>\\s*3\\.5"')).toBe(true);
    });

    it('should configure S3 backend', () => {
      expect(has(providerTfContent, 'backend\\s+"s3"')).toBe(true);
    });

    it('should configure default tags in provider', () => {
      expect(has(providerTfContent, 'default_tags')).toBe(true);
      expect(has(providerTfContent, 'Project\\s*=\\s*"blog-platform"')).toBe(true);
      expect(has(providerTfContent, 'ManagedBy\\s*=\\s*"terraform"')).toBe(true);
    });
  });

  describe('Data Sources & Variables', () => {
    it('should define required data sources', () => {
      expect(has(mainTfContent, 'data\\s+"aws_caller_identity"\\s+"current"')).toBe(true);
      expect(has(mainTfContent, 'data\\s+"aws_region"\\s+"current"')).toBe(true);
      expect(has(mainTfContent, 'data\\s+"aws_availability_zones"\\s+"available"')).toBe(true);
      expect(has(mainTfContent, 'data\\s+"aws_ami"\\s+"amazon_linux_2"')).toBe(true);
    });

    it('should define aws_region variable with default', () => {
      expect(has(mainTfContent, 'variable\\s+"aws_region"')).toBe(true);
      expect(has(mainTfContent, 'default\\s*=\\s*"us-west-1"')).toBe(true);
    });

    it('should define environment variable with default', () => {
      expect(has(mainTfContent, 'variable\\s+"environment"')).toBe(true);
      expect(has(mainTfContent, 'default\\s*=\\s*"prod"')).toBe(true);
    });

    it('should include proper variable descriptions', () => {
      expect(has(mainTfContent, 'description\\s*=\\s*"AWS region for deployment"')).toBe(true);
      expect(has(mainTfContent, 'description\\s*=\\s*"Environment name')).toBe(true);
    });
  });

  describe('Locals & Common Tags', () => {
    it('should define common_tags in locals block', () => {
      expect(has(mainTfContent, 'locals\\s*{')).toBe(true);
      expect(has(mainTfContent, 'common_tags\\s*=')).toBe(true);
      expect(has(mainTfContent, 'Project\\s*=\\s*"blog-platform"')).toBe(true);
      expect(has(mainTfContent, 'Environment\\s*=\\s*var\\.environment')).toBe(true);
      expect(has(mainTfContent, 'ManagedBy\\s*=\\s*"Terraform"')).toBe(true);
    });

    it('should define VPC and subnet CIDR blocks', () => {
      expect(has(mainTfContent, 'vpc_cidr\\s*=\\s*"10\\.0\\.0\\.0/16"')).toBe(true);
      expect(has(mainTfContent, 'public_subnet_cidrs')).toBe(true);
      expect(has(mainTfContent, '"10\\.0\\.1\\.0/24"')).toBe(true);
      expect(has(mainTfContent, '"10\\.0\\.2\\.0/24"')).toBe(true);
    });

    it('should define Auto Scaling configuration in locals', () => {
      expect(has(mainTfContent, 'asg_min_size\\s*=\\s*2')).toBe(true);
      expect(has(mainTfContent, 'asg_max_size\\s*=\\s*6')).toBe(true);
      expect(has(mainTfContent, 'asg_desired_size\\s*=\\s*2')).toBe(true);
    });

    it('should define CloudWatch alarm thresholds', () => {
      expect(has(mainTfContent, 'cpu_scale_out_threshold\\s*=\\s*70')).toBe(true);
      expect(has(mainTfContent, 'cpu_scale_in_threshold\\s*=\\s*30')).toBe(true);
      expect(has(mainTfContent, 'request_count_threshold\\s*=\\s*1000')).toBe(true);
    });
  });

  describe('Random Suffix Configuration', () => {
    it('should define random string with correct parameters', () => {
      expect(has(mainTfContent, 'resource\\s+"random_string"\\s+"suffix"')).toBe(true);
      expect(has(mainTfContent, 'length\\s*=\\s*8')).toBe(true);
      expect(has(mainTfContent, 'special\\s*=\\s*false')).toBe(true);
      expect(has(mainTfContent, 'upper\\s*=\\s*false')).toBe(true);
      expect(has(mainTfContent, 'numeric\\s*=\\s*true')).toBe(true);
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should use random suffix in all resource names', () => {
      const resourcesWithSuffix = count(mainTfContent, '\\$\\{random_string\\.suffix\\.result\\}');
      expect(resourcesWithSuffix).toBeGreaterThan(15);
    });

    it('should not contain hardcoded environment suffixes', () => {
      expect(has(mainTfContent, 'prod-')).toBe(false);
      expect(has(mainTfContent, 'dev-')).toBe(false);
      expect(has(mainTfContent, 'staging-')).toBe(false);
      expect(has(mainTfContent, 'test-')).toBe(false);
    });

    it('should use consistent naming pattern for VPC resources', () => {
      expect(has(mainTfContent, 'Name\\s*=\\s*"blog-vpc-\\$\\{random_string\\.suffix\\.result\\}"')).toBe(true);
      expect(has(mainTfContent, 'Name\\s*=\\s*"blog-public-subnet-az1-\\$\\{random_string\\.suffix\\.result\\}"')).toBe(true);
      expect(has(mainTfContent, 'Name\\s*=\\s*"blog-igw-\\$\\{random_string\\.suffix\\.result\\}"')).toBe(true);
    });

    it('should use name_prefix for resources that support it', () => {
      expect(has(mainTfContent, 'name_prefix\\s*=\\s*"blog-alb-sg-"')).toBe(true);
      expect(has(mainTfContent, 'name_prefix\\s*=\\s*"blog-ec2-sg-"')).toBe(true);
      expect(has(mainTfContent, 'name_prefix\\s*=\\s*"blog-ec2-role-"')).toBe(true);
    });
  });

  describe('Security Configuration', () => {
    it('should disable ALB deletion protection', () => {
      expect(has(mainTfContent, 'enable_deletion_protection\\s*=\\s*false')).toBe(true);
    });

    it('should configure security groups with proper ingress/egress rules', () => {
      expect(has(mainTfContent, 'resource\\s+"aws_security_group"\\s+"alb"')).toBe(true);
      expect(has(mainTfContent, 'resource\\s+"aws_security_group"\\s+"ec2"')).toBe(true);
      expect(has(mainTfContent, 'resource\\s+"aws_security_group_rule"')).toBe(true);
    });

    it('should enable VPC DNS hostname and support', () => {
      expect(has(mainTfContent, 'enable_dns_hostnames\\s*=\\s*true')).toBe(true);
      expect(has(mainTfContent, 'enable_dns_support\\s*=\\s*true')).toBe(true);
    });

    it('should configure metadata options for EC2 instances', () => {
      expect(has(mainTfContent, 'metadata_options\\s*{')).toBe(true);
      expect(has(mainTfContent, 'http_endpoint\\s*=\\s*"enabled"')).toBe(true);
      expect(has(mainTfContent, 'http_tokens\\s*=\\s*"optional"')).toBe(true);
    });

    it('should enable monitoring for launch template', () => {
      expect(has(mainTfContent, 'monitoring\\s*{[^}]*enabled\\s*=\\s*true')).toBe(true);
    });
  });

  describe('AWS Provider 5.x Compliance', () => {
    it('should not use deprecated aws_instance resource for scaling', () => {
      expect(has(mainTfContent, 'resource\\s+"aws_instance"')).toBe(false);
    });

    it('should use launch_template instead of launch_configuration', () => {
      expect(has(mainTfContent, 'resource\\s+"aws_launch_template"')).toBe(true);
      expect(has(mainTfContent, 'resource\\s+"aws_launch_configuration"')).toBe(false);
    });

    it('should use aws_lb instead of deprecated aws_alb', () => {
      expect(has(mainTfContent, 'resource\\s+"aws_lb"\\s+"blog"')).toBe(true);
      expect(has(mainTfContent, 'resource\\s+"aws_alb"')).toBe(false);
    });

    it('should use current AMI data source filters', () => {
      expect(has(mainTfContent, 'filter\\s*{[^}]*name\\s*=\\s*"name"')).toBe(true);
      expect(has(mainTfContent, 'filter\\s*{[^}]*name\\s*=\\s*"virtualization-type"')).toBe(true);
    });
  });

  describe('Policies & IAM Configuration', () => {
    it('should use jsonencode for IAM policies', () => {
      const jsonEncodeCount = count(mainTfContent, 'jsonencode\\s*\\(');
      expect(jsonEncodeCount).toBeGreaterThan(1);
    });

    it('should not contain hardcoded ARNs in policies', () => {
      expect(has(mainTfContent, 'arn:aws:iam::\\d+:')).toBe(false);
      expect(has(mainTfContent, 'arn:aws:s3:::.*-prod-')).toBe(false);
    });

    it('should define proper IAM role for EC2 instances', () => {
      expect(has(mainTfContent, 'resource\\s+"aws_iam_role"\\s+"ec2"')).toBe(true);
      expect(has(mainTfContent, 'Service\\s*=\\s*"ec2\\.amazonaws\\.com"')).toBe(true);
    });

    it('should attach SSM managed policy for instance management', () => {
      expect(has(mainTfContent, 'resource\\s+"aws_iam_role_policy_attachment"\\s+"ssm_managed_instance_core"')).toBe(true);
      expect(has(mainTfContent, 'AmazonSSMManagedInstanceCore')).toBe(true);
    });

    it('should define CloudWatch permissions policy', () => {
      expect(has(mainTfContent, 'resource\\s+"aws_iam_role_policy"\\s+"ec2_cloudwatch"')).toBe(true);
      expect(has(mainTfContent, 'cloudwatch:PutMetricData')).toBe(true);
      expect(has(mainTfContent, 'logs:CreateLogGroup')).toBe(true);
    });
  });

  describe('Auto Scaling Group Configuration', () => {
    it('should configure ASG with proper health checks', () => {
      expect(has(mainTfContent, 'health_check_type\\s*=\\s*"ELB"')).toBe(true);
      expect(has(mainTfContent, 'health_check_grace_period\\s*=\\s*300')).toBe(true);
    });

    it('should enable CloudWatch metrics for ASG', () => {
      expect(has(mainTfContent, 'enabled_metrics\\s*=')).toBe(true);
      expect(has(mainTfContent, 'GroupMinSize')).toBe(true);
      expect(has(mainTfContent, 'GroupMaxSize')).toBe(true);
      expect(has(mainTfContent, 'GroupDesiredCapacity')).toBe(true);
    });

    it('should configure scaling policies', () => {
      expect(has(mainTfContent, 'resource\\s+"aws_autoscaling_policy"\\s+"scale_out"')).toBe(true);
      expect(has(mainTfContent, 'resource\\s+"aws_autoscaling_policy"\\s+"scale_in"')).toBe(true);
      expect(has(mainTfContent, 'adjustment_type\\s*=\\s*"ChangeInCapacity"')).toBe(true);
    });

    it('should configure target group attachment', () => {
      expect(has(mainTfContent, 'target_group_arns\\s*=\\s*\\[aws_lb_target_group\\.blog\\.arn\\]')).toBe(true);
    });
  });

  describe('CloudWatch Alarms Configuration', () => {
    it('should define CPU utilization alarms', () => {
      expect(has(mainTfContent, 'resource\\s+"aws_cloudwatch_metric_alarm"\\s+"cpu_high"')).toBe(true);
      expect(has(mainTfContent, 'resource\\s+"aws_cloudwatch_metric_alarm"\\s+"cpu_low"')).toBe(true);
      expect(has(mainTfContent, 'metric_name\\s*=\\s*"CPUUtilization"')).toBe(true);
    });

    it('should define request count alarm', () => {
      expect(has(mainTfContent, 'resource\\s+"aws_cloudwatch_metric_alarm"\\s+"request_count_high"')).toBe(true);
      expect(has(mainTfContent, 'metric_name\\s*=\\s*"RequestCount"')).toBe(true);
      expect(has(mainTfContent, 'namespace\\s*=\\s*"AWS/ApplicationELB"')).toBe(true);
    });

    it('should configure alarm actions to trigger scaling policies', () => {
      expect(has(mainTfContent, 'alarm_actions\\s*=\\s*\\[aws_autoscaling_policy\\.scale_out\\.arn\\]')).toBe(true);
      expect(has(mainTfContent, 'alarm_actions\\s*=\\s*\\[aws_autoscaling_policy\\.scale_in\\.arn\\]')).toBe(true);
    });

    it('should use local variables for alarm thresholds', () => {
      expect(has(mainTfContent, 'threshold\\s*=\\s*local\\.cpu_scale_out_threshold')).toBe(true);
      expect(has(mainTfContent, 'threshold\\s*=\\s*local\\.cpu_scale_in_threshold')).toBe(true);
      expect(has(mainTfContent, 'threshold\\s*=\\s*local\\.request_count_threshold')).toBe(true);
    });
  });

  describe('Load Balancer Configuration', () => {
    it('should configure ALB with proper settings', () => {
      expect(has(mainTfContent, 'load_balancer_type\\s*=\\s*"application"')).toBe(true);
      expect(has(mainTfContent, 'internal\\s*=\\s*false')).toBe(true);
      expect(has(mainTfContent, 'enable_http2\\s*=\\s*true')).toBe(true);
    });

    it('should configure target group health checks', () => {
      expect(has(mainTfContent, 'health_check\\s*{')).toBe(true);
      expect(has(mainTfContent, 'healthy_threshold\\s*=\\s*2')).toBe(true);
      expect(has(mainTfContent, 'unhealthy_threshold\\s*=\\s*3')).toBe(true);
      expect(has(mainTfContent, 'matcher\\s*=\\s*"200"')).toBe(true);
    });

    it('should configure listener for port 80', () => {
      expect(has(mainTfContent, 'resource\\s+"aws_lb_listener"\\s+"blog"')).toBe(true);
      expect(has(mainTfContent, 'port\\s*=\\s*"80"')).toBe(true);
      expect(has(mainTfContent, 'protocol\\s*=\\s*"HTTP"')).toBe(true);
    });
  });

  describe('User Data Configuration', () => {
    it('should configure user data for EC2 instances', () => {
      expect(has(mainTfContent, 'user_data\\s*=\\s*base64encode')).toBe(true);
      expect(has(mainTfContent, 'yum update -y')).toBe(true);
      expect(has(mainTfContent, 'yum install -y httpd')).toBe(true);
    });

    it('should install CloudWatch agent in user data', () => {
      expect(has(mainTfContent, 'amazon-cloudwatch-agent')).toBe(true);
      expect(has(mainTfContent, 'rpm -U')).toBe(true);
    });

    it('should create simple HTML page for testing', () => {
      expect(has(mainTfContent, 'Blog Platform')).toBe(true);
      expect(has(mainTfContent, 'ec2-metadata --instance-id')).toBe(true);
      expect(has(mainTfContent, 'ec2-metadata --availability-zone')).toBe(true);
    });
  });

  describe('Outputs Configuration', () => {
    it('should define all required outputs with descriptions', () => {
      expect(has(mainTfContent, 'output\\s+"alb_dns_name"')).toBe(true);
      expect(has(mainTfContent, 'output\\s+"vpc_id"')).toBe(true);
      expect(has(mainTfContent, 'output\\s+"subnet_ids"')).toBe(true);
      expect(has(mainTfContent, 'output\\s+"security_group_ids"')).toBe(true);
      expect(has(mainTfContent, 'output\\s+"asg_name"')).toBe(true);
      expect(has(mainTfContent, 'output\\s+"cloudwatch_alarm_arns"')).toBe(true);
    });

    it('should provide proper descriptions for all outputs', () => {
      expect(has(mainTfContent, 'description\\s*=\\s*"DNS name of the Application Load Balancer"')).toBe(true);
      expect(has(mainTfContent, 'description\\s*=\\s*"ID of the VPC"')).toBe(true);
      expect(has(mainTfContent, 'description\\s*=\\s*"IDs of the public subnets"')).toBe(true);
    });

    it('should output resource IDs and ARNs', () => {
      expect(has(mainTfContent, 'value\\s*=\\s*aws_lb\\.blog\\.dns_name')).toBe(true);
      expect(has(mainTfContent, 'value\\s*=\\s*aws_vpc\\.main\\.id')).toBe(true);
      expect(has(mainTfContent, 'value\\s*=\\s*aws_autoscaling_group\\.blog\\.name')).toBe(true);
    });

    it('should output structured data for complex resources', () => {
      expect(has(mainTfContent, 'public_az1\\s*=\\s*aws_subnet\\.public_az1\\.id')).toBe(true);
      expect(has(mainTfContent, 'public_az2\\s*=\\s*aws_subnet\\.public_az2\\.id')).toBe(true);
      expect(has(mainTfContent, 'alb\\s*=\\s*aws_security_group\\.alb\\.id')).toBe(true);
      expect(has(mainTfContent, 'ec2\\s*=\\s*aws_security_group\\.ec2\\.id')).toBe(true);
    });
  });

  describe('Lifecycle Management', () => {
    it('should not have prevent_destroy lifecycle rules', () => {
      expect(has(mainTfContent, 'prevent_destroy\\s*=\\s*true')).toBe(false);
    });

    it('should use create_before_destroy where appropriate', () => {
      expect(has(mainTfContent, 'create_before_destroy\\s*=\\s*true')).toBe(true);
    });

    it('should configure deregistration delay for target group', () => {
      expect(has(mainTfContent, 'deregistration_delay\\s*=\\s*300')).toBe(true);
    });
  });

  describe('Code Organization & Best Practices', () => {
    it('should use consistent resource grouping with comments', () => {
      expect(has(mainTfContent, '# ============================================================================')).toBe(true);
      expect(has(mainTfContent, '# VPC')).toBe(true);
      expect(has(mainTfContent, '# Subnets')).toBe(true);
      expect(has(mainTfContent, '# Security Groups')).toBe(true);
    });

    it('should use merge function for tags', () => {
      const mergeCount = count(mainTfContent, 'merge\\(local\\.common_tags');
      expect(mergeCount).toBeGreaterThan(10);
    });

    it('should use proper resource references', () => {
      expect(has(mainTfContent, 'aws_vpc\\.main\\.id')).toBe(true);
      expect(has(mainTfContent, 'aws_security_group\\.alb\\.id')).toBe(true);
      expect(has(mainTfContent, 'aws_launch_template\\.blog\\.id')).toBe(true);
    });

    it('should use data source values properly', () => {
      expect(has(mainTfContent, 'data\\.aws_availability_zones\\.available\\.names\\[0\\]')).toBe(true);
      expect(has(mainTfContent, 'data\\.aws_ami\\.amazon_linux_2\\.id')).toBe(true);
    });

    it('should define reasonable resource limits and timeouts', () => {
      expect(has(mainTfContent, 'timeout\\s*=\\s*5')).toBe(true);
      expect(has(mainTfContent, 'interval\\s*=\\s*30')).toBe(true);
      expect(has(mainTfContent, 'cooldown\\s*=\\s*300')).toBe(true);
    });

    it('should use appropriate instance types', () => {
      expect(has(mainTfContent, 'instance_type\\s*=\\s*"t3\\.micro"')).toBe(true);
    });
  });
});