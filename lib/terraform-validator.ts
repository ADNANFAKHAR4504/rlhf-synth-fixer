/**
 * Terraform Configuration Validator
 * 
 * This module provides utilities to validate and parse Terraform configurations
 * ensuring compliance with enterprise requirements.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface TerraformResource {
  type: string;
  name: string;
  content: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface EnvironmentConfig {
  environment: string;
  instanceType: string;
  dbInstanceClass: string;
  enableMultiAz: boolean;
  deletionProtection: boolean;
}

export class TerraformValidator {
  private readonly configPath: string;
  private readonly providerPath: string;
  private configContent: string;
  private providerContent: string;

  constructor(configPath?: string, providerPath?: string) {
    this.configPath = configPath || path.join(__dirname, 'tap_stack.tf');
    this.providerPath = providerPath || path.join(__dirname, 'provider.tf');
    this.configContent = '';
    this.providerContent = '';
  }

  /**
   * Load Terraform configuration files
   */
  public loadConfiguration(): void {
    if (fs.existsSync(this.configPath)) {
      this.configContent = fs.readFileSync(this.configPath, 'utf8');
    } else {
      throw new Error(`Configuration file not found: ${this.configPath}`);
    }

    if (fs.existsSync(this.providerPath)) {
      this.providerContent = fs.readFileSync(this.providerPath, 'utf8');
    } else {
      throw new Error(`Provider file not found: ${this.providerPath}`);
    }
  }

  /**
   * Validate region compliance (Requirement 1)
   */
  public validateRegionCompliance(): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Check for us-east-1 region enforcement
    if (!this.configContent.includes('var.aws_region == "us-east-1"')) {
      result.errors.push('Region validation for us-east-1 not found');
      result.valid = false;
    }

    // Check availability zones
    if (!this.configContent.includes('us-east-1a') || !this.configContent.includes('us-east-1b')) {
      result.errors.push('Availability zones must be in us-east-1');
      result.valid = false;
    }

    return result;
  }

  /**
   * Validate Terraform version (Requirement 2)
   */
  public validateTerraformVersion(): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    if (!this.providerContent.includes('required_version')) {
      result.errors.push('Terraform version requirement not specified');
      result.valid = false;
    }

    if (!this.providerContent.includes('>= 1.4.0')) {
      result.warnings.push('Consider using Terraform >= 1.4.0');
    }

    return result;
  }

  /**
   * Validate environment configurations (Requirement 3)
   */
  public validateEnvironmentConfigurations(): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    const environments = ['development', 'staging', 'production'];
    
    for (const env of environments) {
      if (!this.configContent.includes(`"${env}"`)) {
        result.errors.push(`Environment configuration for ${env} not found`);
        result.valid = false;
      }
    }

    // Check for environment suffix support
    if (!this.configContent.includes('var.environment_suffix')) {
      result.errors.push('Environment suffix variable not found');
      result.valid = false;
    }

    return result;
  }

  /**
   * Validate cost estimation (Requirement 4)
   */
  public validateCostEstimation(): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    if (!this.configContent.includes('output "cost_estimation"')) {
      result.errors.push('Cost estimation output not found');
      result.valid = false;
    }

    return result;
  }

  /**
   * Validate network configuration (Requirement 5)
   */
  public validateNetworkConfiguration(): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    const requiredResources = [
      'aws_vpc',
      'aws_subnet" "public',
      'aws_subnet" "private',
      'aws_nat_gateway',
      'aws_internet_gateway',
      'aws_route_table" "public',
      'aws_route_table" "private'
    ];

    for (const resource of requiredResources) {
      if (!this.configContent.includes(resource)) {
        result.errors.push(`Required network resource ${resource} not found`);
        result.valid = false;
      }
    }

    return result;
  }

  /**
   * Validate SSH access restrictions (Requirement 6)
   */
  public validateSSHRestrictions(): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    if (!this.configContent.includes('allowed_ssh_cidrs')) {
      result.errors.push('SSH CIDR restrictions not configured');
      result.valid = false;
    }

    if (this.configContent.includes('0.0.0.0/0') && this.configContent.includes('port = 22')) {
      result.errors.push('SSH access should not be open to 0.0.0.0/0');
      result.valid = false;
    }

    return result;
  }

  /**
   * Validate remote state management (Requirement 7)
   */
  public validateRemoteStateManagement(): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    if (!this.providerContent.includes('backend "s3"')) {
      result.errors.push('S3 backend for remote state not configured');
      result.valid = false;
    }

    return result;
  }

  /**
   * Validate S3 security (Requirement 8)
   */
  public validateS3Security(): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    const requiredS3Features = [
      'aws_s3_bucket_public_access_block',
      'aws_s3_bucket_server_side_encryption_configuration',
      'aws_s3_bucket_policy',
      'aws_s3_bucket_logging',
      'aws_s3_bucket_versioning'
    ];

    for (const feature of requiredS3Features) {
      if (!this.configContent.includes(feature)) {
        result.errors.push(`S3 security feature ${feature} not configured`);
        result.valid = false;
      }
    }

    return result;
  }

  /**
   * Validate AWS naming conventions (Requirement 10)
   */
  public validateNamingConventions(): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    if (!this.configContent.includes('name_prefix')) {
      result.errors.push('Consistent naming prefix not configured');
      result.valid = false;
    }

    if (!this.configContent.includes('tap-${var.environment_suffix}')) {
      result.errors.push('Name prefix should include environment suffix');
      result.valid = false;
    }

    return result;
  }

  /**
   * Validate no hardcoded secrets (Requirement 12)
   */
  public validateNoHardcodedSecrets(): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Check for hardcoded passwords
    const passwordPattern = /password\s*=\s*"[^"]{8,}"/;
    const secretPattern = /secret\s*=\s*"[^"]{8,}"/;
    
    if (passwordPattern.test(this.configContent) || secretPattern.test(this.configContent)) {
      result.errors.push('Potential hardcoded secrets detected');
      result.valid = false;
    }

    // Check for Secrets Manager usage
    if (!this.configContent.includes('aws_secretsmanager_secret')) {
      result.warnings.push('Consider using AWS Secrets Manager for credentials');
    }

    return result;
  }

  /**
   * Extract environment configurations
   */
  public extractEnvironmentConfigs(): EnvironmentConfig[] {
    const configs: EnvironmentConfig[] = [];
    
    const envConfigPattern = /(\w+)\s*=\s*{\s*instance_type\s*=\s*"([^"]+)"\s*db_instance_class\s*=\s*"([^"]+)"\s*enable_multi_az\s*=\s*(\w+)\s*deletion_protection\s*=\s*(\w+)/g;
    
    let match;
    while ((match = envConfigPattern.exec(this.configContent)) !== null) {
      configs.push({
        environment: match[1],
        instanceType: match[2],
        dbInstanceClass: match[3],
        enableMultiAz: match[4] === 'true',
        deletionProtection: match[5] === 'true'
      });
    }

    return configs;
  }

  /**
   * Extract all resources
   */
  public extractResources(): TerraformResource[] {
    const resources: TerraformResource[] = [];
    const resourcePattern = /resource\s+"([^"]+)"\s+"([^"]+)"\s*{([^}]*)}/g;
    
    let match;
    while ((match = resourcePattern.exec(this.configContent)) !== null) {
      resources.push({
        type: match[1],
        name: match[2],
        content: match[3]
      });
    }

    return resources;
  }

  /**
   * Validate all requirements
   */
  public validateAll(): ValidationResult {
    const results: ValidationResult[] = [
      this.validateRegionCompliance(),
      this.validateTerraformVersion(),
      this.validateEnvironmentConfigurations(),
      this.validateCostEstimation(),
      this.validateNetworkConfiguration(),
      this.validateSSHRestrictions(),
      this.validateRemoteStateManagement(),
      this.validateS3Security(),
      this.validateNamingConventions(),
      this.validateNoHardcodedSecrets()
    ];

    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    let allValid = true;

    for (const result of results) {
      if (!result.valid) {
        allValid = false;
      }
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }

    return {
      valid: allValid,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  /**
   * Check if deletion protection is disabled for all environments
   */
  public isDeletionProtectionDisabled(): boolean {
    const configs = this.extractEnvironmentConfigs();
    return configs.every(config => !config.deletionProtection);
  }

  /**
   * Check if environment suffix is properly configured
   */
  public hasEnvironmentSuffix(): boolean {
    return this.configContent.includes('variable "environment_suffix"') &&
           this.configContent.includes('tap-${var.environment_suffix}');
  }

  /**
   * Get resource count by type
   */
  public getResourceCountByType(): Map<string, number> {
    const resources = this.extractResources();
    const countMap = new Map<string, number>();

    for (const resource of resources) {
      const count = countMap.get(resource.type) || 0;
      countMap.set(resource.type, count + 1);
    }

    return countMap;
  }

  /**
   * Validate production-specific features
   */
  public validateProductionFeatures(): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Check for Auto Scaling Group in production
    if (!this.configContent.includes('aws_autoscaling_group')) {
      result.errors.push('Auto Scaling Group not configured for production');
      result.valid = false;
    }

    // Check for CloudWatch alarms in production
    if (!this.configContent.includes('aws_cloudwatch_metric_alarm')) {
      result.errors.push('CloudWatch alarms not configured for production');
      result.valid = false;
    }

    // Check for Multi-AZ in production
    if (!this.configContent.includes('multi_az')) {
      result.warnings.push('Multi-AZ should be configured for production RDS');
    }

    return result;
  }
}