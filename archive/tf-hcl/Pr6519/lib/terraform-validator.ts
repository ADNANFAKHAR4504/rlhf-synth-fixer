import * as fs from 'fs';
import * as path from 'path';

export interface TerraformFile {
  name: string;
  path: string;
  content: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class TerraformConfigValidator {
  private readonly libDir: string;

  constructor(libDir: string = path.resolve(__dirname, '../lib')) {
    this.libDir = libDir;
  }

  /**
   * Read a Terraform file
   */
  readTerraformFile(filename: string): TerraformFile {
    const filePath = path.join(this.libDir, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    return {
      name: filename,
      path: filePath,
      content
    };
  }

  /**
   * Validate that all required files exist
   */
  validateRequiredFiles(): ValidationResult {
    const requiredFiles = [
      'provider.tf',
      'variables.tf',
      'vpc.tf',
      'network_acl.tf',
      'flow_logs.tf',
      'outputs.tf'
    ];

    const errors: string[] = [];
    const warnings: string[] = [];

    requiredFiles.forEach(file => {
      const filePath = path.join(this.libDir, file);
      if (!fs.existsSync(filePath)) {
        errors.push(`Missing required file: ${file}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate VPC configuration
   */
  validateVPC(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const vpcFile = this.readTerraformFile('vpc.tf');

      // Check VPC resource
      if (!vpcFile.content.includes('resource "aws_vpc" "main"')) {
        errors.push('Missing VPC resource definition');
      }

      // Check DNS settings
      if (!vpcFile.content.includes('enable_dns_support')) {
        errors.push('Missing enable_dns_support in VPC');
      }
      if (!vpcFile.content.includes('enable_dns_hostnames')) {
        errors.push('Missing enable_dns_hostnames in VPC');
      }

      // Check environment_suffix usage
      if (!vpcFile.content.includes('${var.environment_suffix}')) {
        errors.push('VPC resources do not use environment_suffix');
      }

      // Check for 3 public and 3 private subnets
      const publicSubnetMatch = vpcFile.content.match(/resource\s+"aws_subnet"\s+"public"\s*{\s*count\s*=\s*(\d+)/);
      if (publicSubnetMatch && publicSubnetMatch[1] !== '3') {
        errors.push(`Expected 3 public subnets, found ${publicSubnetMatch[1]}`);
      }

      const privateSubnetMatch = vpcFile.content.match(/resource\s+"aws_subnet"\s+"private"\s*{\s*count\s*=\s*(\d+)/);
      if (privateSubnetMatch && privateSubnetMatch[1] !== '3') {
        errors.push(`Expected 3 private subnets, found ${privateSubnetMatch[1]}`);
      }

      // Check for NAT Gateways
      const natGatewayMatch = vpcFile.content.match(/resource\s+"aws_nat_gateway"\s+"main"\s*{\s*count\s*=\s*(\d+)/);
      if (natGatewayMatch && natGatewayMatch[1] !== '3') {
        errors.push(`Expected 3 NAT Gateways, found ${natGatewayMatch[1]}`);
      }

      // Check for prevent_destroy
      if (vpcFile.content.includes('prevent_destroy = true')) {
        errors.push('VPC has prevent_destroy enabled - resources must be destroyable');
      }

    } catch (error) {
      errors.push(`Failed to read vpc.tf: ${error}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate Network ACL configuration
   */
  validateNetworkACL(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const naclFile = this.readTerraformFile('network_acl.tf');

      // Check HTTP allowed
      if (!naclFile.content.match(/from_port\s*=\s*80/)) {
        errors.push('Network ACL does not allow HTTP (port 80)');
      }

      // Check HTTPS allowed
      if (!naclFile.content.match(/from_port\s*=\s*443/)) {
        errors.push('Network ACL does not allow HTTPS (port 443)');
      }

      // Check ephemeral ports
      if (!naclFile.content.match(/from_port\s*=\s*1024/)) {
        errors.push('Network ACL does not allow ephemeral ports');
      }

    } catch (error) {
      errors.push(`Failed to read network_acl.tf: ${error}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate Flow Logs configuration
   */
  validateFlowLogs(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const flowLogsFile = this.readTerraformFile('flow_logs.tf');

      // Check CloudWatch Log Group
      if (!flowLogsFile.content.includes('resource "aws_cloudwatch_log_group" "flow_logs"')) {
        errors.push('Missing CloudWatch Log Group for Flow Logs');
      }

      // Check 7-day retention
      if (!flowLogsFile.content.match(/retention_in_days\s*=\s*7/)) {
        errors.push('Flow Logs retention is not set to 7 days');
      }

      // Check IAM role
      if (!flowLogsFile.content.includes('resource "aws_iam_role" "flow_logs"')) {
        errors.push('Missing IAM role for Flow Logs');
      }

      // Check VPC Flow Log resource
      if (!flowLogsFile.content.includes('resource "aws_flow_log" "main"')) {
        errors.push('Missing VPC Flow Log resource');
      }

      // Check traffic type
      if (!flowLogsFile.content.match(/traffic_type\s*=\s*"ALL"/)) {
        warnings.push('Flow Logs traffic_type should be "ALL"');
      }

    } catch (error) {
      errors.push(`Failed to read flow_logs.tf: ${error}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate variables configuration
   */
  validateVariables(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const varsFile = this.readTerraformFile('variables.tf');

      const requiredVariables = [
        'environment_suffix',
        'aws_region',
        'vpc_cidr',
        'availability_zones',
        'public_subnet_cidrs',
        'private_subnet_cidrs',
        'common_tags'
      ];

      requiredVariables.forEach(varName => {
        if (!varsFile.content.includes(`variable "${varName}"`)) {
          errors.push(`Missing required variable: ${varName}`);
        }
      });

      // Check VPC CIDR default
      if (!varsFile.content.includes('10.0.0.0/16')) {
        errors.push('VPC CIDR default is not 10.0.0.0/16');
      }

      // Check common tags
      if (!varsFile.content.includes('Environment')) {
        errors.push('Missing Environment tag in common_tags');
      }
      if (!varsFile.content.includes('CostCenter')) {
        errors.push('Missing CostCenter tag in common_tags');
      }

    } catch (error) {
      errors.push(`Failed to read variables.tf: ${error}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate outputs configuration
   */
  validateOutputs(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const outputsFile = this.readTerraformFile('outputs.tf');

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
        if (!outputsFile.content.includes(`output "${outputName}"`)) {
          errors.push(`Missing required output: ${outputName}`);
        }
      });

    } catch (error) {
      errors.push(`Failed to read outputs.tf: ${error}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Run all validations
   */
  validateAll(): ValidationResult {
    const results: ValidationResult[] = [
      this.validateRequiredFiles(),
      this.validateVPC(),
      this.validateNetworkACL(),
      this.validateFlowLogs(),
      this.validateVariables(),
      this.validateOutputs()
    ];

    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    results.forEach(result => {
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    });

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }
}
