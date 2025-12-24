// Terraform configuration validator utility functions
import fs from 'fs';
import path from 'path';

export interface TerraformResource {
  type: string;
  name: string;
  provider?: string;
  properties: Record<string, any>;
}

export interface TerraformOutput {
  name: string;
  value: string;
  sensitive?: boolean;
  description?: string;
}

export class TerraformValidator {
  private configPath: string;

  constructor(configPath: string) {
    this.configPath = configPath;
  }

  /**
   * Validates that all required Terraform files exist
   */
  validateFileStructure(): boolean {
    const requiredFiles = [
      'tap_stack.tf',
      'provider.tf',
      'variables.tf',
      'backend.tf',
    ];
    return requiredFiles.every(file =>
      fs.existsSync(path.join(this.configPath, file))
    );
  }

  /**
   * Parses and validates provider configuration
   */
  validateProviderConfig(content: string): boolean {
    const hasRequiredVersion = /required_version\s*=\s*"[^"]+"/.test(content);
    const hasAWSProvider = /source\s*=\s*"hashicorp\/aws"/.test(content);
    const hasPrimaryProvider =
      /provider\s+"aws"\s*{\s*\n\s*alias\s*=\s*"primary"/m.test(content);
    const hasSecondaryProvider =
      /provider\s+"aws"\s*{\s*\n\s*alias\s*=\s*"secondary"/m.test(content);

    return (
      hasRequiredVersion &&
      hasAWSProvider &&
      hasPrimaryProvider &&
      hasSecondaryProvider
    );
  }

  /**
   * Validates that environment suffix is used in resource names
   */
  validateEnvironmentSuffix(content: string): number {
    const patterns = [
      /Name\s*=\s*"[^"]*\$\{var\.environment_suffix\}"/g,
      /name\s*=\s*"[^"]*\$\{var\.environment_suffix\}"/g,
      /identifier\s*=\s*"[^"]*\$\{var\.environment_suffix\}"/g,
    ];

    let totalMatches = 0;
    patterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      totalMatches += matches.length;
    });

    return totalMatches;
  }

  /**
   * Validates RDS configuration for high availability
   */
  validateRDSHighAvailability(content: string): boolean {
    const hasMultiAZ = /multi_az\s*=\s*true/.test(content);
    const hasBackup = /backup_retention_period\s*=\s*\d+/.test(content);
    const hasEncryption = /storage_encrypted\s*=\s*true/.test(content);
    const hasMonitoring = /monitoring_interval\s*=\s*\d+/.test(content);

    return hasMultiAZ && hasBackup && hasEncryption && hasMonitoring;
  }

  /**
   * Validates VPC configuration for multi-region setup
   */
  validateVPCConfiguration(content: string): boolean {
    const hasPrimaryVPC = /resource\s+"aws_vpc"\s+"primary"/.test(content);
    const hasSecondaryVPC = /resource\s+"aws_vpc"\s+"secondary"/.test(content);
    const hasDNSSupport = /enable_dns_support\s*=\s*true/.test(content);
    const hasDNSHostnames = /enable_dns_hostnames\s*=\s*true/.test(content);

    return hasPrimaryVPC && hasSecondaryVPC && hasDNSSupport && hasDNSHostnames;
  }

  /**
   * Validates subnet configuration
   */
  validateSubnetConfiguration(content: string): boolean {
    const hasPublicSubnets =
      /resource\s+"aws_subnet"\s+"primary_public"/.test(content) &&
      /resource\s+"aws_subnet"\s+"secondary_public"/.test(content);
    const hasPrivateSubnets =
      /resource\s+"aws_subnet"\s+"primary_private"/.test(content) &&
      /resource\s+"aws_subnet"\s+"secondary_private"/.test(content);
    const hasSubnetCount = /count\s*=\s*2/.test(content);

    return hasPublicSubnets && hasPrivateSubnets && hasSubnetCount;
  }

  /**
   * Validates security best practices
   */
  validateSecurityBestPractices(content: string): boolean {
    const noHardcodedPasswords = !/password\s*=\s*"[^$]/.test(content);
    const usesRandomPassword = /resource\s+"random_password"/.test(content);
    const usesSecretsManager = /resource\s+"aws_secretsmanager_secret"/.test(
      content
    );
    const rdsNotPublic = /publicly_accessible\s*=\s*false/.test(content);

    return (
      noHardcodedPasswords &&
      usesRandomPassword &&
      usesSecretsManager &&
      rdsNotPublic
    );
  }

  /**
   * Validates outputs are properly defined
   */
  validateOutputs(content: string): string[] {
    const outputPattern = /output\s+"([^"]+)"/g;
    const outputs: string[] = [];
    let match;

    while ((match = outputPattern.exec(content)) !== null) {
      outputs.push(match[1]);
    }

    return outputs;
  }

  /**
   * Validates IAM roles and policies
   */
  validateIAMConfiguration(content: string): boolean {
    const hasIAMRole = /resource\s+"aws_iam_role"/.test(content);
    const hasRolePolicyAttachment =
      /resource\s+"aws_iam_role_policy_attachment"/.test(content);
    const hasEnhancedMonitoringRole = /rds_enhanced_monitoring/.test(content);

    return hasIAMRole && hasRolePolicyAttachment && hasEnhancedMonitoringRole;
  }

  /**
   * Validates resource dependencies
   */
  validateResourceDependencies(content: string): boolean {
    const hasDependsOn = /depends_on\s*=\s*\[/.test(content);
    const hasInternetGatewayDependency =
      /depends_on\s*=\s*\[aws_internet_gateway/.test(content);

    return hasDependsOn && hasInternetGatewayDependency;
  }

  /**
   * Get resource count by type
   */
  getResourceCount(content: string, resourceType: string): number {
    const pattern = new RegExp(`resource\\s+"${resourceType}"\\s+"[^"]+"`, 'g');
    const matches = content.match(pattern) || [];
    return matches.length;
  }

  /**
   * Validate complete infrastructure setup
   */
  validateCompleteInfrastructure(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file structure
    if (!this.validateFileStructure()) {
      errors.push('Missing required Terraform files');
    }

    // Read and validate main stack file
    const stackPath = path.join(this.configPath, 'tap_stack.tf');
    if (fs.existsSync(stackPath)) {
      const content = fs.readFileSync(stackPath, 'utf8');

      // Validate VPC configuration
      if (!this.validateVPCConfiguration(content)) {
        errors.push('Invalid VPC configuration for multi-region setup');
      }

      // Validate subnet configuration
      if (!this.validateSubnetConfiguration(content)) {
        errors.push('Invalid subnet configuration');
      }

      // Validate RDS high availability
      if (!this.validateRDSHighAvailability(content)) {
        errors.push('RDS not configured for high availability');
      }

      // Validate security best practices
      if (!this.validateSecurityBestPractices(content)) {
        errors.push('Security best practices not followed');
      }

      // Validate IAM configuration
      if (!this.validateIAMConfiguration(content)) {
        warnings.push('IAM configuration may be incomplete');
      }

      // Check environment suffix usage
      const suffixCount = this.validateEnvironmentSuffix(content);
      if (suffixCount < 20) {
        warnings.push(
          `Only ${suffixCount} resources use environment suffix (expected at least 20)`
        );
      }

      // Validate outputs
      const outputs = this.validateOutputs(content);
      const expectedOutputs = [
        'primary_vpc_id',
        'secondary_vpc_id',
        'primary_rds_endpoint',
        'secondary_rds_endpoint',
        'db_secret_arn',
      ];

      const missingOutputs = expectedOutputs.filter(
        output => !outputs.includes(output)
      );
      if (missingOutputs.length > 0) {
        warnings.push(`Missing outputs: ${missingOutputs.join(', ')}`);
      }
    }

    // Read and validate provider file
    const providerPath = path.join(this.configPath, 'provider.tf');
    if (fs.existsSync(providerPath)) {
      const content = fs.readFileSync(providerPath, 'utf8');
      if (!this.validateProviderConfig(content)) {
        errors.push('Invalid provider configuration');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

/**
 * Helper function to extract resource names by type
 */
export function extractResourcesByType(
  content: string,
  resourceType: string
): string[] {
  const pattern = new RegExp(`resource\\s+"${resourceType}"\\s+"([^"]+)"`, 'g');
  const resources: string[] = [];
  let match;

  while ((match = pattern.exec(content)) !== null) {
    resources.push(match[1]);
  }

  return resources;
}

/**
 * Helper function to validate CIDR blocks
 */
export function validateCIDRBlock(cidr: string): boolean {
  const cidrPattern = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  if (!cidrPattern.test(cidr)) {
    return false;
  }

  const [ip, mask] = cidr.split('/');
  const octets = ip.split('.').map(Number);
  const maskNum = Number(mask);

  // Validate octets
  if (octets.some(octet => octet < 0 || octet > 255)) {
    return false;
  }

  // Validate mask
  if (maskNum < 0 || maskNum > 32) {
    return false;
  }

  return true;
}

/**
 * Helper function to check for resource naming consistency
 */
export function checkNamingConsistency(content: string): {
  consistent: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const resourcePattern = /resource\s+"[^"]+"\s+"([^"]+)"/g;
  const resources: string[] = [];
  let match;

  while ((match = resourcePattern.exec(content)) !== null) {
    resources.push(match[1]);
  }

  // Check for consistent use of underscores vs hyphens
  const hasUnderscores = resources.some(r => r.includes('_'));
  const hasHyphens = resources.some(r => r.includes('-'));

  if (hasUnderscores && hasHyphens) {
    issues.push(
      'Inconsistent naming: mix of underscores and hyphens in resource names'
    );
  }

  // Check for primary/secondary naming pattern
  const primaryResources = resources.filter(r => r.includes('primary'));
  const secondaryResources = resources.filter(r => r.includes('secondary'));

  if (primaryResources.length !== secondaryResources.length) {
    issues.push('Unbalanced primary/secondary resources');
  }

  return {
    consistent: issues.length === 0,
    issues,
  };
}

/**
 * Helper function to generate Terraform plan summary
 */
export function generatePlanSummary(content: string): {
  resourceCounts: Record<string, number>;
  totalResources: number;
  regions: string[];
  hasHighAvailability: boolean;
} {
  const resourceTypes = [
    'aws_vpc',
    'aws_subnet',
    'aws_internet_gateway',
    'aws_nat_gateway',
    'aws_route_table',
    'aws_security_group',
    'aws_db_instance',
    'aws_db_subnet_group',
    'aws_iam_role',
    'aws_secretsmanager_secret',
  ];

  const resourceCounts: Record<string, number> = {};
  let totalResources = 0;

  resourceTypes.forEach(type => {
    const count = (
      content.match(new RegExp(`resource\\s+"${type}"`, 'g')) || []
    ).length;
    if (count > 0) {
      resourceCounts[type] = count;
      totalResources += count;
    }
  });

  const regions = [];
  if (content.includes('us-east-1')) regions.push('us-east-1');
  if (content.includes('us-west-2')) regions.push('us-west-2');

  const hasHighAvailability =
    content.includes('multi_az') &&
    regions.length > 1 &&
    resourceCounts['aws_db_instance'] >= 2;

  return {
    resourceCounts,
    totalResources,
    regions,
    hasHighAvailability,
  };
}
