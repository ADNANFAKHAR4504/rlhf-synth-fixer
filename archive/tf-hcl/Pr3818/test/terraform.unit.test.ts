// Unit tests for Terraform infrastructure code
import fs from 'fs';
import path from 'path';
import * as hcl from 'hcl2-parser';

const libDir = path.resolve(__dirname, '../lib');

describe('Terraform Infrastructure Unit Tests', () => {
  let mainTf: string;
  let variablesTf: string;
  let outputsTf: string;
  let providerTf: string;
  let parsedMain: any;
  let parsedVariables: any;
  let parsedOutputs: any;
  let parsedProvider: any;

  beforeAll(() => {
    // Read all Terraform files
    mainTf = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
    variablesTf = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');
    outputsTf = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf8');
    providerTf = fs.readFileSync(path.join(libDir, 'provider.tf'), 'utf8');

    // Parse HCL files
    try {
      parsedMain = hcl.parseToObject(mainTf);
      parsedVariables = hcl.parseToObject(variablesTf);
      parsedOutputs = hcl.parseToObject(outputsTf);
      parsedProvider = hcl.parseToObject(providerTf);
    } catch (error) {
      console.error('Error parsing HCL:', error);
    }
  });

  describe('File Structure', () => {
    test('main.tf exists and is not empty', () => {
      expect(fs.existsSync(path.join(libDir, 'main.tf'))).toBe(true);
      expect(mainTf.length).toBeGreaterThan(0);
    });

    test('variables.tf exists and is not empty', () => {
      expect(fs.existsSync(path.join(libDir, 'variables.tf'))).toBe(true);
      expect(variablesTf.length).toBeGreaterThan(0);
    });

    test('outputs.tf exists and is not empty', () => {
      expect(fs.existsSync(path.join(libDir, 'outputs.tf'))).toBe(true);
      expect(outputsTf.length).toBeGreaterThan(0);
    });

    test('provider.tf exists and is not empty', () => {
      expect(fs.existsSync(path.join(libDir, 'provider.tf'))).toBe(true);
      expect(providerTf.length).toBeGreaterThan(0);
    });
  });

  describe('Provider Configuration', () => {
    test('provider.tf declares AWS provider', () => {
      expect(providerTf).toContain('provider "aws"');
    });

    test('provider.tf specifies required Terraform version', () => {
      expect(providerTf).toContain('required_version');
    });

    test('provider.tf configures S3 backend', () => {
      expect(providerTf).toContain('backend "s3"');
    });

    test('provider does not hardcode region', () => {
      expect(providerTf).toContain('var.aws_region');
    });
  });

  describe('Variables', () => {
    test('declares aws_region variable', () => {
      expect(variablesTf).toMatch(/variable\s+"aws_region"/);
    });

    test('declares environment_suffix variable', () => {
      expect(variablesTf).toMatch(/variable\s+"environment_suffix"/);
    });

    test('declares project_name variable', () => {
      expect(variablesTf).toMatch(/variable\s+"project_name"/);
    });

    test('declares vpc_cidr variable', () => {
      expect(variablesTf).toMatch(/variable\s+"vpc_cidr"/);
    });

    test('declares db_username variable as sensitive', () => {
      expect(variablesTf).toMatch(/variable\s+"db_username"/);
      const dbUsernameSection = variablesTf.substring(
        variablesTf.indexOf('variable "db_username"'),
        variablesTf.indexOf('variable "db_username"') + 200
      );
      expect(dbUsernameSection).toContain('sensitive');
    });

    test('declares db_password variable as sensitive', () => {
      expect(variablesTf).toMatch(/variable\s+"db_password"/);
      const dbPasswordSection = variablesTf.substring(
        variablesTf.indexOf('variable "db_password"'),
        variablesTf.indexOf('variable "db_password"') + 200
      );
      expect(dbPasswordSection).toContain('sensitive');
    });
  });

  describe('Networking Resources', () => {
    test('defines VPC with environment suffix', () => {
      expect(mainTf).toContain('resource "aws_vpc" "main"');
      expect(mainTf).toMatch(/Name\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment_suffix\}-vpc"/);
    });

    test('VPC has correct CIDR block configuration', () => {
      const vpcSection = mainTf.substring(
        mainTf.indexOf('resource "aws_vpc" "main"'),
        mainTf.indexOf('resource "aws_vpc" "main"') + 300
      );
      expect(vpcSection).toContain('cidr_block');
      expect(vpcSection).toContain('var.vpc_cidr');
    });

    test('VPC enables DNS hostnames and support', () => {
      const vpcSection = mainTf.substring(
        mainTf.indexOf('resource "aws_vpc" "main"'),
        mainTf.indexOf('resource "aws_vpc" "main"') + 300
      );
      expect(vpcSection).toContain('enable_dns_hostnames = true');
      expect(vpcSection).toContain('enable_dns_support   = true');
    });

    test('defines Internet Gateway with environment suffix', () => {
      expect(mainTf).toContain('resource "aws_internet_gateway" "main"');
      expect(mainTf).toMatch(/Name\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment_suffix\}-igw"/);
    });

    test('defines public subnets across multiple AZs', () => {
      expect(mainTf).toContain('resource "aws_subnet" "public"');
      expect(mainTf).toMatch(/count\s*=\s*2/);
    });

    test('defines private subnets across multiple AZs', () => {
      expect(mainTf).toContain('resource "aws_subnet" "private"');
      const privateSubnetSection = mainTf.substring(
        mainTf.indexOf('resource "aws_subnet" "private"'),
        mainTf.indexOf('resource "aws_subnet" "private"') + 500
      );
      expect(privateSubnetSection).toMatch(/count\s*=\s*2/);
    });

    test('defines NAT Gateway with environment suffix', () => {
      expect(mainTf).toContain('resource "aws_nat_gateway" "main"');
      expect(mainTf).toMatch(/Name\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment_suffix\}-nat-gateway"/);
    });

    test('defines Elastic IP for NAT Gateway', () => {
      expect(mainTf).toContain('resource "aws_eip" "nat"');
    });

    test('defines route tables for public and private subnets', () => {
      expect(mainTf).toContain('resource "aws_route_table" "public"');
      expect(mainTf).toContain('resource "aws_route_table" "private"');
    });
  });

  describe('Security Groups', () => {
    test('defines ALB security group with environment suffix', () => {
      expect(mainTf).toContain('resource "aws_security_group" "alb"');
      expect(mainTf).toMatch(/name_prefix\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment_suffix\}-alb-"/);
    });

    test('ALB security group allows HTTP and HTTPS ingress', () => {
      const albSgSection = mainTf.substring(
        mainTf.indexOf('resource "aws_security_group" "alb"'),
        mainTf.indexOf('resource "aws_security_group" "alb"') + 800
      );
      expect(albSgSection).toContain('from_port   = 80');
      expect(albSgSection).toContain('from_port   = 443');
    });

    test('defines web tier security group with environment suffix', () => {
      expect(mainTf).toContain('resource "aws_security_group" "web"');
      expect(mainTf).toMatch(/name_prefix\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment_suffix\}-web-"/);
    });

    test('web security group allows traffic only from ALB', () => {
      const webSgSection = mainTf.substring(
        mainTf.indexOf('resource "aws_security_group" "web"'),
        mainTf.indexOf('resource "aws_security_group" "web"') + 600
      );
      expect(webSgSection).toContain('security_groups = [aws_security_group.alb.id]');
    });

    test('defines database security group with environment suffix', () => {
      expect(mainTf).toContain('resource "aws_security_group" "database"');
      expect(mainTf).toMatch(/name_prefix\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment_suffix\}-db-"/);
    });

    test('database security group allows traffic only from web tier', () => {
      const dbSgSection = mainTf.substring(
        mainTf.indexOf('resource "aws_security_group" "database"'),
        mainTf.indexOf('resource "aws_security_group" "database"') + 600
      );
      expect(dbSgSection).toContain('security_groups = [aws_security_group.web.id]');
      expect(dbSgSection).toContain('from_port       = 3306');
    });
  });

  describe('Load Balancer and Target Group', () => {
    test('defines Application Load Balancer with environment suffix', () => {
      expect(mainTf).toContain('resource "aws_lb" "main"');
      expect(mainTf).toMatch(/name\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment_suffix\}-alb"/);
    });

    test('ALB is internet-facing', () => {
      const albSection = mainTf.substring(
        mainTf.indexOf('resource "aws_lb" "main"'),
        mainTf.indexOf('resource "aws_lb" "main"') + 400
      );
      expect(albSection).toContain('internal           = false');
      expect(albSection).toContain('load_balancer_type = "application"');
    });

    test('defines target group with environment suffix', () => {
      expect(mainTf).toContain('resource "aws_lb_target_group" "web"');
      expect(mainTf).toMatch(/name\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment_suffix\}-web-tg"/);
    });

    test('target group has health check configured', () => {
      const tgSection = mainTf.substring(
        mainTf.indexOf('resource "aws_lb_target_group" "web"'),
        mainTf.indexOf('resource "aws_lb_target_group" "web"') + 600
      );
      expect(tgSection).toContain('health_check');
      expect(tgSection).toContain('interval            = 30');
    });

    test('defines ALB listener on port 80', () => {
      expect(mainTf).toContain('resource "aws_lb_listener" "http"');
      const listenerSection = mainTf.substring(
        mainTf.indexOf('resource "aws_lb_listener" "http"'),
        mainTf.indexOf('resource "aws_lb_listener" "http"') + 400
      );
      expect(listenerSection).toContain('port              = "80"');
      expect(listenerSection).toContain('protocol          = "HTTP"');
    });
  });

  describe('Compute Resources', () => {
    test('defines launch template with environment suffix', () => {
      expect(mainTf).toContain('resource "aws_launch_template" "web"');
      expect(mainTf).toMatch(/name_prefix\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment_suffix\}-web-"/);
    });

    test('launch template uses t3.medium instance type', () => {
      const ltSection = mainTf.substring(
        mainTf.indexOf('resource "aws_launch_template" "web"'),
        mainTf.indexOf('resource "aws_launch_template" "web"') + 800
      );
      expect(ltSection).toContain('instance_type = "t3.medium"');
    });

    test('launch template has monitoring enabled', () => {
      const ltSection = mainTf.substring(
        mainTf.indexOf('resource "aws_launch_template" "web"'),
        mainTf.indexOf('resource "aws_launch_template" "web"') + 800
      );
      expect(ltSection).toContain('monitoring');
      expect(ltSection).toContain('enabled = true');
    });

    test('defines Auto Scaling Group with environment suffix', () => {
      expect(mainTf).toContain('resource "aws_autoscaling_group" "web"');
      expect(mainTf).toMatch(/name\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment_suffix\}-web-asg"/);
    });

    test('ASG has correct sizing: min=3, max=8, desired=3', () => {
      const asgSection = mainTf.substring(
        mainTf.indexOf('resource "aws_autoscaling_group" "web"'),
        mainTf.indexOf('resource "aws_autoscaling_group" "web"') + 600
      );
      expect(asgSection).toContain('min_size         = 3');
      expect(asgSection).toContain('max_size         = 8');
      expect(asgSection).toContain('desired_capacity = 3');
    });

    test('ASG uses ELB health checks', () => {
      const asgSection = mainTf.substring(
        mainTf.indexOf('resource "aws_autoscaling_group" "web"'),
        mainTf.indexOf('resource "aws_autoscaling_group" "web"') + 600
      );
      expect(asgSection).toContain('health_check_type');
      expect(asgSection).toContain('ELB');
    });

    test('defines auto scaling policy for CPU utilization', () => {
      expect(mainTf).toContain('resource "aws_autoscaling_policy" "cpu_target"');
      const policySection = mainTf.substring(
        mainTf.indexOf('resource "aws_autoscaling_policy" "cpu_target"'),
        mainTf.indexOf('resource "aws_autoscaling_policy" "cpu_target"') + 500
      );
      expect(policySection).toContain('policy_type            = "TargetTrackingScaling"');
    });
  });

  describe('Database Resources', () => {
    test('defines RDS subnet group with environment suffix', () => {
      expect(mainTf).toContain('resource "aws_db_subnet_group" "main"');
      expect(mainTf).toMatch(/name\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment_suffix\}-db-subnet-group"/);
    });

    test('defines RDS MySQL instance with environment suffix', () => {
      expect(mainTf).toContain('resource "aws_db_instance" "main"');
      expect(mainTf).toMatch(/identifier\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment_suffix\}-db"/);
    });

    test('RDS instance uses MySQL engine', () => {
      const rdsSection = mainTf.substring(
        mainTf.indexOf('resource "aws_db_instance" "main"'),
        mainTf.indexOf('resource "aws_db_instance" "main"') + 1000
      );
      expect(rdsSection).toContain('engine         = "mysql"');
    });

    test('RDS instance has Multi-AZ enabled', () => {
      const rdsSection = mainTf.substring(
        mainTf.indexOf('resource "aws_db_instance" "main"'),
        mainTf.indexOf('resource "aws_db_instance" "main"') + 1000
      );
      expect(rdsSection).toContain('multi_az               = true');
    });

    test('RDS instance has encryption enabled', () => {
      const rdsSection = mainTf.substring(
        mainTf.indexOf('resource "aws_db_instance" "main"'),
        mainTf.indexOf('resource "aws_db_instance" "main"') + 1000
      );
      expect(rdsSection).toContain('storage_encrypted     = true');
    });

    test('RDS instance has skip_final_snapshot enabled for testing', () => {
      const rdsSection = mainTf.substring(
        mainTf.indexOf('resource "aws_db_instance" "main"'),
        mainTf.indexOf('resource "aws_db_instance" "main"') + 1000
      );
      expect(rdsSection).toContain('skip_final_snapshot = true');
    });
  });

  describe('Storage Resources', () => {
    test('defines S3 bucket for resumes with environment suffix', () => {
      expect(mainTf).toContain('resource "aws_s3_bucket" "resumes"');
      expect(mainTf).toMatch(/bucket_prefix\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment_suffix\}-resumes-"/);
    });

    test('S3 bucket has versioning enabled', () => {
      expect(mainTf).toContain('resource "aws_s3_bucket_versioning" "resumes"');
      const versioningSection = mainTf.substring(
        mainTf.indexOf('resource "aws_s3_bucket_versioning" "resumes"'),
        mainTf.indexOf('resource "aws_s3_bucket_versioning" "resumes"') + 300
      );
      expect(versioningSection).toContain('status = "Enabled"');
    });

    test('S3 bucket has server-side encryption', () => {
      expect(mainTf).toContain('resource "aws_s3_bucket_server_side_encryption_configuration" "resumes"');
    });

    test('S3 bucket has public access blocked', () => {
      expect(mainTf).toContain('resource "aws_s3_bucket_public_access_block" "resumes"');
      const publicAccessSection = mainTf.substring(
        mainTf.indexOf('resource "aws_s3_bucket_public_access_block" "resumes"'),
        mainTf.indexOf('resource "aws_s3_bucket_public_access_block" "resumes"') + 400
      );
      expect(publicAccessSection).toContain('block_public_acls       = true');
      expect(publicAccessSection).toContain('block_public_policy     = true');
    });

    test('defines S3 Express One Zone directory bucket', () => {
      expect(mainTf).toContain('resource "aws_s3_directory_bucket" "frequent_resumes"');
    });
  });

  describe('CloudWatch and Monitoring', () => {
    test('defines CloudWatch log group', () => {
      expect(mainTf).toContain('resource "aws_cloudwatch_log_group" "app_logs"');
    });

    test('log group has retention period configured', () => {
      const logGroupSection = mainTf.substring(
        mainTf.indexOf('resource "aws_cloudwatch_log_group" "app_logs"'),
        mainTf.indexOf('resource "aws_cloudwatch_log_group" "app_logs"') + 300
      );
      expect(logGroupSection).toContain('retention_in_days = 7');
    });

    test('defines CloudWatch alarm for high CPU', () => {
      expect(mainTf).toContain('resource "aws_cloudwatch_metric_alarm" "high_cpu"');
      expect(mainTf).toMatch(/alarm_name\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment_suffix\}-high-cpu-utilization"/);
    });

    test('CPU alarm monitors Auto Scaling Group', () => {
      const cpuAlarmSection = mainTf.substring(
        mainTf.indexOf('resource "aws_cloudwatch_metric_alarm" "high_cpu"'),
        mainTf.indexOf('resource "aws_cloudwatch_metric_alarm" "high_cpu"') + 600
      );
      expect(cpuAlarmSection).toContain('metric_name         = "CPUUtilization"');
      expect(cpuAlarmSection).toContain('AutoScalingGroupName');
    });

    test('defines CloudWatch alarm for unhealthy hosts', () => {
      expect(mainTf).toContain('resource "aws_cloudwatch_metric_alarm" "unhealthy_hosts"');
      expect(mainTf).toMatch(/alarm_name\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment_suffix\}-unhealthy-hosts"/);
    });

    test('defines Application Insights application', () => {
      expect(mainTf).toContain('resource "aws_applicationinsights_application" "main"');
    });

    test('defines Resource Group for Application Signals', () => {
      expect(mainTf).toContain('resource "aws_resourcegroups_group" "main"');
      expect(mainTf).toMatch(/name\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment_suffix\}-resources"/);
    });
  });

  describe('Outputs', () => {
    test('outputs VPC ID', () => {
      expect(outputsTf).toContain('output "vpc_id"');
      expect(outputsTf).toContain('aws_vpc.main.id');
    });

    test('outputs ALB DNS name', () => {
      expect(outputsTf).toContain('output "alb_dns_name"');
      expect(outputsTf).toContain('aws_lb.main.dns_name');
    });

    test('outputs RDS endpoint as sensitive', () => {
      expect(outputsTf).toContain('output "rds_endpoint"');
      const rdsOutputSection = outputsTf.substring(
        outputsTf.indexOf('output "rds_endpoint"'),
        outputsTf.indexOf('output "rds_endpoint"') + 300
      );
      expect(rdsOutputSection).toContain('sensitive   = true');
    });

    test('outputs S3 bucket name', () => {
      expect(outputsTf).toContain('output "s3_bucket_name"');
    });

    test('outputs Auto Scaling Group name', () => {
      expect(outputsTf).toContain('output "autoscaling_group_name"');
    });
  });

  describe('Best Practices and Security', () => {
    test('all resource names include environment_suffix', () => {
      // Check that resource names use environment_suffix
      const resourceNamePattern = /Name\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment_suffix\}-/g;
      const matches = mainTf.match(resourceNamePattern);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThan(10);
    });

    test('no hardcoded AWS region values', () => {
      // Should not contain hardcoded regions like "us-east-1" except in data sources
      const hardcodedRegionPattern = /region\s*=\s*"us-east-1"/g;
      const mainTfMatches = mainTf.match(hardcodedRegionPattern);
      // Should only appear in data source if at all, not in resources
      expect(mainTfMatches).toBeNull();
    });

    test('sensitive variables are marked as sensitive', () => {
      const dbUsernameSection = variablesTf.substring(
        variablesTf.indexOf('variable "db_username"'),
        variablesTf.indexOf('variable "db_password"')
      );
      expect(dbUsernameSection).toContain('sensitive');

      const dbPasswordSection = variablesTf.substring(
        variablesTf.indexOf('variable "db_password"'),
        variablesTf.length
      );
      expect(dbPasswordSection).toContain('sensitive');
    });

    test('RDS is in private subnets', () => {
      const rdsSection = mainTf.substring(
        mainTf.indexOf('resource "aws_db_subnet_group" "main"'),
        mainTf.indexOf('resource "aws_db_subnet_group" "main"') + 400
      );
      expect(rdsSection).toContain('aws_subnet.private');
    });

    test('resources are properly tagged with Name', () => {
      // Count resources with Name tags
      const nameTagPattern = /tags\s*=\s*{[\s\S]*?Name\s*=/g;
      const matches = mainTf.match(nameTagPattern);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThan(15);
    });
  });
});
