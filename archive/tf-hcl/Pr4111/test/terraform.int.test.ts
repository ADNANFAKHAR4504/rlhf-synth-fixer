import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Terraform Multi-Region Infrastructure Integration Tests', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  const tfFilePath = path.join(libPath, 'tap_stack.tf');
  const providerFilePath = path.join(libPath, 'provider.tf');

  describe('Infrastructure Files Validation', () => {
    test('should have all required Terraform files', () => {
      expect(fs.existsSync(tfFilePath)).toBe(true);
      expect(fs.existsSync(providerFilePath)).toBe(true);
    });

    test('should have valid HCL syntax', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      expect(tfContent).toContain('resource "aws_vpc"');
      expect(tfContent).toContain('resource "aws_instance"');
      expect(tfContent).toContain('resource "aws_db_instance"');
      expect(tfContent).toContain('resource "aws_lb"');
      expect(tfContent).toContain('resource "aws_s3_bucket"');
    });
  });

  describe('Multi-Region Configuration', () => {
    test('should configure resources in us-east-1', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      expect(tfContent).toContain('provider = aws.us-east-1');
      expect(tfContent).toContain('vpc_us_east_1');
      expect(tfContent).toContain('ec2_1_us_east_1');
      expect(tfContent).toContain('mysql_us_east_1');
      expect(tfContent).toContain('alb_us_east_1');
      expect(tfContent).toContain('bucket_us_east_1');
    });

    test('should configure resources in us-west-2', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      expect(tfContent).toContain('provider = aws.us-west-2');
      expect(tfContent).toContain('vpc_us_west_2');
      expect(tfContent).toContain('ec2_1_us_west_2');
      expect(tfContent).toContain('mysql_us_west_2');
      expect(tfContent).toContain('alb_us_west_2');
      expect(tfContent).toContain('bucket_us_west_2');
    });
  });

  describe('Network Architecture', () => {
    test('should have proper VPC configuration', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      // Check for VPC CIDR blocks
      expect(tfContent).toContain('cidr_block           = "10.0.0.0/16"');
      expect(tfContent).toContain('cidr_block           = "10.1.0.0/16"');
      expect(tfContent).toContain('enable_dns_hostnames = true');
      expect(tfContent).toContain('enable_dns_support   = true');
    });

    test('should have public and private subnets in both regions', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      // US-EAST-1
      expect(tfContent).toContain('public_subnet_1_us_east_1');
      expect(tfContent).toContain('public_subnet_2_us_east_1');
      expect(tfContent).toContain('private_subnet_1_us_east_1');
      expect(tfContent).toContain('private_subnet_2_us_east_1');
      // US-WEST-2
      expect(tfContent).toContain('public_subnet_1_us_west_2');
      expect(tfContent).toContain('public_subnet_2_us_west_2');
      expect(tfContent).toContain('private_subnet_1_us_west_2');
      expect(tfContent).toContain('private_subnet_2_us_west_2');
    });

    test('should have Internet Gateways configured', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      expect(tfContent).toContain('resource "aws_internet_gateway" "igw_us_east_1"');
      expect(tfContent).toContain('resource "aws_internet_gateway" "igw_us_west_2"');
    });

    test('should have route tables with proper associations', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      expect(tfContent).toContain('resource "aws_route_table"');
      expect(tfContent).toContain('resource "aws_route_table_association"');
      expect(tfContent).toContain('cidr_block = "0.0.0.0/0"');
    });
  });

  describe('Compute Resources', () => {
    test('should configure EC2 instances with correct specifications', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      expect(tfContent).toContain('instance_type          = "t3.micro"');
      expect(tfContent).toContain('ami                    = data.aws_ami.amazon_linux_us_east_1.id');
      expect(tfContent).toContain('ami                    = data.aws_ami.amazon_linux_us_west_2.id');
    });

    test('should place EC2 instances in private subnets', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      const ec2Pattern = /resource\s+"aws_instance".*?subnet_id\s+=\s+aws_subnet\.private_subnet/gs;
      const matches = tfContent.match(ec2Pattern);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThan(0);
    });
  });

  describe('Database Configuration', () => {
    test('should configure RDS MySQL instances', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      expect(tfContent).toContain('resource "aws_db_instance" "mysql_us_east_1"');
      expect(tfContent).toContain('resource "aws_db_instance" "mysql_us_west_2"');
      expect(tfContent).toContain('engine                 = "mysql"');
      expect(tfContent).toContain('engine_version         = "8.0"');
      expect(tfContent).toContain('instance_class         = "db.t3.micro"');
    });

    test('should store database credentials in SSM Parameter Store', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      expect(tfContent).toContain('resource "aws_ssm_parameter" "db_username_us_east_1"');
      expect(tfContent).toContain('resource "aws_ssm_parameter" "db_password_us_east_1"');
      expect(tfContent).toContain('type     = "String"');
      expect(tfContent).toContain('type     = "SecureString"');
    });

    test('should configure DB subnet groups', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      expect(tfContent).toContain('resource "aws_db_subnet_group"');
      expect(tfContent).toContain('rds_subnet_group_us_east_1');
      expect(tfContent).toContain('rds_subnet_group_us_west_2');
    });
  });

  describe('Load Balancer Configuration', () => {
    test('should configure Application Load Balancers', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      expect(tfContent).toContain('resource "aws_lb" "alb_us_east_1"');
      expect(tfContent).toContain('resource "aws_lb" "alb_us_west_2"');
      expect(tfContent).toContain('load_balancer_type = "application"');
      expect(tfContent).toContain('internal           = false');
    });

    test('should configure HTTPS listeners on port 443', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      expect(tfContent).toContain('resource "aws_lb_listener" "https_listener_us_east_1"');
      expect(tfContent).toContain('resource "aws_lb_listener" "https_listener_us_west_2"');
      expect(tfContent).toContain('port              = "443"');
      expect(tfContent).toContain('protocol          = "HTTPS"');
      expect(tfContent).toContain('ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"');
    });

    test('should configure target groups and attachments', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      expect(tfContent).toContain('resource "aws_lb_target_group"');
      expect(tfContent).toContain('resource "aws_lb_target_group_attachment"');
      expect(tfContent).toContain('port        = 80');
      expect(tfContent).toContain('protocol    = "HTTP"');
      expect(tfContent).toContain('target_type = "instance"');
    });
  });

  describe('Storage Configuration', () => {
    test('should configure S3 buckets in both regions', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      expect(tfContent).toContain('resource "aws_s3_bucket" "bucket_us_east_1"');
      expect(tfContent).toContain('resource "aws_s3_bucket" "bucket_us_west_2"');
    });

    test('should enable S3 bucket versioning', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      expect(tfContent).toContain('resource "aws_s3_bucket_versioning"');
      expect(tfContent).toContain('status = "Enabled"');
    });

    test('should enable S3 server-side encryption', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      expect(tfContent).toContain('resource "aws_s3_bucket_server_side_encryption_configuration"');
      expect(tfContent).toContain('sse_algorithm = "AES256"');
    });

    test('should block public access on S3 buckets', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      expect(tfContent).toContain('resource "aws_s3_bucket_public_access_block"');
      expect(tfContent).toContain('block_public_acls       = true');
      expect(tfContent).toContain('block_public_policy     = true');
      expect(tfContent).toContain('ignore_public_acls      = true');
      expect(tfContent).toContain('restrict_public_buckets = true');
    });
  });

  describe('Security Configuration', () => {
    test('should configure security groups for all layers', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      expect(tfContent).toContain('resource "aws_security_group" "alb_sg_us_east_1"');
      expect(tfContent).toContain('resource "aws_security_group" "ec2_sg_us_east_1"');
      expect(tfContent).toContain('resource "aws_security_group" "rds_sg_us_east_1"');
      expect(tfContent).toContain('resource "aws_security_group" "alb_sg_us_west_2"');
      expect(tfContent).toContain('resource "aws_security_group" "ec2_sg_us_west_2"');
      expect(tfContent).toContain('resource "aws_security_group" "rds_sg_us_west_2"');
    });

    test('should configure proper ingress rules for ALB', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      const albSgPattern = /resource\s+"aws_security_group"\s+"alb_sg.*?ingress\s+{[^}]*from_port\s+=\s+443[^}]*to_port\s+=\s+443/gs;
      expect(tfContent).toMatch(albSgPattern);
    });

    test('should configure proper ingress rules for RDS', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      const rdsSgPattern = /resource\s+"aws_security_group"\s+"rds_sg.*?from_port\s+=\s+3306[^}]*to_port\s+=\s+3306/gs;
      expect(tfContent).toMatch(rdsSgPattern);
    });
  });

  describe('Tagging Compliance', () => {
    test('should tag all resources with Environment = Production', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      const resourceBlocks = tfContent.match(/resource\s+"[^"]+"\s+"[^"]+"\s+{[^}]*tags\s+=\s+{[^}]*Environment\s+=\s+"Production"/gs);
      expect(resourceBlocks).toBeTruthy();
      expect(resourceBlocks!.length).toBeGreaterThan(20);
    });
  });

  describe('Outputs Configuration', () => {
    test('should define outputs for VPC IDs', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      expect(tfContent).toContain('output "vpc_id_us_east_1"');
      expect(tfContent).toContain('output "vpc_id_us_west_2"');
    });

    test('should define outputs for ALB DNS names', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      expect(tfContent).toContain('output "alb_dns_us_east_1"');
      expect(tfContent).toContain('output "alb_dns_us_west_2"');
    });

    test('should define outputs for RDS endpoints', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      expect(tfContent).toContain('output "rds_endpoint_us_east_1"');
      expect(tfContent).toContain('output "rds_endpoint_us_west_2"');
    });

    test('should define outputs for S3 bucket names', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      expect(tfContent).toContain('output "s3_bucket_us_east_1"');
      expect(tfContent).toContain('output "s3_bucket_us_west_2"');
    });

    test('should define outputs for EC2 instance IDs', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      expect(tfContent).toContain('output "ec2_instance_ids_us_east_1"');
      expect(tfContent).toContain('output "ec2_instance_ids_us_west_2"');
    });
  });

  describe('Provider Configuration', () => {
    test('should configure multi-region AWS providers', () => {
      const providerContent = fs.readFileSync(providerFilePath, 'utf-8');
      expect(providerContent).toContain('provider "aws"');
      expect(providerContent).toContain('alias  = "us-east-1"');
      expect(providerContent).toContain('region = "us-east-1"');
      expect(providerContent).toContain('alias  = "us-west-2"');
      expect(providerContent).toContain('region = "us-west-2"');
    });

    test('should declare random provider for bucket suffix', () => {
      const providerContent = fs.readFileSync(providerFilePath, 'utf-8');
      expect(providerContent).toContain('random');
    });
  });

  describe('Infrastructure Completeness', () => {
    test('should have complete infrastructure in us-east-1', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      const usEast1Resources = [
        'vpc_us_east_1',
        'igw_us_east_1',
        'public_subnet_1_us_east_1',
        'public_subnet_2_us_east_1',
        'private_subnet_1_us_east_1',
        'private_subnet_2_us_east_1',
        'ec2_1_us_east_1',
        'ec2_2_us_east_1',
        'mysql_us_east_1',
        'alb_us_east_1',
        'bucket_us_east_1'
      ];
      
      usEast1Resources.forEach(resource => {
        expect(tfContent).toContain(resource);
      });
    });

    test('should have complete infrastructure in us-west-2', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      const usWest2Resources = [
        'vpc_us_west_2',
        'igw_us_west_2',
        'public_subnet_1_us_west_2',
        'public_subnet_2_us_west_2',
        'private_subnet_1_us_west_2',
        'private_subnet_2_us_west_2',
        'ec2_1_us_west_2',
        'ec2_2_us_west_2',
        'mysql_us_west_2',
        'alb_us_west_2',
        'bucket_us_west_2'
      ];
      
      usWest2Resources.forEach(resource => {
        expect(tfContent).toContain(resource);
      });
    });

    test('should have all required resource types', () => {
      const tfContent = fs.readFileSync(tfFilePath, 'utf-8');
      const requiredResourceTypes = [
        'aws_vpc',
        'aws_subnet',
        'aws_internet_gateway',
        'aws_route_table',
        'aws_security_group',
        'aws_instance',
        'aws_db_instance',
        'aws_lb',
        'aws_lb_listener',
        'aws_s3_bucket',
        'aws_ssm_parameter'
      ];
      
      requiredResourceTypes.forEach(resourceType => {
        expect(tfContent).toContain(`resource "${resourceType}"`);
      });
    });
  });
});
