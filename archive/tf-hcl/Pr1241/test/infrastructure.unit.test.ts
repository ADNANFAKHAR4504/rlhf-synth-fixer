import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure Unit Tests', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  const tfFiles: Map<string, string> = new Map();

  beforeAll(() => {
    // Load all Terraform files
    const files = fs.readdirSync(libPath)
      .filter(file => file.endsWith('.tf'));
    
    files.forEach(file => {
      const content = fs.readFileSync(path.join(libPath, file), 'utf8');
      tfFiles.set(file, content);
    });
  });

  describe('main.tf - Provider Configuration', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = tfFiles.get('main.tf') || '';
    });

    test('should exist and contain terraform configuration', () => {
      expect(mainContent).toBeTruthy();
      expect(mainContent).toContain('terraform {');
    });

    test('should require Terraform version >= 1.0', () => {
      expect(mainContent).toContain('required_version = ">= 1.0"');
    });

    test('should use AWS provider version ~> 5.0', () => {
      expect(mainContent).toContain('source  = "hashicorp/aws"');
      expect(mainContent).toContain('version = "~> 5.0"');
    });

    test('should use Random provider', () => {
      expect(mainContent).toContain('source  = "hashicorp/random"');
      expect(mainContent).toContain('version = "~> 3.0"');
    });

    test('should configure AWS provider with region', () => {
      expect(mainContent).toContain('provider "aws"');
      expect(mainContent).toContain('region = var.region');
    });

    test('should have default tags configured', () => {
      expect(mainContent).toContain('default_tags');
      expect(mainContent).toContain('Environment');
      expect(mainContent).toContain('Project');
      expect(mainContent).toContain('ManagedBy');
      expect(mainContent).toContain('EnvironmentSuffix');
    });

    test('should define data sources', () => {
      expect(mainContent).toContain('data "aws_caller_identity" "current"');
      expect(mainContent).toContain('data "aws_region" "current"');
    });

    test('should define naming convention locals', () => {
      expect(mainContent).toContain('locals {');
      expect(mainContent).toContain('name_prefix');
      expect(mainContent).toContain('environment_suffix');
    });
  });

  describe('variables.tf - Variable Definitions', () => {
    let variablesContent: string;

    beforeAll(() => {
      variablesContent = tfFiles.get('variables.tf') || '';
    });

    test('should exist and contain variable definitions', () => {
      expect(variablesContent).toBeTruthy();
      expect(variablesContent).toContain('variable');
    });

    test('should define region variable with us-east-1 default', () => {
      expect(variablesContent).toContain('variable "region"');
      expect(variablesContent).toContain('default     = "us-east-1"');
    });

    test('should define availability zones for us-east-1', () => {
      expect(variablesContent).toContain('variable "availability_zones"');
      expect(variablesContent).toContain('us-east-1a');
      expect(variablesContent).toContain('us-east-1b');
    });

    test('should define VPC CIDR block', () => {
      expect(variablesContent).toContain('variable "vpc_cidr"');
      expect(variablesContent).toContain('10.0.0.0/16');
    });

    test('should define public subnet CIDRs', () => {
      expect(variablesContent).toContain('variable "public_subnet_cidrs"');
      expect(variablesContent).toContain('10.0.1.0/24');
      expect(variablesContent).toContain('10.0.2.0/24');
    });

    test('should define private subnet CIDRs', () => {
      expect(variablesContent).toContain('variable "private_subnet_cidrs"');
      expect(variablesContent).toContain('10.0.10.0/24');
      expect(variablesContent).toContain('10.0.20.0/24');
    });

    test('should define allowed SSH CIDR as 192.168.1.0/24', () => {
      expect(variablesContent).toContain('variable "allowed_ssh_cidr"');
      expect(variablesContent).toContain('192.168.1.0/24');
    });

    test('should define environment as Production', () => {
      expect(variablesContent).toContain('variable "environment"');
      expect(variablesContent).toContain('Production');
    });

    test('should define project name', () => {
      expect(variablesContent).toContain('variable "project_name"');
      expect(variablesContent).toContain('secure-infrastructure');
    });

    test('should define environment_suffix variable', () => {
      expect(variablesContent).toContain('variable "environment_suffix"');
      expect(variablesContent).toContain('description = "Environment suffix');
    });
  });

  describe('vpc.tf - VPC Resources', () => {
    let vpcContent: string;

    beforeAll(() => {
      vpcContent = tfFiles.get('vpc.tf') || '';
    });

    test('should exist and contain VPC resources', () => {
      expect(vpcContent).toBeTruthy();
      expect(vpcContent).toContain('resource "aws_vpc"');
    });

    test('should create VPC with DNS support enabled', () => {
      expect(vpcContent).toContain('resource "aws_vpc" "main"');
      expect(vpcContent).toContain('enable_dns_hostnames = true');
      expect(vpcContent).toContain('enable_dns_support   = true');
      expect(vpcContent).toContain('cidr_block           = var.vpc_cidr');
    });

    test('should create Internet Gateway', () => {
      expect(vpcContent).toContain('resource "aws_internet_gateway" "main"');
      expect(vpcContent).toContain('vpc_id = aws_vpc.main.id');
    });

    test('should create Elastic IP for NAT', () => {
      expect(vpcContent).toContain('resource "aws_eip" "nat"');
      expect(vpcContent).toContain('domain = "vpc"');
      expect(vpcContent).toContain('depends_on = [aws_internet_gateway.main]');
    });

    test('should create NAT Gateway', () => {
      expect(vpcContent).toContain('resource "aws_nat_gateway" "main"');
      expect(vpcContent).toContain('allocation_id = aws_eip.nat.id');
      expect(vpcContent).toContain('subnet_id     = aws_subnet.public[0].id');
    });

    test('should create public subnets with auto-assign public IP', () => {
      expect(vpcContent).toContain('resource "aws_subnet" "public"');
      expect(vpcContent).toContain('map_public_ip_on_launch = true');
      expect(vpcContent).toContain('count = length(var.public_subnet_cidrs)');
    });

    test('should create private subnets', () => {
      expect(vpcContent).toContain('resource "aws_subnet" "private"');
      expect(vpcContent).toContain('count = length(var.private_subnet_cidrs)');
    });

    test('should create public route table with IGW route', () => {
      expect(vpcContent).toContain('resource "aws_route_table" "public"');
      expect(vpcContent).toContain('gateway_id = aws_internet_gateway.main.id');
      expect(vpcContent).toContain('cidr_block = "0.0.0.0/0"');
    });

    test('should create private route table with NAT route', () => {
      expect(vpcContent).toContain('resource "aws_route_table" "private"');
      expect(vpcContent).toContain('nat_gateway_id = aws_nat_gateway.main.id');
    });

    test('should associate subnets with route tables', () => {
      expect(vpcContent).toContain('resource "aws_route_table_association" "public"');
      expect(vpcContent).toContain('resource "aws_route_table_association" "private"');
    });

    test('should use local.name_prefix for naming', () => {
      expect(vpcContent).toContain('${local.name_prefix}-vpc');
      expect(vpcContent).toContain('${local.name_prefix}-igw');
      expect(vpcContent).toContain('${local.name_prefix}-nat-gateway');
      expect(vpcContent).toContain('${local.name_prefix}-public-subnet');
      expect(vpcContent).toContain('${local.name_prefix}-private-subnet');
    });
  });

  describe('security.tf - Security Resources', () => {
    let securityContent: string;

    beforeAll(() => {
      securityContent = tfFiles.get('security.tf') || '';
    });

    test('should exist and contain security resources', () => {
      expect(securityContent).toBeTruthy();
      expect(securityContent).toContain('resource "aws_security_group"');
    });

    test('should create SSH security group', () => {
      expect(securityContent).toContain('resource "aws_security_group" "ssh_access"');
      expect(securityContent).toContain('description = "Security group allowing SSH access');
    });

    test('should restrict SSH to 192.168.1.0/24', () => {
      expect(securityContent).toContain('ingress {');
      expect(securityContent).toContain('from_port   = 22');
      expect(securityContent).toContain('to_port     = 22');
      expect(securityContent).toContain('protocol    = "tcp"');
      expect(securityContent).toContain('cidr_blocks = [var.allowed_ssh_cidr]');
    });

    test('should allow all egress traffic', () => {
      expect(securityContent).toContain('egress {');
      expect(securityContent).toContain('from_port   = 0');
      expect(securityContent).toContain('to_port     = 0');
      expect(securityContent).toContain('protocol    = "-1"');
      expect(securityContent).toContain('cidr_blocks = ["0.0.0.0/0"]');
    });

    test('should have create_before_destroy lifecycle', () => {
      expect(securityContent).toContain('lifecycle {');
      expect(securityContent).toContain('create_before_destroy = true');
    });

    test('should create S3 VPC Gateway Endpoint', () => {
      expect(securityContent).toContain('resource "aws_vpc_endpoint" "s3"');
      expect(securityContent).toContain('vpc_endpoint_type = "Gateway"');
      expect(securityContent).toContain('service_name      = "com.amazonaws.${data.aws_region.current.name}.s3"');
    });

    test('should associate VPC endpoint with route tables', () => {
      expect(securityContent).toContain('route_table_ids = [');
      expect(securityContent).toContain('aws_route_table.private.id');
      expect(securityContent).toContain('aws_route_table.public.id');
    });

    test('should have VPC endpoint policy for encryption', () => {
      expect(securityContent).toContain('policy = jsonencode');
      expect(securityContent).toContain('s3:x-amz-server-side-encryption');
      expect(securityContent).toContain('AES256');
    });

    test('should use local.name_prefix for naming', () => {
      expect(securityContent).toContain('${local.name_prefix}-ssh');
      expect(securityContent).toContain('${local.name_prefix}-s3-endpoint');
    });
  });

  describe('s3.tf - S3 Resources', () => {
    let s3Content: string;

    beforeAll(() => {
      s3Content = tfFiles.get('s3.tf') || '';
    });

    test('should exist and contain S3 resources', () => {
      expect(s3Content).toBeTruthy();
      expect(s3Content).toContain('resource "aws_s3_bucket"');
    });

    test('should create S3 bucket with unique naming', () => {
      expect(s3Content).toContain('resource "aws_s3_bucket" "secure_bucket"');
      expect(s3Content).toContain('${local.name_prefix}-secure-bucket-${random_id.bucket_suffix.hex}');
    });

    test('should enable force_destroy for cleanup', () => {
      expect(s3Content).toContain('force_destroy = true');
    });

    test('should create random ID for bucket suffix', () => {
      expect(s3Content).toContain('resource "random_id" "bucket_suffix"');
      expect(s3Content).toContain('byte_length = 4');
    });

    test('should enable versioning', () => {
      expect(s3Content).toContain('resource "aws_s3_bucket_versioning" "secure_bucket"');
      expect(s3Content).toContain('status = "Enabled"');
    });

    test('should configure server-side encryption with AES256', () => {
      expect(s3Content).toContain('resource "aws_s3_bucket_server_side_encryption_configuration"');
      expect(s3Content).toContain('sse_algorithm = "AES256"');
      expect(s3Content).toContain('bucket_key_enabled = true');
    });

    test('should block all public access', () => {
      expect(s3Content).toContain('resource "aws_s3_bucket_public_access_block"');
      expect(s3Content).toContain('block_public_acls       = true');
      expect(s3Content).toContain('block_public_policy     = true');
      expect(s3Content).toContain('ignore_public_acls      = true');
      expect(s3Content).toContain('restrict_public_buckets = true');
    });

    test('should have bucket policy denying insecure connections', () => {
      expect(s3Content).toContain('resource "aws_s3_bucket_policy"');
      expect(s3Content).toContain('DenyInsecureConnections');
      expect(s3Content).toContain('aws:SecureTransport');
      expect(s3Content).toContain('"false"');
    });

    test('should have bucket policy denying unencrypted uploads', () => {
      expect(s3Content).toContain('DenyUnencryptedUploads');
      expect(s3Content).toContain('s3:PutObject');
      expect(s3Content).toContain('s3:x-amz-server-side-encryption');
      expect(s3Content).toContain('StringNotEquals');
    });
  });

  describe('outputs.tf - Output Definitions', () => {
    let outputsContent: string;

    beforeAll(() => {
      outputsContent = tfFiles.get('outputs.tf') || '';
    });

    test('should exist and contain output definitions', () => {
      expect(outputsContent).toBeTruthy();
      expect(outputsContent).toContain('output');
    });

    test('should output VPC information', () => {
      expect(outputsContent).toContain('output "vpc_id"');
      expect(outputsContent).toContain('output "vpc_cidr"');
      expect(outputsContent).toContain('value       = aws_vpc.main.id');
    });

    test('should output subnet IDs', () => {
      expect(outputsContent).toContain('output "public_subnet_ids"');
      expect(outputsContent).toContain('output "private_subnet_ids"');
      expect(outputsContent).toContain('aws_subnet.public[*].id');
      expect(outputsContent).toContain('aws_subnet.private[*].id');
    });

    test('should output gateway information', () => {
      expect(outputsContent).toContain('output "internet_gateway_id"');
      expect(outputsContent).toContain('output "nat_gateway_id"');
      expect(outputsContent).toContain('output "nat_gateway_ip"');
    });

    test('should output security group ID', () => {
      expect(outputsContent).toContain('output "ssh_security_group_id"');
      expect(outputsContent).toContain('aws_security_group.ssh_access.id');
    });

    test('should output S3 bucket information', () => {
      expect(outputsContent).toContain('output "s3_bucket_name"');
      expect(outputsContent).toContain('output "s3_bucket_arn"');
      expect(outputsContent).toContain('aws_s3_bucket.secure_bucket.bucket');
      expect(outputsContent).toContain('aws_s3_bucket.secure_bucket.arn');
    });

    test('should output VPC endpoint ID', () => {
      expect(outputsContent).toContain('output "s3_vpc_endpoint_id"');
      expect(outputsContent).toContain('aws_vpc_endpoint.s3.id');
    });

    test('should have descriptions for all outputs', () => {
      const outputMatches = outputsContent.match(/output\s+"[\w_]+"/g) || [];
      const descriptionMatches = outputsContent.match(/description\s+=\s+"/g) || [];
      expect(outputMatches.length).toBeGreaterThan(0);
      expect(descriptionMatches.length).toBe(outputMatches.length);
    });
  });

  describe('Infrastructure Requirements Validation', () => {
    test('should meet requirement 1: Multi-AZ VPC in us-east-1', () => {
      const vpcContent = tfFiles.get('vpc.tf') || '';
      const variablesContent = tfFiles.get('variables.tf') || '';
      
      expect(variablesContent).toContain('us-east-1a');
      expect(variablesContent).toContain('us-east-1b');
      expect(vpcContent).toContain('aws_subnet.public');
      expect(vpcContent).toContain('aws_subnet.private');
    });

    test('should meet requirement 2: NAT Gateway for private subnet internet access', () => {
      const vpcContent = tfFiles.get('vpc.tf') || '';
      expect(vpcContent).toContain('resource "aws_nat_gateway"');
      expect(vpcContent).toContain('resource "aws_eip"');
      expect(vpcContent).toContain('nat_gateway_id = aws_nat_gateway.main.id');
    });

    test('should meet requirement 3: S3 with encryption enforcement', () => {
      const s3Content = tfFiles.get('s3.tf') || '';
      expect(s3Content).toContain('aws_s3_bucket_server_side_encryption_configuration');
      expect(s3Content).toContain('AES256');
      expect(s3Content).toContain('DenyUnencryptedUploads');
    });

    test('should meet requirement 4: SSH restricted to 192.168.1.0/24', () => {
      const securityContent = tfFiles.get('security.tf') || '';
      const variablesContent = tfFiles.get('variables.tf') || '';
      expect(variablesContent).toContain('192.168.1.0/24');
      expect(securityContent).toContain('from_port   = 22');
      expect(securityContent).toContain('to_port     = 22');
    });

    test('should meet requirement 5: Production environment tagging', () => {
      const mainContent = tfFiles.get('main.tf') || '';
      const variablesContent = tfFiles.get('variables.tf') || '';
      expect(variablesContent).toContain('Production');
      expect(mainContent).toContain('Environment');
      expect(mainContent).toContain('default_tags');
    });
  });

  describe('Enhanced Security Features', () => {
    test('should implement S3 VPC Gateway Endpoint', () => {
      const securityContent = tfFiles.get('security.tf') || '';
      expect(securityContent).toContain('aws_vpc_endpoint');
      expect(securityContent).toContain('Gateway');
      expect(securityContent).toContain('com.amazonaws');
    });

    test('should have comprehensive S3 security policies', () => {
      const s3Content = tfFiles.get('s3.tf') || '';
      expect(s3Content).toContain('DenyInsecureConnections');
      expect(s3Content).toContain('aws:SecureTransport');
      expect(s3Content).toContain('block_public_acls');
      expect(s3Content).toContain('versioning');
    });
  });
});