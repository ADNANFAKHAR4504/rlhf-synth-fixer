import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('Terraform Infrastructure Unit Tests', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  const environmentSuffix = 'test123';

  beforeAll(async () => {
    // Initialize Terraform for testing
    process.env.TF_INIT_OPTS = '-backend=false';
    try {
      const { stdout, stderr } = await execAsync('terraform init -backend=false', { cwd: libPath });
      if (stderr && !stderr.includes('Terraform has been successfully initialized')) {
        console.error('Terraform init error:', stderr);
      }
      console.log('Terraform init successful:', stdout);
    } catch (error) {
      console.error('Terraform init failed:', error);
      throw error;
    }
  }, 60000);

  describe('Terraform Configuration Files', () => {
    test('should have all required Terraform files', () => {
      const requiredFiles = ['main.tf', 'variables.tf', 'outputs.tf', 'provider.tf', 'security-groups.tf'];
      
      requiredFiles.forEach(file => {
        const filePath = path.join(libPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('should have valid HCL syntax in all .tf files', async () => {
      const { stdout, stderr } = await execAsync('terraform validate', { cwd: libPath });
      expect(stderr).toBe('');
      expect(stdout).toContain('Success');
    }, 60000);

    test('should have properly formatted Terraform files', async () => {
      const { stdout, stderr } = await execAsync('terraform fmt -check -recursive', { cwd: libPath });
      expect(stderr).toBe('');
      // Empty stdout means all files are properly formatted
      expect(stdout).toBe('');
    }, 30000);
  });

  describe('Terraform Variables', () => {
    test('should define environment_suffix variable', () => {
      const variablesContent = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf-8');
      expect(variablesContent).toContain('variable "environment_suffix"');
    });

    test('should define common_tags variable with Production environment', () => {
      const variablesContent = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf-8');
      expect(variablesContent).toContain('variable "common_tags"');
      expect(variablesContent).toContain('Environment = "Production"');
    });

    test('should define vpc_cidr variable', () => {
      const variablesContent = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf-8');
      expect(variablesContent).toContain('variable "vpc_cidr"');
      expect(variablesContent).toContain('10.0.0.0/16');
    });

    test('should define public and private subnet variables', () => {
      const variablesContent = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf-8');
      expect(variablesContent).toContain('variable "public_subnets"');
      expect(variablesContent).toContain('variable "private_subnets"');
    });

    test('should set aws_region to us-west-2', () => {
      const variablesContent = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf-8');
      expect(variablesContent).toContain('variable "aws_region"');
      expect(variablesContent).toContain('default     = "us-west-2"');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should define VPC resource with environment suffix in name', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf-8');
      expect(mainContent).toContain('resource "aws_vpc" "main"');
      expect(mainContent).toContain('Name = "main-vpc-${var.environment_suffix}"');
    });

    test('should define Internet Gateway with environment suffix', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf-8');
      expect(mainContent).toContain('resource "aws_internet_gateway" "main"');
      expect(mainContent).toContain('Name = "main-igw-${var.environment_suffix}"');
    });

    test('should define public subnets with proper configuration', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf-8');
      expect(mainContent).toContain('resource "aws_subnet" "public"');
      expect(mainContent).toContain('map_public_ip_on_launch = true');
      expect(mainContent).toContain('Name = "public-subnet-${var.environment_suffix}-${count.index + 1}"');
    });

    test('should define private subnets with proper configuration', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf-8');
      expect(mainContent).toContain('resource "aws_subnet" "private"');
      expect(mainContent).toContain('Name = "private-subnet-${var.environment_suffix}-${count.index + 1}"');
    });

    test('should define NAT Gateways for private subnet connectivity', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf-8');
      expect(mainContent).toContain('resource "aws_nat_gateway" "main"');
      expect(mainContent).toContain('resource "aws_eip" "nat"');
    });

    test('should define route tables for public and private subnets', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf-8');
      expect(mainContent).toContain('resource "aws_route_table" "public"');
      expect(mainContent).toContain('resource "aws_route_table" "private"');
      expect(mainContent).toContain('gateway_id = aws_internet_gateway.main.id');
      expect(mainContent).toContain('nat_gateway_id = aws_nat_gateway.main[count.index].id');
    });
  });

  describe('Security Groups', () => {
    test('should define web security group with HTTP/HTTPS and SSH access', () => {
      const sgContent = fs.readFileSync(path.join(libPath, 'security-groups.tf'), 'utf-8');
      expect(sgContent).toContain('resource "aws_security_group" "web"');
      expect(sgContent).toContain('from_port   = 80');
      expect(sgContent).toContain('from_port   = 443');
      expect(sgContent).toContain('from_port   = 22');
      expect(sgContent).toContain('name_prefix = "web-sg-${var.environment_suffix}-"');
    });

    test('should define database security group with MySQL and PostgreSQL access', () => {
      const sgContent = fs.readFileSync(path.join(libPath, 'security-groups.tf'), 'utf-8');
      expect(sgContent).toContain('resource "aws_security_group" "database"');
      expect(sgContent).toContain('from_port       = 3306');
      expect(sgContent).toContain('from_port       = 5432');
      expect(sgContent).toContain('security_groups = [aws_security_group.web.id]');
    });

    test('should define ALB security group', () => {
      const sgContent = fs.readFileSync(path.join(libPath, 'security-groups.tf'), 'utf-8');
      expect(sgContent).toContain('resource "aws_security_group" "alb"');
      expect(sgContent).toContain('name_prefix = "alb-sg-${var.environment_suffix}-"');
    });

    test('should restrict SSH access to trusted CIDR blocks', () => {
      const sgContent = fs.readFileSync(path.join(libPath, 'security-groups.tf'), 'utf-8');
      expect(sgContent).toContain('cidr_blocks = var.trusted_cidr_blocks');
      expect(sgContent).toContain('description = "SSH access from trusted networks"');
    });
  });

  describe('Terraform Outputs', () => {
    test('should define essential outputs', () => {
      const outputsContent = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf-8');
      const expectedOutputs = [
        'vpc_id',
        'vpc_cidr_block',
        'public_subnet_ids',
        'private_subnet_ids',
        'internet_gateway_id',
        'nat_gateway_ids',
        'web_security_group_id',
        'database_security_group_id',
        'alb_security_group_id'
      ];

      expectedOutputs.forEach(output => {
        expect(outputsContent).toContain(`output "${output}"`);
      });
    });
  });

  describe('Terraform Provider Configuration', () => {
    test('should configure AWS provider with correct region', () => {
      const providerContent = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf-8');
      expect(providerContent).toContain('provider "aws"');
      expect(providerContent).toContain('region = var.aws_region');
    });

    test('should configure S3 backend', () => {
      const providerContent = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf-8');
      expect(providerContent).toContain('backend "s3"');
    });

    test('should set default tags from common_tags variable', () => {
      const providerContent = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf-8');
      expect(providerContent).toContain('default_tags');
      expect(providerContent).toContain('tags = var.common_tags');
    });

    test('should require Terraform version >= 1.4.0', () => {
      const providerContent = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf-8');
      expect(providerContent).toContain('required_version = ">= 1.4.0"');
    });
  });

  describe('Terraform Plan Validation', () => {
    test('should generate a valid terraform plan configuration', async () => {
      // Test that terraform configuration is valid without running actual plan
      const { stdout, stderr } = await execAsync(
        'terraform validate',
        { cwd: libPath }
      );
      
      expect(stderr).toBe('');
      expect(stdout).toContain('Success');
      
      // Check that key resources are defined in main.tf
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf-8');
      expect(mainContent).toContain('resource "aws_vpc"');
      expect(mainContent).toContain('resource "aws_subnet"');
      expect(mainContent).toContain('resource "aws_internet_gateway"');
    }, 60000);

    test('should define resources for multiple availability zones', () => {
      // Check configuration defines multi-AZ resources without running plan
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf-8');
      
      // Should define public and private subnets with count/for_each
      expect(mainContent).toContain('resource "aws_subnet" "public"');
      expect(mainContent).toContain('resource "aws_subnet" "private"');
      
      // Should reference availability zones
      expect(mainContent).toContain('availability_zone');
      
      // Should use count or length function for multiple resources
      const hasCount = mainContent.includes('count = ') || mainContent.includes('for_each');
      expect(hasCount).toBe(true);
    }, 30000);
  });

  describe('Resource Tagging', () => {
    test('should apply environment suffix to all resource names', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf-8');
      const sgContent = fs.readFileSync(path.join(libPath, 'security-groups.tf'), 'utf-8');
      
      // Check that resources use environment_suffix in their names
      const resourcePatterns = [
        'main-vpc-${var.environment_suffix}',
        'main-igw-${var.environment_suffix}',
        'public-subnet-${var.environment_suffix}',
        'private-subnet-${var.environment_suffix}',
        'nat-eip-${var.environment_suffix}',
        'nat-gateway-${var.environment_suffix}',
        'public-route-table-${var.environment_suffix}',
        'private-route-table-${var.environment_suffix}'
      ];

      resourcePatterns.forEach(pattern => {
        expect(mainContent.includes(pattern) || sgContent.includes(pattern)).toBe(true);
      });
    });

    test('should ensure all resources have Production tag via default_tags', () => {
      const providerContent = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf-8');
      const variablesContent = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf-8');
      
      // Provider should use default_tags
      expect(providerContent).toContain('default_tags');
      
      // Variables should define Production tag
      expect(variablesContent).toContain('Environment = "Production"');
    });
  });
});