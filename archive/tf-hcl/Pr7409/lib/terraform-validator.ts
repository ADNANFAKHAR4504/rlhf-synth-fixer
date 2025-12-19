// Terraform configuration validator utility
// Provides validation functions for Terraform HCL files

import * as fs from 'fs';
import * as path from 'path';

export interface TerraformFile {
  path: string;
  content: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Reads a Terraform file from the given path
 * @param filePath - Path to the Terraform file
 * @returns TerraformFile object with path and content
 */
export function readTerraformFile(filePath: string): TerraformFile {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  return {
    path: filePath,
    content,
  };
}

/**
 * Validates that environment_suffix variable is used in resource names
 * @param content - Terraform file content
 * @returns ValidationResult
 */
export function validateEnvironmentSuffixUsage(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if environment_suffix variable is defined
  if (!content.includes('var.environment_suffix')) {
    warnings.push('environment_suffix variable not used in configuration');
  }

  // Check for hardcoded environment names
  const hardcodedPatterns = [
    /[\"\']prod[\"\']/,
    /[\"\']dev[\"\']/,
    /[\"\']staging[\"\']/,
    /[\"\']production[\"\']/i
  ];

  hardcodedPatterns.forEach((pattern) => {
    if (pattern.test(content)) {
      warnings.push(`Potential hardcoded environment name found: ${pattern}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates that resources have proper naming conventions
 * @param content - Terraform file content
 * @returns ValidationResult
 */
export function validateResourceNaming(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Extract resource names
  const resourcePattern = /resource\s+"([^"]+)"\s+"([^"]+)"/g;
  const matches = content.matchAll(resourcePattern);

  for (const match of matches) {
    const resourceType = match[1];
    const resourceName = match[2];

    // Check if resource name follows snake_case convention
    if (!/^[a-z0-9_]+$/.test(resourceName)) {
      warnings.push(`Resource name '${resourceName}' does not follow snake_case convention`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates that S3 buckets have force_destroy enabled
 * @param content - Terraform file content
 * @returns ValidationResult
 */
export function validateS3ForceDestroy(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Find all S3 bucket resources
  const s3BucketPattern = /resource\s+"aws_s3_bucket"\s+"([^"]+)"\s*\{[\s\S]*?\n\}/g;
  const matches = content.matchAll(s3BucketPattern);

  for (const match of matches) {
    const resourceName = match[1];
    const blockContent = match[0];

    if (!blockContent.includes('force_destroy')) {
      warnings.push(`S3 bucket '${resourceName}' missing force_destroy attribute`);
    } else if (blockContent.includes('force_destroy = false')) {
      errors.push(`S3 bucket '${resourceName}' has force_destroy set to false`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates KMS key configuration
 * @param content - Terraform file content
 * @returns ValidationResult
 */
export function validateKMSConfiguration(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Find all KMS key resources
  const kmsPattern = /resource\s+"aws_kms_key"\s+"([^"]+)"\s*\{[\s\S]*?\n\}/g;
  const matches = content.matchAll(kmsPattern);

  for (const match of matches) {
    const resourceName = match[1];
    const blockContent = match[0];

    if (!blockContent.includes('enable_key_rotation')) {
      warnings.push(`KMS key '${resourceName}' missing key rotation setting`);
    }

    if (!blockContent.includes('deletion_window_in_days')) {
      warnings.push(`KMS key '${resourceName}' missing deletion window setting`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates complete Terraform configuration
 * @param filePath - Path to main Terraform file
 * @returns ValidationResult
 */
export function validateTerraformConfiguration(filePath: string): ValidationResult {
  const file = readTerraformFile(filePath);
  const results: ValidationResult[] = [
    validateEnvironmentSuffixUsage(file.content),
    validateResourceNaming(file.content),
    validateS3ForceDestroy(file.content),
    validateKMSConfiguration(file.content),
  ];

  const allErrors = results.flatMap((r) => r.errors);
  const allWarnings = results.flatMap((r) => r.warnings);

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}
