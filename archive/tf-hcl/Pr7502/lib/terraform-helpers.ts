// terraform-helpers.ts
// Helper functions for Terraform infrastructure validation and testing

export interface TerraformConfig {
  provider: string;
  backend: string;
  resources: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates that a Terraform configuration includes required components
 */
export function validateTerraformConfig(
  config: TerraformConfig
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config.provider) {
    errors.push('Provider configuration is required');
  }

  if (!config.backend) {
    errors.push('Backend configuration is required');
  }

  if (!config.resources || config.resources.length === 0) {
    warnings.push('No resources defined');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Checks if a resource name includes environment suffix
 */
export function hasEnvironmentSuffix(
  resourceName: string,
  suffix: string
): boolean {
  return resourceName.includes(suffix);
}

/**
 * Validates Lambda configuration for ARM64 architecture
 */
export function validateLambdaArchitecture(architecture: string[]): boolean {
  return architecture.includes('arm64');
}

/**
 * Validates DynamoDB PITR is enabled
 */
export function validatePITR(pitrEnabled: boolean): boolean {
  return pitrEnabled === true;
}

/**
 * Validates Step Functions workflow type
 */
export function validateStepFunctionsType(type: string): boolean {
  return type === 'EXPRESS';
}

/**
 * Validates reserved concurrent executions
 */
export function validateReservedConcurrency(
  concurrency: number,
  expected: number
): boolean {
  return concurrency === expected;
}

/**
 * Parses Terraform outputs
 */
export function parseTerraformOutputs(
  outputsJson: string
): Record<string, any> {
  try {
    return JSON.parse(outputsJson);
  } catch (error) {
    throw new Error(`Failed to parse Terraform outputs: ${error}`);
  }
}

/**
 * Validates IAM policy follows least privilege
 */
export function validateIAMPolicy(policy: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (policy.includes('"Resource": "*"')) {
    warnings.push('IAM policy contains wildcard resource');
  }

  if (policy.includes('"Action": "*"')) {
    errors.push(
      'IAM policy contains wildcard action - violates least privilege'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Extracts environment suffix from resource name
 */
export function extractEnvironmentSuffix(
  resourceName: string,
  prefix: string
): string | null {
  const pattern = new RegExp(`${prefix}-(\\w+)$`);
  const match = resourceName.match(pattern);
  return match ? match[1] : null;
}

/**
 * Validates CloudWatch log retention policy
 */
export function validateLogRetention(
  retentionDays: number,
  minDays: number,
  maxDays: number
): boolean {
  return retentionDays >= minDays && retentionDays <= maxDays;
}

/**
 * Checks if encryption is enabled
 */
export function hasEncryption(kmsKeyId: string | undefined): boolean {
  return !!kmsKeyId && kmsKeyId.length > 0;
}
