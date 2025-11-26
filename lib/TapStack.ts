import * as fs from 'fs';
import * as path from 'path';

/**
 * CloudFormation Fraud Detection Pipeline Template
 *
 * This module provides functions to validate and export the CloudFormation template.
 * It serves as a wrapper around the TapStack.json template for testing and validation.
 */

export interface CloudFormationTemplate {
  AWSTemplateFormatVersion: string;
  Description: string;
  Parameters: Record<string, any>;
  Resources: Record<string, any>;
  Outputs: Record<string, any>;
}

/**
 * Load and parse the CloudFormation template from JSON file
 * @returns Parsed CloudFormation template object
 */
export function loadTemplate(): CloudFormationTemplate {
  const templatePath = path.join(__dirname, 'TapStack.json');
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  return JSON.parse(templateContent) as CloudFormationTemplate;
}

/**
 * Validate template structure
 * @param template CloudFormation template to validate
 * @returns true if template is valid
 */
export function validateTemplate(template: CloudFormationTemplate): boolean {
  if (!template.AWSTemplateFormatVersion) {
    throw new Error('Missing AWSTemplateFormatVersion');
  }

  if (template.AWSTemplateFormatVersion !== '2010-09-09') {
    throw new Error('Invalid CloudFormation version');
  }

  if (!template.Resources || Object.keys(template.Resources).length === 0) {
    throw new Error('Template must have at least one resource');
  }

  return true;
}

/**
 * Get resource by logical ID
 * @param template CloudFormation template
 * @param logicalId Resource logical ID
 * @returns Resource definition or undefined
 */
export function getResource(
  template: CloudFormationTemplate,
  logicalId: string
): any {
  return template.Resources[logicalId];
}

/**
 * Get all resources of a specific type
 * @param template CloudFormation template
 * @param resourceType AWS resource type (e.g., 'AWS::Lambda::Function')
 * @returns Array of matching resources with their logical IDs
 */
export function getResourcesByType(
  template: CloudFormationTemplate,
  resourceType: string
): Array<{ logicalId: string; resource: any }> {
  const results: Array<{ logicalId: string; resource: any }> = [];

  for (const [logicalId, resource] of Object.entries(template.Resources)) {
    if (resource.Type === resourceType) {
      results.push({ logicalId, resource });
    }
  }

  return results;
}

/**
 * Validate resource naming convention
 * @param resourceName Resource name
 * @param environmentSuffix Environment suffix
 * @returns true if naming convention is valid
 */
export function validateResourceNaming(
  resourceName: any,
  environmentSuffix: string
): boolean {
  if (
    typeof resourceName === 'object' &&
    resourceName !== null &&
    resourceName['Fn::Sub']
  ) {
    const pattern = resourceName['Fn::Sub'];
    return (
      pattern.includes('${EnvironmentSuffix}') ||
      pattern.includes(environmentSuffix)
    );
  }

  if (typeof resourceName === 'string') {
    return resourceName.includes(environmentSuffix);
  }

  return false;
}

/**
 * Get parameter value or default
 * @param template CloudFormation template
 * @param parameterName Parameter name
 * @returns Parameter default value or undefined
 */
export function getParameterDefault(
  template: CloudFormationTemplate,
  parameterName: string
): any {
  const param = template.Parameters[parameterName];
  return param?.Default;
}

/**
 * Validate all resources have required tags
 * @param template CloudFormation template
 * @param requiredTags Array of required tag keys
 * @returns Array of resources missing required tags
 */
export function validateResourceTags(
  template: CloudFormationTemplate,
  requiredTags: string[]
): string[] {
  const missingTags: string[] = [];

  for (const [logicalId, resource] of Object.entries(template.Resources)) {
    const tags = resource.Properties?.Tags;

    if (!tags) {
      missingTags.push(logicalId);
      continue;
    }

    const tagKeys = tags.map((tag: any) => tag.Key);

    for (const requiredTag of requiredTags) {
      if (!tagKeys.includes(requiredTag)) {
        missingTags.push(`${logicalId} (missing ${requiredTag})`);
      }
    }
  }

  return missingTags;
}

/**
 * Check if resource has deletion protection
 * @param resource CloudFormation resource
 * @returns true if resource has Retain or DeletionProtection enabled
 */
export function hasRetainPolicy(resource: any): boolean {
  return (
    resource.DeletionPolicy === 'Retain' ||
    resource.UpdateReplacePolicy === 'Retain' ||
    resource.Properties?.DeletionProtectionEnabled === true
  );
}

/**
 * Get all outputs
 * @param template CloudFormation template
 * @returns Array of output names
 */
export function getOutputs(template: CloudFormationTemplate): string[] {
  return Object.keys(template.Outputs || {});
}

/**
 * Validate encryption settings
 * @param template CloudFormation template
 * @returns Array of resources without encryption
 */
export function validateEncryption(template: CloudFormationTemplate): string[] {
  const unencrypted: string[] = [];

  for (const [logicalId, resource] of Object.entries(template.Resources)) {
    if (resource.Type === 'AWS::DynamoDB::Table') {
      if (!resource.Properties?.SSESpecification?.SSEEnabled) {
        unencrypted.push(logicalId);
      }
    } else if (resource.Type === 'AWS::S3::Bucket') {
      if (!resource.Properties?.BucketEncryption) {
        unencrypted.push(logicalId);
      }
    }
  }

  return unencrypted;
}

// Export the template as default
export default loadTemplate();
