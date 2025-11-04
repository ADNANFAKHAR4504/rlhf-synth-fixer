import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Three-Tier VPC - Unit Tests', () => {
  const terraformDir = path.join(__dirname, '../lib');
  const mainTfPath = path.join(terraformDir, 'main.tf');
  const providerTfPath = path.join(terraformDir, 'provider.tf');

  // Helper function to execute terraform commands
  const execTerraform = (command: string): string => {
    try {
      return execSync(`cd ${terraformDir} && ${command}`, {
        encoding: 'utf-8',
        stdio: 'pipe'
      });
    } catch (error: any) {
      throw new Error(`Terraform command failed: ${error.message}`);
    }
  };

  // Helper function to read file content
  const readFileContent = (filePath: string): string => {
    return fs.readFileSync(filePath, 'utf-8');
  };

  // Helper function to check resource blocks
  const hasResourceBlock = (content: string, resourceType: string, resourceName: string): boolean => {
    const regex = new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"\\s+{`, 'g');
    return regex.test(content);
  };

  describe('File Structure Validation', () => {
    test('should have main.tf file', () => {
      expect(fs.existsSync(mainTfPath)).toBe(true);
    });

    test('should have provider.tf file', () => {
      expect(fs.existsSync(providerTfPath)).toBe(true);
    });

    test('main.tf should not be empty', () => {
      const content = readFileContent(mainTfPath);
      expect(content.length).toBeGreaterThan(0);
    });

    test('provider.tf should not be empty', () => {
      const content = readFileContent(providerTfPath);
      expect(content.length).toBeGreaterThan(0);
    });
  });

  describe('Terraform Syntax Validation', () => {
    test('should pass terraform fmt check', () => {
      expect(() => {
        execTerraform('terraform fmt -check -recursive');
      }).not.toThrow();
    });

    test('should pass terraform validate', () => {
      execTerraform('terraform init -backend=false');
      expect(() => {
        execTerraform('terraform validate');
      }).not.toThrow();
    });

    test('should have valid HCL syntax in main.tf', () => {
      const content = readFileContent(mainTfPath);
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    test('should have valid HCL syntax in provider.tf', () => {
      const content = readFileContent(providerTfPath);
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });
  });

  describe('AWS Provider Configuration', () => {
    test('should use AWS provider version 5.x', () => {
      const content = readFileContent(providerTfPath);
      expect(content).toContain('hashicorp/aws');
      expect(content).toMatch(/version\s*=\s*"~>\s*5\./);
    });

    test('should specify terraform required version', () => {
      const content = readFileContent(providerTfPath);
      expect(content).toContain('required_version');
    });

    test('should have default tags configuration', () => {
      const content = readFileContent(providerTfPath);
      expect(content).toContain('default_tags');
      expect(content).toContain('Environment');
      expect(content).toContain('Project');
      expect(content).toContain('ManagedBy');
    });

    test('should configure aws_region variable', () => {
      const content = readFileContent(providerTfPath);
      // Check that region uses variable (not hardcoded)
      expect(content).toMatch(/region\s*=\s*var\.aws_region/);
      // Check that aws_region variable has us-west-2 default
      expect(content).toMatch(/variable\s+"aws_region"/);
      expect(content).toMatch(/default\s*=\s*"us-west-2"/);
    });

    test('should have required variables defined', () => {
      const content = readFileContent(providerTfPath);
      expect(content).toContain('variable "environmentSuffix"');
      expect(content).toContain('variable "project"');
      expect(content).toContain('variable "costCenter"');
    });
  });

  describe('VPC Configuration', () => {
    const mainContent = readFileContent(mainTfPath);

    test('should have VPC resource', () => {
      expect(hasResourceBlock(mainContent, 'aws_vpc', 'main')).toBe(true);
    });

    test('should use 10.0.0.0/16 CIDR block', () => {
      expect(mainContent).toContain('cidr_block           = "10.0.0.0/16"');
    });

    test('should enable DNS hostnames', () => {
      expect(mainContent).toContain('enable_dns_hostnames = true');
    });

    test('should enable DNS support', () => {
      expect(mainContent).toContain('enable_dns_support   = true');
    });

    test('should have VPC tags', () => {
      const vpcSection = mainContent.match(/resource "aws_vpc" "main"[\s\S]*?(?=\nresource |\ndata |\noutput |$)/);
      expect(vpcSection![0]).toContain('tags');
      expect(vpcSection![0]).toContain('Name');
    });
  });

  describe('Subnet Configuration', () => {
    const mainContent = readFileContent(mainTfPath);

    test('should have 3 public subnets', () => {
      expect(hasResourceBlock(mainContent, 'aws_subnet', 'public')).toBe(true);
      expect(mainContent).toMatch(/count\s*=\s*3/);
    });

    test('should have 3 private subnets', () => {
      expect(hasResourceBlock(mainContent, 'aws_subnet', 'private')).toBe(true);
    });

    test('should have 3 database subnets', () => {
      expect(hasResourceBlock(mainContent, 'aws_subnet', 'database')).toBe(true);
    });

    test('public subnets should use correct CIDR blocks', () => {
      expect(mainContent).toMatch(/cidr_block\s*=\s*"10\.0\.\$\{count\.index \+ 1\}\.0\/24"/);
    });

    test('private subnets should use correct CIDR blocks', () => {
      expect(mainContent).toMatch(/cidr_block\s*=\s*"10\.0\.\$\{count\.index \+ 11\}\.0\/24"/);
    });

    test('database subnets should use correct CIDR blocks', () => {
      expect(mainContent).toMatch(/cidr_block\s*=\s*"10\.0\.\$\{count\.index \+ 21\}\.0\/24"/);
    });

    test('public subnets should map public IP on launch', () => {
      const publicSection = mainContent.match(/resource "aws_subnet" "public"[\s\S]*?(?=\nresource |\ndata |$)/);
      expect(publicSection![0]).toContain('map_public_ip_on_launch = true');
    });

    test('subnets should be tagged with tier information', () => {
      expect(mainContent).toContain('Tier        = "public"');
      expect(mainContent).toContain('Tier        = "application"');
      expect(mainContent).toContain('Tier        = "database"');
    });
  });

  describe('Internet Gateway Configuration', () => {
    const mainContent = readFileContent(mainTfPath);

    test('should have Internet Gateway resource', () => {
      expect(hasResourceBlock(mainContent, 'aws_internet_gateway', 'main')).toBe(true);
    });

    test('Internet Gateway should be attached to VPC', () => {
      const igwSection = mainContent.match(/resource "aws_internet_gateway" "main"[\s\S]*?(?=\nresource |\ndata |$)/);
      expect(igwSection![0]).toContain('vpc_id = aws_vpc.main.id');
    });

    test('Internet Gateway should have tags', () => {
      const igwSection = mainContent.match(/resource "aws_internet_gateway" "main"[\s\S]*?(?=\nresource |\ndata |$)/);
      expect(igwSection![0]).toContain('tags');
    });
  });

  describe('NAT Gateway Configuration', () => {
    const mainContent = readFileContent(mainTfPath);

    test('should have 3 Elastic IPs for NAT Gateways', () => {
      expect(hasResourceBlock(mainContent, 'aws_eip', 'nat')).toBe(true);
      const eipSection = mainContent.match(/resource "aws_eip" "nat"[\s\S]*?(?=\nresource |\ndata |$)/);
      expect(eipSection![0]).toMatch(/count\s*=\s*3/);
    });

    test('Elastic IPs should use VPC domain', () => {
      expect(mainContent).toContain('domain = "vpc"');
    });

    test('should have 3 NAT Gateways', () => {
      expect(hasResourceBlock(mainContent, 'aws_nat_gateway', 'main')).toBe(true);
      const natSection = mainContent.match(/resource "aws_nat_gateway" "main"[\s\S]*?(?=\nresource |\ndata |$)/);
      expect(natSection![0]).toMatch(/count\s*=\s*3/);
    });

    test('NAT Gateways should be in public subnets', () => {
      const natSection = mainContent.match(/resource "aws_nat_gateway" "main"[\s\S]*?(?=\nresource |\ndata |$)/);
      expect(natSection![0]).toContain('subnet_id     = aws_subnet.public[count.index].id');
    });

    test('NAT Gateways should depend on Internet Gateway', () => {
      const natSection = mainContent.match(/resource "aws_nat_gateway" "main"[\s\S]*?(?=\nresource |\ndata |$)/);
      expect(natSection![0]).toContain('depends_on = [aws_internet_gateway.main]');
    });
  });

  describe('Route Table Configuration', () => {
    const mainContent = readFileContent(mainTfPath);

    test('should have public route table', () => {
      expect(hasResourceBlock(mainContent, 'aws_route_table', 'public')).toBe(true);
    });

    test('public route table should route to Internet Gateway', () => {
      const publicRTSection = mainContent.match(/resource "aws_route_table" "public"[\s\S]*?(?=\nresource |\ndata |$)/);
      expect(publicRTSection![0]).toContain('cidr_block = "0.0.0.0/0"');
      expect(publicRTSection![0]).toContain('gateway_id = aws_internet_gateway.main.id');
    });

    test('should have 3 private route tables', () => {
      expect(hasResourceBlock(mainContent, 'aws_route_table', 'private')).toBe(true);
      const privateRTSection = mainContent.match(/resource "aws_route_table" "private"[\s\S]*?(?=\nresource |\ndata |$)/);
      expect(privateRTSection![0]).toMatch(/count\s*=\s*3/);
    });

    test('private route tables should route to NAT Gateways', () => {
      const privateRTSection = mainContent.match(/resource "aws_route_table" "private"[\s\S]*?(?=\nresource |\ndata |$)/);
      expect(privateRTSection![0]).toContain('cidr_block     = "0.0.0.0/0"');
      expect(privateRTSection![0]).toContain('nat_gateway_id = aws_nat_gateway.main[count.index].id');
    });

    test('should have database route table with no internet routes', () => {
      expect(hasResourceBlock(mainContent, 'aws_route_table', 'database')).toBe(true);
      const dbRTSection = mainContent.match(/resource "aws_route_table" "database"[\s\S]*?(?=\nresource |\ndata |$)/);
      // Should NOT contain any internet routes
      expect(dbRTSection![0]).not.toContain('0.0.0.0/0');
      expect(dbRTSection![0]).not.toContain('gateway_id');
      expect(dbRTSection![0]).not.toContain('nat_gateway_id');
    });

    test('should have route table associations for all subnets', () => {
      expect(hasResourceBlock(mainContent, 'aws_route_table_association', 'public')).toBe(true);
      expect(hasResourceBlock(mainContent, 'aws_route_table_association', 'private')).toBe(true);
      expect(hasResourceBlock(mainContent, 'aws_route_table_association', 'database')).toBe(true);
    });
  });

  describe('Network ACL Configuration', () => {
    const mainContent = readFileContent(mainTfPath);

    test('should have Network ACL for database subnets', () => {
      expect(hasResourceBlock(mainContent, 'aws_network_acl', 'database')).toBe(true);
    });

    test('should associate NACL with database subnets', () => {
      const naclSection = mainContent.match(/resource "aws_network_acl" "database"[\s\S]*?(?=\nresource |\ndata |$)/);
      expect(naclSection![0]).toContain('subnet_ids = aws_subnet.database[*].id');
    });

    test('should allow VPC internal traffic inbound', () => {
      const naclSection = mainContent.match(/resource "aws_network_acl" "database"[\s\S]*?(?=\nresource |\ndata |$)/);
      expect(naclSection![0]).toContain('cidr_block = aws_vpc.main.cidr_block');
      expect(naclSection![0]).toContain('action     = "allow"');
    });

    test('should deny all internet inbound traffic', () => {
      const naclSection = mainContent.match(/resource "aws_network_acl" "database"[\s\S]*?(?=\nresource |\ndata |$)/);
      expect(naclSection![0]).toContain('cidr_block = "0.0.0.0/0"');
      expect(naclSection![0]).toContain('action     = "deny"');
    });

    test('should have both ingress and egress rules', () => {
      const naclSection = mainContent.match(/resource "aws_network_acl" "database"[\s\S]*?(?=\nresource |\ndata |$)/);
      expect(naclSection![0]).toContain('ingress {');
      expect(naclSection![0]).toContain('egress {');
    });
  });

  describe('DB Subnet Group Configuration', () => {
    const mainContent = readFileContent(mainTfPath);

    test('should have DB subnet group resource', () => {
      expect(hasResourceBlock(mainContent, 'aws_db_subnet_group', 'main')).toBe(true);
    });

    test('should include all database subnets', () => {
      const dbSubnetGroupSection = mainContent.match(/resource "aws_db_subnet_group" "main"[\s\S]*?(?=\nresource |\ndata |$)/);
      expect(dbSubnetGroupSection![0]).toContain('subnet_ids  = aws_subnet.database[*].id');
    });

    test('should use environmentSuffix in name', () => {
      const dbSubnetGroupSection = mainContent.match(/resource "aws_db_subnet_group" "main"[\s\S]*?(?=\nresource |\ndata |$)/);
      expect(dbSubnetGroupSection![0]).toContain('${var.environmentSuffix}');
    });

    test('should have proper tags', () => {
      const dbSubnetGroupSection = mainContent.match(/resource "aws_db_subnet_group" "main"[\s\S]*?(?=\nresource |\ndata |$)/);
      expect(dbSubnetGroupSection![0]).toContain('tags');
    });
  });

  describe('Data Source Configuration', () => {
    const mainContent = readFileContent(mainTfPath);

    test('should have availability zones data source', () => {
      expect(mainContent).toContain('data "aws_availability_zones" "available"');
    });

    test('should filter for available zones', () => {
      const dataSection = mainContent.match(/data "aws_availability_zones" "available"[\s\S]*?(?=\nresource |\ndata |\noutput |$)/);
      expect(dataSection![0]).toContain('state = "available"');
    });

    test('should filter for us-west-2 zones', () => {
      const dataSection = mainContent.match(/data "aws_availability_zones" "available"[\s\S]*?(?=\nresource |\ndata |\noutput |$)/);
      expect(dataSection![0]).toContain('us-west-2a');
      expect(dataSection![0]).toContain('us-west-2b');
      expect(dataSection![0]).toContain('us-west-2c');
    });
  });

  describe('Naming Convention - environmentSuffix', () => {
    const mainContent = readFileContent(mainTfPath);

    test('should use environmentSuffix in VPC name', () => {
      expect(mainContent).toContain('Name        = "vpc-${var.environmentSuffix}"');
    });

    test('should use environmentSuffix in subnet names', () => {
      expect(mainContent).toContain('${var.environmentSuffix}');
    });

    test('should use environmentSuffix in route table names', () => {
      expect(mainContent).toMatch(/Name\s*=\s*"rt-.*\$\{var\.environmentSuffix\}"/);
    });

    test('should use environmentSuffix in NAT Gateway names', () => {
      expect(mainContent).toMatch(/Name\s*=\s*"nat-gateway.*\$\{var\.environmentSuffix\}"/);
    });
  });

  describe('Outputs Validation', () => {
    const mainContent = readFileContent(mainTfPath);

    test('should have vpc_id output', () => {
      expect(mainContent).toContain('output "vpc_id"');
      expect(mainContent).toContain('aws_vpc.main.id');
    });

    test('should have public_subnet_ids output', () => {
      expect(mainContent).toContain('output "public_subnet_ids"');
      expect(mainContent).toContain('aws_subnet.public[*].id');
    });

    test('should have private_subnet_ids output', () => {
      expect(mainContent).toContain('output "private_subnet_ids"');
      expect(mainContent).toContain('aws_subnet.private[*].id');
    });

    test('should have database_subnet_ids output', () => {
      expect(mainContent).toContain('output "database_subnet_ids"');
      expect(mainContent).toContain('aws_subnet.database[*].id');
    });

    test('should have db_subnet_group_name output', () => {
      expect(mainContent).toContain('output "db_subnet_group_name"');
      expect(mainContent).toContain('aws_db_subnet_group.main.name');
    });

    test('should have nat_gateway_ids output', () => {
      expect(mainContent).toContain('output "nat_gateway_ids"');
      expect(mainContent).toContain('aws_nat_gateway.main[*].id');
    });

    test('should have internet_gateway_id output', () => {
      expect(mainContent).toContain('output "internet_gateway_id"');
      expect(mainContent).toContain('aws_internet_gateway.main.id');
    });

    test('all outputs should have descriptions', () => {
      const outputBlocks = mainContent.match(/output\s+"[^"]+"\s+\{[\s\S]*?\n\}/g) || [];
      expect(outputBlocks.length).toBeGreaterThan(0);
      outputBlocks.forEach(block => {
        expect(block).toContain('description');
      });
    });
  });

  describe('Compliance and Tagging', () => {
    const mainContent = readFileContent(mainTfPath);

    test('should have tags on VPC', () => {
      const vpcSection = mainContent.match(/resource "aws_vpc" "main"[\s\S]*?(?=\nresource |\ndata |$)/);
      expect(vpcSection![0]).toContain('tags');
      expect(vpcSection![0]).toContain('Environment');
    });

    test('should have tags on all subnet types', () => {
      expect(mainContent).toMatch(/resource "aws_subnet" "public"[\s\S]*?tags/);
      expect(mainContent).toMatch(/resource "aws_subnet" "private"[\s\S]*?tags/);
      expect(mainContent).toMatch(/resource "aws_subnet" "database"[\s\S]*?tags/);
    });

    test('should have CostCenter tag for billing', () => {
      expect(mainContent).toContain('CostCenter');
    });

    test('should have Project tag', () => {
      expect(mainContent).toContain('Project');
    });
  });

  describe('Security Best Practices', () => {
    const mainContent = readFileContent(mainTfPath);

    test('database subnets should have no internet connectivity', () => {
      const dbRTSection = mainContent.match(/resource "aws_route_table" "database"[\s\S]*?(?=\nresource |\ndata |$)/);
      expect(dbRTSection![0]).not.toContain('0.0.0.0/0');
    });

    test('should not have hardcoded credentials', () => {
      expect(mainContent).not.toMatch(/access_key\s*=/);
      expect(mainContent).not.toMatch(/secret_key\s*=/);
    });

    test('private subnets should use NAT for outbound only', () => {
      const privateRTSection = mainContent.match(/resource "aws_route_table" "private"[\s\S]*?(?=\nresource |\ndata |$)/);
      expect(privateRTSection![0]).toContain('nat_gateway_id');
    });

    test('should use count for multi-AZ deployment', () => {
      expect(mainContent).toMatch(/count\s*=\s*3/);
    });
  });
});
