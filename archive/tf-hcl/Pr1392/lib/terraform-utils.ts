// terraform-utils.ts
// Utility functions for Terraform infrastructure validation and testing

export interface TerraformResource {
  type: string;
  name: string;
  properties: Record<string, any>;
}

export interface TerraformOutput {
  value: string;
  description?: string;
}

export interface TerraformVariable {
  type: string;
  description?: string;
  default?: any;
}

/**
 * Validates Terraform resource naming convention
 * @param resourceName - The resource name to validate
 * @param namePrefix - Expected name prefix
 * @returns boolean indicating if naming is valid
 */
export function validateResourceNaming(
  resourceName: string,
  namePrefix: string
): boolean {
  if (!resourceName || !namePrefix) {
    return false;
  }

  // Check if resource name starts with name prefix
  return resourceName.startsWith(namePrefix);
}

/**
 * Extracts resource configuration from Terraform content
 * @param terraformContent - Raw Terraform file content
 * @param resourceType - Type of resource to extract
 * @returns Array of resource configurations
 */
export function extractTerraformResources(
  terraformContent: string,
  resourceType: string
): TerraformResource[] {
  const resources: TerraformResource[] = [];

  // Basic regex to find resource blocks
  const resourceRegex = new RegExp(
    `resource\\s+"${resourceType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s+"([^"]+)"\\s*{`,
    'g'
  );

  let match;
  while ((match = resourceRegex.exec(terraformContent)) !== null) {
    resources.push({
      type: resourceType,
      name: match[1],
      properties: {}, // Would need more complex parsing for full properties
    });
  }

  return resources;
}

/**
 * Validates that a Terraform file contains required variables
 * @param terraformContent - Raw Terraform file content
 * @param requiredVariables - Array of variable names that must be present
 * @returns boolean indicating if all required variables are present
 */
export function validateRequiredVariables(
  terraformContent: string,
  requiredVariables: string[]
): boolean {
  return requiredVariables.every(varName => {
    const varRegex = new RegExp(
      `variable\\s+"${varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s*{`
    );
    return varRegex.test(terraformContent);
  });
}

/**
 * Extracts output definitions from Terraform content
 * @param terraformContent - Raw Terraform file content
 * @returns Object with output names as keys
 */
export function extractTerraformOutputs(
  terraformContent: string
): Record<string, TerraformOutput> {
  const outputs: Record<string, TerraformOutput> = {};

  // Basic regex to find output blocks
  const outputRegex = /output\s+"([^"]+)"\s*{[^}]*value\s*=\s*([^}]+)}/g;

  let match;
  while ((match = outputRegex.exec(terraformContent)) !== null) {
    outputs[match[1]] = {
      value: match[2].trim(),
      description: undefined, // Would need more parsing for descriptions
    };
  }

  return outputs;
}

/**
 * Validates IAM policy structure for least privilege
 * @param policyDocument - IAM policy document as string
 * @returns Object with validation results
 */
export function validateIAMPolicy(policyDocument: string): {
  isValid: boolean;
  hasWildcardActions: boolean;
  hasWildcardResources: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  let isValid = true;
  let hasWildcardActions = false;
  let hasWildcardResources = false;

  try {
    // Check for wildcard actions
    if (
      policyDocument.includes('Action = "*"') ||
      policyDocument.includes('"Action": "*"') ||
      policyDocument.includes('"Action":["*"]')
    ) {
      hasWildcardActions = true;
      issues.push('Policy contains wildcard actions');
      isValid = false;
    }

    // Check for wildcard resources
    if (
      policyDocument.includes('Resource = "*"') ||
      policyDocument.includes('"Resource": "*"') ||
      policyDocument.includes('"Resource":["*"]')
    ) {
      hasWildcardResources = true;
      issues.push('Policy contains wildcard resources');
      isValid = false;
    }

    // Basic JSON validation
    if (policyDocument.includes('jsonencode')) {
      // Extract JSON from jsonencode()
      const jsonMatch = policyDocument.match(/jsonencode\(([^)]+)\)/);
      if (jsonMatch) {
        // This would need more sophisticated parsing in practice
        const jsonContent = jsonMatch[1];
        if (
          !jsonContent.includes('Version') ||
          !jsonContent.includes('Statement')
        ) {
          issues.push('Policy missing required Version or Statement');
          isValid = false;
        }
      }
    } else {
      // For non-jsonencode content, mark as invalid
      if (
        !policyDocument.includes('Version') &&
        !policyDocument.includes('Statement')
      ) {
        issues.push('Policy missing required Version or Statement');
        isValid = false;
      }
    }
  } catch (error) {
    issues.push('Policy document parsing error');
    isValid = false;
  }

  return {
    isValid,
    hasWildcardActions,
    hasWildcardResources,
    issues,
  };
}

/**
 * Generates expected resource names based on naming convention
 * @param namePrefix - Base name prefix
 * @param resourceType - Type of AWS resource
 * @returns Expected resource name
 */
export function generateResourceName(
  namePrefix: string,
  resourceType: string
): string {
  const typeMapping: Record<string, string> = {
    lambda: 'fn',
    secret: 'config',
    role: 'role',
    api: '',
    loggroup: '',
  };

  const suffix = typeMapping[resourceType];
  if (suffix === '') {
    return namePrefix;
  } else if (suffix) {
    return `${namePrefix}-${suffix}`;
  } else {
    return `${namePrefix}-${resourceType}`;
  }
}

/**
 * Validates security best practices in Terraform configuration
 * @param terraformContent - Raw Terraform file content
 * @returns Validation results
 */
export function validateSecurityBestPractices(terraformContent: string): {
  hasEncryption: boolean;
  hasIAMAuthentication: boolean;
  hasProperTagging: boolean;
  hasLogRetention: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  const hasEncryption =
    terraformContent.includes('kms_key') ||
    terraformContent.includes('encryption') ||
    terraformContent.includes('KmsKeyId');

  const hasIAMAuthentication = terraformContent.includes(
    'authorization = "AWS_IAM"'
  );

  const hasProperTagging =
    terraformContent.includes('tags') &&
    terraformContent.includes('common_tags');

  const hasLogRetention = terraformContent.includes('retention_in_days');

  if (!hasEncryption) {
    issues.push('No encryption configuration found');
  }

  if (!hasIAMAuthentication) {
    issues.push('No IAM authentication found for API Gateway');
  }

  if (!hasProperTagging) {
    issues.push('Consistent tagging strategy not implemented');
  }

  if (!hasLogRetention) {
    issues.push('No log retention policy configured');
  }

  return {
    hasEncryption,
    hasIAMAuthentication,
    hasProperTagging,
    hasLogRetention,
    issues,
  };
}

/**
 * Calculates a simple hash for Terraform content to detect changes
 * @param content - Terraform file content
 * @returns Simple hash string
 */
export function calculateContentHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}
