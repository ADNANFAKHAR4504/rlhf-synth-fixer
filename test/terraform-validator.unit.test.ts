import * as fs from 'fs';
import * as path from 'path';
import { TerraformConfigValidator } from '../lib/terraform-validator';

const LIB_DIR = path.resolve(__dirname, '../lib');

describe('TerraformConfigValidator Unit Tests', () => {
  let validator: TerraformConfigValidator;

  beforeEach(() => {
    validator = new TerraformConfigValidator(LIB_DIR);
  });

  describe('constructor and initialization', () => {
    test('initializes with default lib directory', () => {
      const defaultValidator = new TerraformConfigValidator();
      expect(defaultValidator).toBeDefined();
    });

    test('initializes with custom lib directory', () => {
      const customValidator = new TerraformConfigValidator(LIB_DIR);
      expect(customValidator).toBeDefined();
    });
  });

  describe('readTerraformFile', () => {
    test('successfully reads existing Terraform file', () => {
      const file = validator.readTerraformFile('provider.tf');
      expect(file.name).toBe('provider.tf');
      expect(file.path).toContain('provider.tf');
      expect(file.content).toBeTruthy();
      expect(file.content.length).toBeGreaterThan(0);
    });

    test('throws error when reading non-existent file', () => {
      expect(() => {
        validator.readTerraformFile('non-existent.tf');
      }).toThrow();
    });

    test('reads all required files successfully', () => {
      const files = ['provider.tf', 'variables.tf', 'vpc.tf', 'network_acl.tf', 'flow_logs.tf', 'outputs.tf'];
      files.forEach(filename => {
        const file = validator.readTerraformFile(filename);
        expect(file.name).toBe(filename);
        expect(file.content).toBeTruthy();
      });
    });
  });

  describe('validateRequiredFiles', () => {
    test('validates that all required files exist', () => {
      const result = validator.validateRequiredFiles();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    test('returns proper structure', () => {
      const result = validator.validateRequiredFiles();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('validateVPC', () => {
    test('successfully validates VPC configuration', () => {
      const result = validator.validateVPC();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('detects VPC resource', () => {
      const result = validator.validateVPC();
      expect(result.valid).toBe(true);
      const vpcFile = validator.readTerraformFile('vpc.tf');
      expect(vpcFile.content).toContain('resource "aws_vpc" "main"');
    });

    test('validates DNS settings', () => {
      const vpcFile = validator.readTerraformFile('vpc.tf');
      expect(vpcFile.content).toContain('enable_dns_support');
      expect(vpcFile.content).toContain('enable_dns_hostnames');
    });

    test('validates environment_suffix usage', () => {
      const vpcFile = validator.readTerraformFile('vpc.tf');
      expect(vpcFile.content).toContain('${var.environment_suffix}');
    });

    test('validates subnet counts', () => {
      const vpcFile = validator.readTerraformFile('vpc.tf');
      expect(vpcFile.content).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{\s*count\s*=\s*3/);
      expect(vpcFile.content).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{\s*count\s*=\s*3/);
    });

    test('validates NAT Gateway count', () => {
      const vpcFile = validator.readTerraformFile('vpc.tf');
      expect(vpcFile.content).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{\s*count\s*=\s*3/);
    });

    test('validates no prevent_destroy lifecycle', () => {
      const vpcFile = validator.readTerraformFile('vpc.tf');
      expect(vpcFile.content).not.toContain('prevent_destroy = true');
    });

    test('returns validation result structure', () => {
      const result = validator.validateVPC();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
    });
  });

  describe('validateNetworkACL', () => {
    test('successfully validates Network ACL configuration', () => {
      const result = validator.validateNetworkACL();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('validates HTTP port 80 allowance', () => {
      const naclFile = validator.readTerraformFile('network_acl.tf');
      expect(naclFile.content).toMatch(/from_port\s*=\s*80/);
    });

    test('validates HTTPS port 443 allowance', () => {
      const naclFile = validator.readTerraformFile('network_acl.tf');
      expect(naclFile.content).toMatch(/from_port\s*=\s*443/);
    });

    test('validates ephemeral ports allowance', () => {
      const naclFile = validator.readTerraformFile('network_acl.tf');
      expect(naclFile.content).toMatch(/from_port\s*=\s*1024/);
    });

    test('returns validation result structure', () => {
      const result = validator.validateNetworkACL();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
    });
  });

  describe('validateFlowLogs', () => {
    test('successfully validates Flow Logs configuration', () => {
      const result = validator.validateFlowLogs();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('validates CloudWatch Log Group', () => {
      const flowLogsFile = validator.readTerraformFile('flow_logs.tf');
      expect(flowLogsFile.content).toContain('resource "aws_cloudwatch_log_group" "flow_logs"');
    });

    test('validates 7-day retention', () => {
      const flowLogsFile = validator.readTerraformFile('flow_logs.tf');
      expect(flowLogsFile.content).toMatch(/retention_in_days\s*=\s*7/);
    });

    test('validates IAM role', () => {
      const flowLogsFile = validator.readTerraformFile('flow_logs.tf');
      expect(flowLogsFile.content).toContain('resource "aws_iam_role" "flow_logs"');
    });

    test('validates Flow Log resource', () => {
      const flowLogsFile = validator.readTerraformFile('flow_logs.tf');
      expect(flowLogsFile.content).toContain('resource "aws_flow_log" "main"');
    });

    test('validates traffic type ALL', () => {
      const flowLogsFile = validator.readTerraformFile('flow_logs.tf');
      expect(flowLogsFile.content).toMatch(/traffic_type\s*=\s*"ALL"/);
    });

    test('returns validation result structure', () => {
      const result = validator.validateFlowLogs();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
    });
  });

  describe('validateVariables', () => {
    test('successfully validates variables configuration', () => {
      const result = validator.validateVariables();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('validates all required variables exist', () => {
      const varsFile = validator.readTerraformFile('variables.tf');
      const requiredVars = [
        'environment_suffix',
        'aws_region',
        'vpc_cidr',
        'availability_zones',
        'public_subnet_cidrs',
        'private_subnet_cidrs',
        'common_tags'
      ];

      requiredVars.forEach(varName => {
        expect(varsFile.content).toContain(`variable "${varName}"`);
      });
    });

    test('validates VPC CIDR default', () => {
      const varsFile = validator.readTerraformFile('variables.tf');
      expect(varsFile.content).toContain('10.0.0.0/16');
    });

    test('validates common tags', () => {
      const varsFile = validator.readTerraformFile('variables.tf');
      expect(varsFile.content).toContain('Environment');
      expect(varsFile.content).toContain('CostCenter');
    });

    test('returns validation result structure', () => {
      const result = validator.validateVariables();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
    });
  });

  describe('validateOutputs', () => {
    test('successfully validates outputs configuration', () => {
      const result = validator.validateOutputs();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('validates all required outputs exist', () => {
      const outputsFile = validator.readTerraformFile('outputs.tf');
      const requiredOutputs = [
        'vpc_id',
        'vpc_cidr_block',
        'public_subnet_ids',
        'private_subnet_ids',
        'internet_gateway_id',
        'nat_gateway_ids',
        'public_route_table_id',
        'private_route_table_ids',
        'flow_log_id',
        'network_acl_id',
        'elastic_ip_addresses'
      ];

      requiredOutputs.forEach(outputName => {
        expect(outputsFile.content).toContain(`output "${outputName}"`);
      });
    });

    test('returns validation result structure', () => {
      const result = validator.validateOutputs();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
    });
  });

  describe('validateAll', () => {
    test('runs all validations successfully', () => {
      const result = validator.validateAll();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('combines results from all validators', () => {
      const result = validator.validateAll();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    test('validates required files', () => {
      const result = validator.validateAll();
      const filesResult = validator.validateRequiredFiles();
      expect(filesResult.valid).toBe(true);
    });

    test('validates VPC', () => {
      const result = validator.validateAll();
      const vpcResult = validator.validateVPC();
      expect(vpcResult.valid).toBe(true);
    });

    test('validates Network ACL', () => {
      const result = validator.validateAll();
      const naclResult = validator.validateNetworkACL();
      expect(naclResult.valid).toBe(true);
    });

    test('validates Flow Logs', () => {
      const result = validator.validateAll();
      const flowLogsResult = validator.validateFlowLogs();
      expect(flowLogsResult.valid).toBe(true);
    });

    test('validates Variables', () => {
      const result = validator.validateAll();
      const varsResult = validator.validateVariables();
      expect(varsResult.valid).toBe(true);
    });

    test('validates Outputs', () => {
      const result = validator.validateAll();
      const outputsResult = validator.validateOutputs();
      expect(outputsResult.valid).toBe(true);
    });
  });

  describe('comprehensive validation checks', () => {
    test('validates complete infrastructure configuration', () => {
      const filesValid = validator.validateRequiredFiles().valid;
      const vpcValid = validator.validateVPC().valid;
      const naclValid = validator.validateNetworkACL().valid;
      const flowLogsValid = validator.validateFlowLogs().valid;
      const varsValid = validator.validateVariables().valid;
      const outputsValid = validator.validateOutputs().valid;

      expect(filesValid).toBe(true);
      expect(vpcValid).toBe(true);
      expect(naclValid).toBe(true);
      expect(flowLogsValid).toBe(true);
      expect(varsValid).toBe(true);
      expect(outputsValid).toBe(true);
    });

    test('all validation methods return consistent structure', () => {
      const results = [
        validator.validateRequiredFiles(),
        validator.validateVPC(),
        validator.validateNetworkACL(),
        validator.validateFlowLogs(),
        validator.validateVariables(),
        validator.validateOutputs(),
        validator.validateAll()
      ];

      results.forEach(result => {
        expect(result).toHaveProperty('valid');
        expect(result).toHaveProperty('errors');
        expect(result).toHaveProperty('warnings');
        expect(typeof result.valid).toBe('boolean');
        expect(Array.isArray(result.errors)).toBe(true);
        expect(Array.isArray(result.warnings)).toBe(true);
      });
    });
  });

  describe('error handling and edge cases', () => {
    test('handles invalid directory gracefully', () => {
      const invalidValidator = new TerraformConfigValidator('/invalid/path/to/nowhere');
      expect(() => invalidValidator.validateRequiredFiles()).not.toThrow();
    });

    test('validateVPC handles missing VPC file gracefully', () => {
      const badValidator = new TerraformConfigValidator('/invalid/path');
      const result = badValidator.validateVPC();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Failed to read vpc.tf');
    });

    test('validateNetworkACL handles missing file gracefully', () => {
      const badValidator = new TerraformConfigValidator('/invalid/path');
      const result = badValidator.validateNetworkACL();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Failed to read network_acl.tf');
    });

    test('validateFlowLogs handles missing file gracefully', () => {
      const badValidator = new TerraformConfigValidator('/invalid/path');
      const result = badValidator.validateFlowLogs();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Failed to read flow_logs.tf');
    });

    test('validateVariables handles missing file gracefully', () => {
      const badValidator = new TerraformConfigValidator('/invalid/path');
      const result = badValidator.validateVariables();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Failed to read variables.tf');
    });

    test('validateOutputs handles missing file gracefully', () => {
      const badValidator = new TerraformConfigValidator('/invalid/path');
      const result = badValidator.validateOutputs();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Failed to read outputs.tf');
    });

    test('validateRequiredFiles detects missing files', () => {
      const badValidator = new TerraformConfigValidator('/invalid/path');
      const result = badValidator.validateRequiredFiles();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('Missing required file'))).toBe(true);
    });

    test('validateAll aggregates errors from all validators', () => {
      const badValidator = new TerraformConfigValidator('/invalid/path');
      const result = badValidator.validateAll();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('validateAll aggregates warnings from all validators', () => {
      const result = validator.validateAll();
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('error condition coverage', () => {
    let tempDir: string;
    let tempValidator: TerraformConfigValidator;

    beforeEach(() => {
      // Create a temporary directory for test files
      tempDir = fs.mkdtempSync(path.join(__dirname, 'test-terraform-'));
      tempValidator = new TerraformConfigValidator(tempDir);
    });

    afterEach(() => {
      // Clean up temporary directory
      if (fs.existsSync(tempDir)) {
        fs.readdirSync(tempDir).forEach(file => {
          fs.unlinkSync(path.join(tempDir, file));
        });
        fs.rmdirSync(tempDir);
      }
    });

    test('validateVPC detects missing VPC resource', () => {
      const invalidVpc = '# No VPC resource here\n';
      fs.writeFileSync(path.join(tempDir, 'vpc.tf'), invalidVpc);
      const result = tempValidator.validateVPC();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Missing VPC resource definition'))).toBe(true);
    });

    test('validateVPC detects missing DNS support', () => {
      const invalidVpc = 'resource "aws_vpc" "main" {\n  cidr_block = "10.0.0.0/16"\n}\n';
      fs.writeFileSync(path.join(tempDir, 'vpc.tf'), invalidVpc);
      const result = tempValidator.validateVPC();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('enable_dns_support'))).toBe(true);
    });

    test('validateVPC detects missing DNS hostnames', () => {
      const invalidVpc = 'resource "aws_vpc" "main" {\n  cidr_block = "10.0.0.0/16"\n  enable_dns_support = true\n}\n';
      fs.writeFileSync(path.join(tempDir, 'vpc.tf'), invalidVpc);
      const result = tempValidator.validateVPC();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('enable_dns_hostnames'))).toBe(true);
    });

    test('validateVPC detects missing environment_suffix', () => {
      const invalidVpc = 'resource "aws_vpc" "main" {\n  cidr_block = "10.0.0.0/16"\n  enable_dns_support = true\n  enable_dns_hostnames = true\n}\n';
      fs.writeFileSync(path.join(tempDir, 'vpc.tf'), invalidVpc);
      const result = tempValidator.validateVPC();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('environment_suffix'))).toBe(true);
    });

    test('validateVPC detects wrong public subnet count', () => {
      const invalidVpc = 'resource "aws_vpc" "main" {\n  cidr_block = "10.0.0.0/16"\n  enable_dns_support = true\n  enable_dns_hostnames = true\n  tags = { Name = "vpc-${var.environment_suffix}" }\n}\nresource "aws_subnet" "public" {\n  count = 2\n}\n';
      fs.writeFileSync(path.join(tempDir, 'vpc.tf'), invalidVpc);
      const result = tempValidator.validateVPC();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Expected 3 public subnets'))).toBe(true);
    });

    test('validateVPC detects wrong private subnet count', () => {
      const invalidVpc = 'resource "aws_vpc" "main" {\n  cidr_block = "10.0.0.0/16"\n  enable_dns_support = true\n  enable_dns_hostnames = true\n  tags = { Name = "vpc-${var.environment_suffix}" }\n}\nresource "aws_subnet" "public" {\n  count = 3\n}\nresource "aws_subnet" "private" {\n  count = 2\n}\n';
      fs.writeFileSync(path.join(tempDir, 'vpc.tf'), invalidVpc);
      const result = tempValidator.validateVPC();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Expected 3 private subnets'))).toBe(true);
    });

    test('validateVPC detects wrong NAT Gateway count', () => {
      const invalidVpc = 'resource "aws_vpc" "main" {\n  cidr_block = "10.0.0.0/16"\n  enable_dns_support = true\n  enable_dns_hostnames = true\n  tags = { Name = "vpc-${var.environment_suffix}" }\n}\nresource "aws_subnet" "public" {\n  count = 3\n}\nresource "aws_subnet" "private" {\n  count = 3\n}\nresource "aws_nat_gateway" "main" {\n  count = 2\n}\n';
      fs.writeFileSync(path.join(tempDir, 'vpc.tf'), invalidVpc);
      const result = tempValidator.validateVPC();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Expected 3 NAT Gateways'))).toBe(true);
    });

    test('validateVPC detects prevent_destroy', () => {
      const invalidVpc = 'resource "aws_vpc" "main" {\n  cidr_block = "10.0.0.0/16"\n  enable_dns_support = true\n  enable_dns_hostnames = true\n  tags = { Name = "vpc-${var.environment_suffix}" }\n  lifecycle {\n    prevent_destroy = true\n  }\n}\n';
      fs.writeFileSync(path.join(tempDir, 'vpc.tf'), invalidVpc);
      const result = tempValidator.validateVPC();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('prevent_destroy'))).toBe(true);
    });

    test('validateNetworkACL detects missing HTTP port', () => {
      const invalidNacl = 'resource "aws_network_acl" "public" {\n  vpc_id = aws_vpc.main.id\n}\n';
      fs.writeFileSync(path.join(tempDir, 'network_acl.tf'), invalidNacl);
      const result = tempValidator.validateNetworkACL();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('HTTP (port 80)'))).toBe(true);
    });

    test('validateNetworkACL detects missing HTTPS port', () => {
      const invalidNacl = 'resource "aws_network_acl" "public" {\n  vpc_id = aws_vpc.main.id\n  ingress {\n    from_port = 80\n    to_port = 80\n    protocol = "tcp"\n  }\n}\n';
      fs.writeFileSync(path.join(tempDir, 'network_acl.tf'), invalidNacl);
      const result = tempValidator.validateNetworkACL();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('HTTPS (port 443)'))).toBe(true);
    });

    test('validateNetworkACL detects missing ephemeral ports', () => {
      const invalidNacl = 'resource "aws_network_acl" "public" {\n  vpc_id = aws_vpc.main.id\n  ingress {\n    from_port = 80\n    to_port = 80\n    protocol = "tcp"\n  }\n  ingress {\n    from_port = 443\n    to_port = 443\n    protocol = "tcp"\n  }\n}\n';
      fs.writeFileSync(path.join(tempDir, 'network_acl.tf'), invalidNacl);
      const result = tempValidator.validateNetworkACL();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('ephemeral ports'))).toBe(true);
    });

    test('validateFlowLogs detects missing CloudWatch Log Group', () => {
      const invalidFlowLogs = '# No log group here\n';
      fs.writeFileSync(path.join(tempDir, 'flow_logs.tf'), invalidFlowLogs);
      const result = tempValidator.validateFlowLogs();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Missing CloudWatch Log Group'))).toBe(true);
    });

    test('validateFlowLogs detects wrong retention period', () => {
      const invalidFlowLogs = 'resource "aws_cloudwatch_log_group" "flow_logs" {\n  name = "vpc-flow-logs"\n  retention_in_days = 14\n}\n';
      fs.writeFileSync(path.join(tempDir, 'flow_logs.tf'), invalidFlowLogs);
      const result = tempValidator.validateFlowLogs();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('retention is not set to 7 days'))).toBe(true);
    });

    test('validateFlowLogs detects missing IAM role', () => {
      const invalidFlowLogs = 'resource "aws_cloudwatch_log_group" "flow_logs" {\n  name = "vpc-flow-logs"\n  retention_in_days = 7\n}\n';
      fs.writeFileSync(path.join(tempDir, 'flow_logs.tf'), invalidFlowLogs);
      const result = tempValidator.validateFlowLogs();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Missing IAM role'))).toBe(true);
    });

    test('validateFlowLogs detects missing Flow Log resource', () => {
      const invalidFlowLogs = 'resource "aws_cloudwatch_log_group" "flow_logs" {\n  name = "vpc-flow-logs"\n  retention_in_days = 7\n}\nresource "aws_iam_role" "flow_logs" {\n  name = "flow-logs-role"\n}\n';
      fs.writeFileSync(path.join(tempDir, 'flow_logs.tf'), invalidFlowLogs);
      const result = tempValidator.validateFlowLogs();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Missing VPC Flow Log resource'))).toBe(true);
    });

    test('validateFlowLogs detects wrong traffic type', () => {
      const invalidFlowLogs = 'resource "aws_cloudwatch_log_group" "flow_logs" {\n  name = "vpc-flow-logs"\n  retention_in_days = 7\n}\nresource "aws_iam_role" "flow_logs" {\n  name = "flow-logs-role"\n}\nresource "aws_flow_log" "main" {\n  traffic_type = "ACCEPT"\n}\n';
      fs.writeFileSync(path.join(tempDir, 'flow_logs.tf'), invalidFlowLogs);
      const result = tempValidator.validateFlowLogs();
      expect(result.warnings.some(w => w.includes('traffic_type should be "ALL"'))).toBe(true);
    });

    test('validateVariables detects missing required variable', () => {
      const invalidVars = 'variable "aws_region" {\n  default = "us-east-1"\n}\n';
      fs.writeFileSync(path.join(tempDir, 'variables.tf'), invalidVars);
      const result = tempValidator.validateVariables();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Missing required variable: environment_suffix'))).toBe(true);
    });

    test('validateVariables detects wrong VPC CIDR default', () => {
      const invalidVars = 'variable "environment_suffix" {}\nvariable "aws_region" { default = "us-east-1" }\nvariable "vpc_cidr" { default = "172.16.0.0/16" }\nvariable "availability_zones" {}\nvariable "public_subnet_cidrs" {}\nvariable "private_subnet_cidrs" {}\nvariable "common_tags" {}\n';
      fs.writeFileSync(path.join(tempDir, 'variables.tf'), invalidVars);
      const result = tempValidator.validateVariables();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('VPC CIDR default is not 10.0.0.0/16'))).toBe(true);
    });

    test('validateVariables detects missing Environment tag', () => {
      const invalidVars = 'variable "environment_suffix" {}\nvariable "aws_region" { default = "us-east-1" }\nvariable "vpc_cidr" { default = "10.0.0.0/16" }\nvariable "availability_zones" {}\nvariable "public_subnet_cidrs" {}\nvariable "private_subnet_cidrs" {}\nvariable "common_tags" {\n  default = {\n    CostCenter = "Engineering"\n  }\n}\n';
      fs.writeFileSync(path.join(tempDir, 'variables.tf'), invalidVars);
      const result = tempValidator.validateVariables();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Missing Environment tag'))).toBe(true);
    });

    test('validateVariables detects missing CostCenter tag', () => {
      const invalidVars = 'variable "environment_suffix" {}\nvariable "aws_region" { default = "us-east-1" }\nvariable "vpc_cidr" { default = "10.0.0.0/16" }\nvariable "availability_zones" {}\nvariable "public_subnet_cidrs" {}\nvariable "private_subnet_cidrs" {}\nvariable "common_tags" {\n  default = {\n    Environment = "dev"\n  }\n}\n';
      fs.writeFileSync(path.join(tempDir, 'variables.tf'), invalidVars);
      const result = tempValidator.validateVariables();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Missing CostCenter tag'))).toBe(true);
    });

    test('validateOutputs detects missing required output', () => {
      const invalidOutputs = 'output "vpc_id" {\n  value = aws_vpc.main.id\n}\n';
      fs.writeFileSync(path.join(tempDir, 'outputs.tf'), invalidOutputs);
      const result = tempValidator.validateOutputs();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Missing required output: vpc_cidr_block'))).toBe(true);
    });
  });
});
