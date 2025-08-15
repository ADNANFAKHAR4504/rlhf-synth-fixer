import * as fs from 'fs';
import * as path from 'path';
import * as HCL from 'hcl2-parser';

describe('Terraform Infrastructure Unit Tests', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  
  describe('Provider Configuration', () => {
    let providerContent: string;
    
    beforeAll(() => {
      providerContent = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');
    });
    
    test('should have AWS provider configured', () => {
      expect(providerContent).toContain('provider "aws"');
    });
    
    test('should have S3 backend configured', () => {
      expect(providerContent).toContain('backend "s3"');
    });
    
    test('should require Terraform version >= 1.4.0', () => {
      expect(providerContent).toContain('required_version');
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
    });
    
    test('should require AWS provider version >= 5.0', () => {
      expect(providerContent).toContain('hashicorp/aws');
      expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });
  });
  
  describe('Variables Configuration', () => {
    let variablesContent: string;
    
    beforeAll(() => {
      variablesContent = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');
    });
    
    test('should define aws_region variable with default us-east-1', () => {
      expect(variablesContent).toContain('variable "aws_region"');
      expect(variablesContent).toContain('default     = "us-east-1"');
    });
    
    test('should define environment variable with validation', () => {
      expect(variablesContent).toContain('variable "environment"');
      expect(variablesContent).toContain('validation');
      expect(variablesContent).toContain('["dev", "prod"]');
    });
    
    test('should define environment_suffix variable', () => {
      expect(variablesContent).toContain('variable "environment_suffix"');
    });
    
    test('should define VPC CIDR variable', () => {
      expect(variablesContent).toContain('variable "vpc_cidr"');
      expect(variablesContent).toContain('10.0.0.0/16');
    });
    
    test('should define availability zones variable', () => {
      expect(variablesContent).toContain('variable "availability_zones"');
      expect(variablesContent).toContain('["us-east-1a", "us-east-1b"]');
    });
    
    test('should define Auto Scaling variables', () => {
      expect(variablesContent).toContain('variable "min_size"');
      expect(variablesContent).toContain('variable "max_size"');
      expect(variablesContent).toContain('variable "desired_capacity"');
    });
    
    test('should define database variables', () => {
      expect(variablesContent).toContain('variable "db_instance_class"');
      expect(variablesContent).toContain('variable "db_name"');
      expect(variablesContent).toContain('variable "db_username"');
    });
  });
  
  describe('Main Infrastructure Stack', () => {
    let tapStackContent: string;
    
    beforeAll(() => {
      tapStackContent = fs.readFileSync(path.join(libPath, 'tap_stack.tf'), 'utf8');
    });
    
    describe('VPC Configuration', () => {
      test('should create VPC with proper CIDR', () => {
        expect(tapStackContent).toContain('resource "aws_vpc" "main"');
        expect(tapStackContent).toContain('cidr_block           = var.vpc_cidr');
        expect(tapStackContent).toContain('enable_dns_hostnames = true');
        expect(tapStackContent).toContain('enable_dns_support   = true');
      });
      
      test('should create Internet Gateway', () => {
        expect(tapStackContent).toContain('resource "aws_internet_gateway" "main"');
        expect(tapStackContent).toContain('vpc_id = aws_vpc.main.id');
      });
      
      test('should create public subnets', () => {
        expect(tapStackContent).toContain('resource "aws_subnet" "public"');
        expect(tapStackContent).toContain('map_public_ip_on_launch = true');
      });
      
      test('should create private subnets', () => {
        expect(tapStackContent).toContain('resource "aws_subnet" "private"');
      });
      
      test('should create database subnets', () => {
        expect(tapStackContent).toContain('resource "aws_subnet" "database"');
      });
      
      test('should create NAT Gateways', () => {
        expect(tapStackContent).toContain('resource "aws_nat_gateway" "main"');
        expect(tapStackContent).toContain('resource "aws_eip" "nat"');
      });
      
      test('should create route tables', () => {
        expect(tapStackContent).toContain('resource "aws_route_table" "public"');
        expect(tapStackContent).toContain('resource "aws_route_table" "private"');
      });
    });
    
    describe('Security Groups', () => {
      test('should create ALB security group', () => {
        expect(tapStackContent).toContain('resource "aws_security_group" "alb"');
        expect(tapStackContent).toMatch(/from_port\s*=\s*80/);
        expect(tapStackContent).toMatch(/from_port\s*=\s*443/);
      });
      
      test('should create web security group', () => {
        expect(tapStackContent).toContain('resource "aws_security_group" "web"');
        expect(tapStackContent).toContain('security_groups = [aws_security_group.alb.id]');
      });
      
      test('should create database security group', () => {
        expect(tapStackContent).toContain('resource "aws_security_group" "database"');
        expect(tapStackContent).toMatch(/from_port\s*=\s*3306/);
      });
    });
    
    describe('Load Balancer Configuration', () => {
      test('should create Application Load Balancer', () => {
        expect(tapStackContent).toContain('resource "aws_lb" "main"');
        expect(tapStackContent).toContain('load_balancer_type = "application"');
        expect(tapStackContent).toContain('enable_deletion_protection = false');
      });
      
      test('should create target group with health check', () => {
        expect(tapStackContent).toContain('resource "aws_lb_target_group" "main"');
        expect(tapStackContent).toContain('health_check');
        expect(tapStackContent).toContain('path                = "/health"');
        expect(tapStackContent).toContain('matcher             = "200"');
      });
      
      test('should create HTTP listener', () => {
        expect(tapStackContent).toContain('resource "aws_lb_listener" "main"');
        expect(tapStackContent).toContain('port              = "80"');
        expect(tapStackContent).toContain('protocol          = "HTTP"');
      });
      
      test('should have HTTPS listener disabled', () => {
        expect(tapStackContent).toContain('resource "aws_lb_listener" "https"');
        expect(tapStackContent).toContain('count = 0');
      });
    });
    
    describe('Auto Scaling Configuration', () => {
      test('should create launch template', () => {
        expect(tapStackContent).toContain('resource "aws_launch_template" "main"');
        expect(tapStackContent).toContain('instance_type = var.instance_type');
        expect(tapStackContent).toContain('user_data = base64encode');
      });
      
      test('should create Auto Scaling Group', () => {
        expect(tapStackContent).toContain('resource "aws_autoscaling_group" "main"');
        expect(tapStackContent).toContain('min_size');
        expect(tapStackContent).toContain('max_size');
        expect(tapStackContent).toContain('desired_capacity');
        expect(tapStackContent).toContain('health_check_type');
        expect(tapStackContent).toContain('"ELB"');
      });
      
      test('should create scaling policies', () => {
        expect(tapStackContent).toContain('resource "aws_autoscaling_policy" "scale_up"');
        expect(tapStackContent).toContain('resource "aws_autoscaling_policy" "scale_down"');
        expect(tapStackContent).toContain('scaling_adjustment     = 2');
        expect(tapStackContent).toContain('scaling_adjustment     = -1');
      });
      
      test('should create CloudWatch alarms', () => {
        expect(tapStackContent).toContain('resource "aws_cloudwatch_metric_alarm" "cpu_high"');
        expect(tapStackContent).toContain('resource "aws_cloudwatch_metric_alarm" "cpu_low"');
        expect(tapStackContent).toContain('threshold           = "70"');
        expect(tapStackContent).toContain('threshold           = "30"');
      });
    });
    
    describe('RDS Database Configuration', () => {
      test('should create DB subnet group', () => {
        expect(tapStackContent).toContain('resource "aws_db_subnet_group" "main"');
        expect(tapStackContent).toContain('subnet_ids = aws_subnet.database[*].id');
      });
      
      test('should create RDS instance', () => {
        expect(tapStackContent).toContain('resource "aws_db_instance" "main"');
        expect(tapStackContent).toContain('engine');
        expect(tapStackContent).toContain('"mysql"');
        expect(tapStackContent).toContain('engine_version');
        expect(tapStackContent).toContain('"8.0"');
      });
      
      test('should have database security configured', () => {
        expect(tapStackContent).toContain('storage_encrypted = true');
        expect(tapStackContent).toContain('skip_final_snapshot       = true');
      });
      
      test('should use Secrets Manager for password', () => {
        expect(tapStackContent).toContain('resource "aws_secretsmanager_secret" "db_password"');
        expect(tapStackContent).toContain('resource "random_password" "db_password"');
      });
    });
    
    describe('Resource Naming Convention', () => {
      test('should use environment_suffix in resource names', () => {
        const envSuffixPattern = /\$\{var\.environment_suffix\}/g;
        const matches = tapStackContent.match(envSuffixPattern);
        expect(matches).not.toBeNull();
        expect(matches!.length).toBeGreaterThan(20);
      });
      
      test('should not have hardcoded environment names', () => {
        expect(tapStackContent).not.toContain('-dev-');
        expect(tapStackContent).not.toContain('-prod-');
      });
    });
  });
  
  describe('Outputs Configuration', () => {
    let outputsContent: string;
    
    beforeAll(() => {
      outputsContent = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');
    });
    
    test('should output VPC ID', () => {
      expect(outputsContent).toContain('output "vpc_id"');
      expect(outputsContent).toContain('value       = aws_vpc.main.id');
    });
    
    test('should output load balancer DNS', () => {
      expect(outputsContent).toContain('output "load_balancer_dns"');
      expect(outputsContent).toContain('value       = aws_lb.main.dns_name');
    });
    
    test('should output database endpoint as sensitive', () => {
      expect(outputsContent).toContain('output "database_endpoint"');
      expect(outputsContent).toContain('sensitive   = true');
    });
    
    test('should output subnet IDs', () => {
      expect(outputsContent).toContain('output "public_subnets"');
      expect(outputsContent).toContain('output "private_subnets"');
      expect(outputsContent).toContain('output "database_subnets"');
    });
    
    test('should output security group IDs', () => {
      expect(outputsContent).toContain('output "security_group_alb_id"');
      expect(outputsContent).toContain('output "security_group_web_id"');
      expect(outputsContent).toContain('output "security_group_db_id"');
    });
    
    test('should output Auto Scaling Group name', () => {
      expect(outputsContent).toContain('output "autoscaling_group_name"');
    });
  });
  
  describe('User Data Script', () => {
    let userDataContent: string;
    
    beforeAll(() => {
      userDataContent = fs.readFileSync(path.join(libPath, 'user_data.sh'), 'utf8');
    });
    
    test('should install and configure Apache', () => {
      expect(userDataContent).toContain('yum install -y httpd');
      expect(userDataContent).toContain('systemctl start httpd');
      expect(userDataContent).toContain('systemctl enable httpd');
    });
    
    test('should create health check endpoint', () => {
      expect(userDataContent).toContain('/var/www/html/health');
      expect(userDataContent).toContain('OK');
    });
    
    test('should create index page with template variables', () => {
      expect(userDataContent).toContain('/var/www/html/index.html');
      expect(userDataContent).toContain('${app_name}');
      expect(userDataContent).toContain('${environment}');
    });
  });
  
  describe('Infrastructure Compliance', () => {
    let tapStackContent: string;
    
    beforeAll(() => {
      tapStackContent = fs.readFileSync(path.join(libPath, 'tap_stack.tf'), 'utf8');
    });
    
    test('should have all resources tagged appropriately', () => {
      const resourcePattern = /resource\s+"aws_[^"]+"\s+"[^"]+"/g;
      const resources = tapStackContent.match(resourcePattern) || [];
      
      const taggableResources = resources.filter(r => 
        !r.includes('aws_route_table_association') &&
        !r.includes('aws_db_subnet_group') &&
        !r.includes('aws_secretsmanager_secret_version') &&
        !r.includes('aws_autoscaling_policy') &&
        !r.includes('aws_cloudwatch_metric_alarm') &&
        !r.includes('aws_lb_listener') &&
        !r.includes('random_password') &&
        !r.includes('aws_lb_listener_rule') &&
        !r.includes('aws_acm_certificate_validation')
      );
      
      taggableResources.forEach(resource => {
        const resourceName = resource.match(/"([^"]+)"\s*$/)?.[1];
        const resourceRegex = new RegExp(`resource\\s+"[^"]+"\\s+"${resourceName}"[\\s\\S]*?(?=resource|$)`, 'g');
        const resourceBlock = tapStackContent.match(resourceRegex)?.[0];
        
        if (resourceBlock && !resourceBlock.includes('aws_route') && !resourceBlock.includes('random_password')) {
          expect(resourceBlock).toContain('tags');
        }
      });
    });
    
    test('should have multi-AZ configuration for production resources', () => {
      expect(tapStackContent).toContain('multi_az');
    });
    
    test('should have backup configuration for RDS', () => {
      expect(tapStackContent).toContain('backup_retention_period');
      expect(tapStackContent).toContain('backup_window');
    });
    
    test('should have monitoring configured', () => {
      expect(tapStackContent).toContain('aws_cloudwatch_metric_alarm');
      expect(tapStackContent).toContain('CPUUtilization');
    });
  });
});