import * as fs from 'fs';
import * as path from 'path';

/**
 * Terraform Configuration Validator
 * This module provides functions to validate Terraform HCL files
 * for the multi-region Aurora PostgreSQL DR infrastructure.
 */

export interface TerraformFile {
  name: string;
  path: string;
  content: string;
  size: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Get list of all Terraform files in the lib directory
 */
export function getTerraformFiles(): TerraformFile[] {
  const libDir = __dirname;
  const files = fs.readdirSync(libDir)
    .filter(file => file.endsWith('.tf'))
    .map(file => {
      const filePath = path.join(libDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      return {
        name: file,
        path: filePath,
        content,
        size: content.length
      };
    });

  return files;
}

/**
 * Validate that all required Terraform files exist
 */
export function validateRequiredFiles(): ValidationResult {
  const required = ['main.tf', 'vpc.tf', 'aurora.tf', 'secrets.tf', 's3.tf', 'route53.tf', 'sns.tf', 'variables.tf', 'outputs.tf'];
  const errors: string[] = [];
  const warnings: string[] = [];

  const files = getTerraformFiles();
  const fileNames = files.map(f => f.name);

  for (const req of required) {
    if (!fileNames.includes(req)) {
      errors.push(`Missing required file: ${req}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate provider configuration
 */
export function validateProviderConfig(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!content.includes('terraform {')) {
    errors.push('Missing terraform block');
  }

  if (!content.includes('required_providers')) {
    errors.push('Missing required_providers block');
  }

  if (!content.includes('hashicorp/aws')) {
    errors.push('Missing AWS provider');
  }

  if (!content.includes('hashicorp/random')) {
    warnings.push('Missing random provider (may be required for password generation)');
  }

  if (!content.includes('backend "s3"')) {
    warnings.push('Missing S3 backend configuration');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate resource naming includes environmentSuffix
 */
export function validateResourceNaming(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const namePatterns = content.match(/Name\s*=\s*"[^"]+"/g) || [];

  if (namePatterns.length === 0) {
    warnings.push('No resource names found');
    return { valid: true, errors, warnings };
  }

  const withSuffix = namePatterns.filter(p => p.includes('${var.environment_suffix}'));

  if (withSuffix.length === 0 && namePatterns.length > 0) {
    errors.push('Resource names do not include environmentSuffix variable');
  } else if (withSuffix.length < namePatterns.length) {
    warnings.push(`Only ${withSuffix.length}/${namePatterns.length} resources include environmentSuffix`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate security best practices
 */
export function validateSecurity(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for hardcoded credentials
  const passwordMatch = content.match(/password\s*=\s*["'][^$][^"']+["']/i);
  if (passwordMatch) {
    errors.push('Hardcoded password detected');
  }

  // Check for encryption
  if (content.includes('aws_rds_cluster') && !content.includes('storage_encrypted')) {
    warnings.push('RDS encryption not explicitly configured');
  }

  if (content.includes('aws_s3_bucket') && !content.includes('sse_algorithm')) {
    warnings.push('S3 encryption not explicitly configured');
  }

  // Check for deletion protection (should be disabled for testing)
  if (content.includes('deletion_protection = true')) {
    warnings.push('Deletion protection is enabled (may prevent cleanup)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate multi-region configuration
 */
export function validateMultiRegion(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!content.includes('alias  = "primary"')) {
    errors.push('Missing primary region provider alias');
  }

  if (!content.includes('alias  = "secondary"')) {
    errors.push('Missing secondary region provider alias');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate Aurora Global Database configuration
 */
export function validateAuroraConfig(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!content.includes('aws_rds_global_cluster')) {
    errors.push('Missing Aurora Global Database configuration');
  }

  if (!content.includes('global_cluster_identifier')) {
    errors.push('Missing global_cluster_identifier reference');
  }

  if (!content.includes('db.r6g.large')) {
    warnings.push('Not using db.r6g.large instance class as specified');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate DR features
 */
export function validateDRFeatures(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const files = getTerraformFiles();

  // Check for Route 53 failover
  const route53File = files.find(f => f.name === 'route53.tf');
  if (route53File) {
    if (!route53File.content.includes('failover_routing_policy')) {
      errors.push('Missing Route 53 failover routing policy');
    }
    if (!route53File.content.includes('AuroraGlobalDBReplicationLag')) {
      warnings.push('Missing replication lag monitoring');
    }
  } else {
    errors.push('Missing route53.tf file');
  }

  // Check for S3 cross-region replication
  const s3File = files.find(f => f.name === 's3.tf');
  if (s3File) {
    if (!s3File.content.includes('replication_configuration')) {
      warnings.push('Missing S3 cross-region replication');
    }
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
export function validateAll(): ValidationResult {
  const results: ValidationResult[] = [];
  const files = getTerraformFiles();

  // Validate required files
  results.push(validateRequiredFiles());

  // Validate main.tf
  const mainFile = files.find(f => f.name === 'main.tf');
  if (mainFile) {
    results.push(validateProviderConfig(mainFile.content));
    results.push(validateMultiRegion(mainFile.content));
  }

  // Validate aurora.tf
  const auroraFile = files.find(f => f.name === 'aurora.tf');
  if (auroraFile) {
    results.push(validateAuroraConfig(auroraFile.content));
    results.push(validateSecurity(auroraFile.content));
    results.push(validateResourceNaming(auroraFile.content));
  }

  // Validate DR features
  results.push(validateDRFeatures());

  // Aggregate results
  const allErrors = results.flatMap(r => r.errors);
  const allWarnings = results.flatMap(r => r.warnings);

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
}
