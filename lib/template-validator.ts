import fs from 'fs';
import path from 'path';

/**
 * CloudFormation Template Validator
 * Provides utilities to load, validate, and analyze CloudFormation templates
 */

export interface CloudFormationTemplate {
  AWSTemplateFormatVersion: string;
  Description?: string;
  Metadata?: Record<string, any>;
  Parameters?: Record<string, any>;
  Mappings?: Record<string, any>;
  Conditions?: Record<string, any>;
  Resources: Record<string, any>;
  Outputs?: Record<string, any>;
}

/**
 * Load a CloudFormation template from file
 * @param templateName - Name of the template file (without path)
 * @returns Parsed CloudFormation template
 */
export function loadTemplate(templateName: string): CloudFormationTemplate {
  const templatePath = path.join(__dirname, templateName);
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  return JSON.parse(templateContent) as CloudFormationTemplate;
}

/**
 * Validate that a template has the required CloudFormation structure
 * @param template - CloudFormation template object
 * @returns true if valid, throws error if invalid
 */
export function validateTemplateStructure(template: CloudFormationTemplate): boolean {
  if (!template.AWSTemplateFormatVersion) {
    throw new Error('Template missing AWSTemplateFormatVersion');
  }

  if (template.AWSTemplateFormatVersion !== '2010-09-09') {
    throw new Error('Invalid AWSTemplateFormatVersion');
  }

  if (!template.Resources || Object.keys(template.Resources).length === 0) {
    throw new Error('Template must have at least one resource');
  }

  return true;
}

/**
 * Get all parameters from a template
 * @param template - CloudFormation template object
 * @returns Array of parameter names
 */
export function getParameterNames(template: CloudFormationTemplate): string[] {
  if (!template.Parameters) {
    return [];
  }
  return Object.keys(template.Parameters);
}

/**
 * Get all resources from a template
 * @param template - CloudFormation template object
 * @returns Array of resource logical IDs
 */
export function getResourceNames(template: CloudFormationTemplate): string[] {
  return Object.keys(template.Resources);
}

/**
 * Get all outputs from a template
 * @param template - CloudFormation template object
 * @returns Array of output names
 */
export function getOutputNames(template: CloudFormationTemplate): string[] {
  if (!template.Outputs) {
    return [];
  }
  return Object.keys(template.Outputs);
}

/**
 * Check if a parameter has a default value
 * @param template - CloudFormation template object
 * @param paramName - Parameter name
 * @returns true if parameter has a default value
 */
export function hasDefaultValue(template: CloudFormationTemplate, paramName: string): boolean {
  if (!template.Parameters || !template.Parameters[paramName]) {
    return false;
  }
  return 'Default' in template.Parameters[paramName];
}

/**
 * Get resource type
 * @param template - CloudFormation template object
 * @param resourceName - Resource logical ID
 * @returns AWS resource type (e.g., 'AWS::EC2::VPC')
 */
export function getResourceType(template: CloudFormationTemplate, resourceName: string): string {
  if (!template.Resources[resourceName]) {
    throw new Error(`Resource ${resourceName} not found`);
  }
  return template.Resources[resourceName].Type;
}

/**
 * Check if a resource has a specific tag
 * @param template - CloudFormation template object
 * @param resourceName - Resource logical ID
 * @param tagKey - Tag key to search for
 * @returns true if resource has the tag
 */
export function hasTag(
  template: CloudFormationTemplate,
  resourceName: string,
  tagKey: string
): boolean {
  const resource = template.Resources[resourceName];
  if (!resource || !resource.Properties || !resource.Properties.Tags) {
    return false;
  }

  return resource.Properties.Tags.some((tag: any) => tag.Key === tagKey);
}

/**
 * Get all resources of a specific type
 * @param template - CloudFormation template object
 * @param resourceType - AWS resource type (e.g., 'AWS::EC2::VPC')
 * @returns Array of resource names matching the type
 */
export function getResourcesByType(
  template: CloudFormationTemplate,
  resourceType: string
): string[] {
  return Object.keys(template.Resources).filter(
    (resourceName) => template.Resources[resourceName].Type === resourceType
  );
}

/**
 * Check if a template uses nested stacks
 * @param template - CloudFormation template object
 * @returns true if template contains nested stack resources
 */
export function hasNestedStacks(template: CloudFormationTemplate): boolean {
  return getResourcesByType(template, 'AWS::CloudFormation::Stack').length > 0;
}

/**
 * Validate that all resources have proper naming with environmentSuffix
 * @param template - CloudFormation template object
 * @returns true if all named resources include environmentSuffix
 */
export function validateEnvironmentSuffixUsage(template: CloudFormationTemplate): boolean {
  const resourcesWithNames = Object.keys(template.Resources).filter((resourceName) => {
    const resource = template.Resources[resourceName];
    return resource.Properties && resource.Properties.Tags;
  });

  for (const resourceName of resourcesWithNames) {
    const resource = template.Resources[resourceName];
    const nameTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Name');

    if (nameTag && nameTag.Value && nameTag.Value['Fn::Sub']) {
      if (!nameTag.Value['Fn::Sub'].includes('${EnvironmentSuffix}')) {
        console.warn(`Resource ${resourceName} missing environmentSuffix in Name tag`);
        return false;
      }
    }
  }

  return true;
}

/**
 * Get all conditions defined in a template
 * @param template - CloudFormation template object
 * @returns Array of condition names
 */
export function getConditionNames(template: CloudFormationTemplate): string[] {
  if (!template.Conditions) {
    return [];
  }
  return Object.keys(template.Conditions);
}

/**
 * Check if a resource is conditional
 * @param template - CloudFormation template object
 * @param resourceName - Resource logical ID
 * @returns true if resource has a Condition property
 */
export function isConditionalResource(
  template: CloudFormationTemplate,
  resourceName: string
): boolean {
  const resource = template.Resources[resourceName];
  if (!resource) {
    return false;
  }
  return 'Condition' in resource;
}

/**
 * Get all exports from outputs
 * @param template - CloudFormation template object
 * @returns Array of export names
 */
export function getExportNames(template: CloudFormationTemplate): string[] {
  if (!template.Outputs) {
    return [];
  }

  return Object.keys(template.Outputs)
    .filter((outputName) => template.Outputs![outputName].Export)
    .map((outputName) => {
      const exportValue = template.Outputs![outputName].Export.Name;
      // Handle Fn::Sub
      if (typeof exportValue === 'object' && exportValue['Fn::Sub']) {
        return exportValue['Fn::Sub'];
      }
      return exportValue as string;
    });
}

/**
 * Validate deletion policies for stateful resources
 * @param template - CloudFormation template object
 * @returns Array of resources with missing or incorrect deletion policies
 */
export function validateDeletionPolicies(template: CloudFormationTemplate): string[] {
  const statefulResourceTypes = [
    'AWS::RDS::DBCluster',
    'AWS::ElastiCache::ReplicationGroup',
    'AWS::S3::Bucket',
  ];

  const issues: string[] = [];

  Object.keys(template.Resources).forEach((resourceName) => {
    const resource = template.Resources[resourceName];
    if (statefulResourceTypes.includes(resource.Type)) {
      // RDS clusters and ElastiCache should have Snapshot policy
      // Note: DBInstances inherit deletion policy from their cluster
      if (
        resource.Type === 'AWS::RDS::DBCluster' ||
        resource.Type === 'AWS::ElastiCache::ReplicationGroup'
      ) {
        if (resource.DeletionPolicy !== 'Snapshot') {
          issues.push(`${resourceName}: Expected DeletionPolicy: Snapshot`);
        }
      }
    }
  });

  return issues;
}
