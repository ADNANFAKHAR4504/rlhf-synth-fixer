// This file provides TypeScript coverage for the CloudFormation template
// Since CloudFormation JSON doesn't have executable code, we validate the template structure

import * as fs from 'fs';
import * as path from 'path';

/**
 * Loads and validates the CloudFormation template
 * @returns The parsed CloudFormation template
 */
export function loadTemplate(): any {
  const templatePath = path.join(__dirname, 'TapStack.json');
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  return JSON.parse(templateContent);
}

/**
 * Validates that the template has the required structure
 * @param template The CloudFormation template to validate
 * @returns True if valid, throws error otherwise
 */
export function validateTemplate(template: any): boolean {
  if (!template.AWSTemplateFormatVersion) {
    throw new Error('Template missing AWSTemplateFormatVersion');
  }

  if (!template.Description) {
    throw new Error('Template missing Description');
  }

  if (!template.Parameters) {
    throw new Error('Template missing Parameters');
  }

  if (!template.Resources) {
    throw new Error('Template missing Resources');
  }

  if (!template.Outputs) {
    throw new Error('Template missing Outputs');
  }

  return true;
}

/**
 * Checks if a resource uses environmentSuffix in its configuration
 * @param resource The resource configuration to check
 * @returns True if environmentSuffix is used
 */
export function usesEnvironmentSuffix(resource: any): boolean {
  const resourceString = JSON.stringify(resource);
  return resourceString.includes('environmentSuffix');
}

/**
 * Gets all resources that use KMS encryption
 * @param template The CloudFormation template
 * @returns Array of resource names that use KMS
 */
export function getKmsEncryptedResources(template: any): string[] {
  const encrypted: string[] = [];

  Object.keys(template.Resources).forEach(resourceName => {
    const resource = template.Resources[resourceName];
    const resourceString = JSON.stringify(resource);

    if (resourceString.includes('KmsKeyId') ||
        resourceString.includes('KmsMasterKeyId') ||
        resourceName === 'HIPAAEncryptionKey') {
      encrypted.push(resourceName);
    }
  });

  return encrypted;
}

/**
 * Gets all resources with HIPAA compliance tags
 * @param template The CloudFormation template
 * @returns Array of resource names with HIPAA tags
 */
export function getHipaaCompliantResources(template: any): string[] {
  const compliant: string[] = [];

  Object.keys(template.Resources).forEach(resourceName => {
    const resource = template.Resources[resourceName];

    if (resource.Properties && resource.Properties.Tags) {
      const hasHipaaTag = resource.Properties.Tags.some(
        (tag: any) => tag.Key === 'Compliance' && tag.Value === 'HIPAA'
      );

      if (hasHipaaTag) {
        compliant.push(resourceName);
      }
    }
  });

  return compliant;
}

/**
 * Validates retention policies for log groups
 * @param template The CloudFormation template
 * @returns Object with retention policy validation results
 */
export function validateRetentionPolicies(template: any): {
  patientData: number;
  security: number;
  audit: number;
  allValid: boolean;
} {
  const patientData = template.Resources.PatientDataLogGroup?.Properties?.RetentionInDays || 0;
  const security = template.Resources.SecurityLogGroup?.Properties?.RetentionInDays || 0;
  const audit = template.Resources.AuditLogGroup?.Properties?.RetentionInDays || 0;

  // HIPAA requirements:
  // - Patient data: at least 90 days
  // - Security: at least 365 days
  // - Audit: at least 7 years (2557 days)
  const allValid = patientData >= 90 && security >= 365 && audit >= 2557;

  return {
    patientData,
    security,
    audit,
    allValid
  };
}

/**
 * Gets all CloudWatch alarms configured in the template
 * @param template The CloudFormation template
 * @returns Array of alarm configurations
 */
export function getAlarms(template: any): Array<{
  name: string;
  metricName: string;
  threshold: number;
}> {
  const alarms: Array<{name: string; metricName: string; threshold: number}> = [];

  Object.keys(template.Resources).forEach(resourceName => {
    const resource = template.Resources[resourceName];

    if (resource.Type === 'AWS::CloudWatch::Alarm') {
      alarms.push({
        name: resourceName,
        metricName: resource.Properties.MetricName,
        threshold: resource.Properties.Threshold
      });
    }
  });

  return alarms;
}

/**
 * Validates that all outputs have exports
 * @param template The CloudFormation template
 * @returns True if all outputs have exports
 */
export function validateOutputExports(template: any): boolean {
  return Object.keys(template.Outputs).every(outputKey => {
    return template.Outputs[outputKey].Export !== undefined;
  });
}

/**
 * Gets all CloudTrail resources configured in the template
 * @param template The CloudFormation template
 * @returns Object with CloudTrail resource details
 */
export function getCloudTrailResources(template: any): {
  trail: any;
  bucket: any;
  logGroup: any;
  metricFilters: string[];
} {
  const trail = template.Resources.HIPAACloudTrail || null;
  const bucket = template.Resources.CloudTrailBucket || null;
  const logGroup = template.Resources.CloudTrailLogGroup || null;

  const metricFilters: string[] = [];
  Object.keys(template.Resources).forEach(resourceName => {
    const resource = template.Resources[resourceName];
    if (resource.Type === 'AWS::Logs::MetricFilter') {
      metricFilters.push(resourceName);
    }
  });

  return {
    trail,
    bucket,
    logGroup,
    metricFilters
  };
}

/**
 * Validates CloudTrail configuration for HIPAA compliance
 * @param template The CloudFormation template
 * @returns Object with validation results
 */
export function validateCloudTrailCompliance(template: any): {
  hasTrail: boolean;
  isMultiRegion: boolean;
  hasLogFileValidation: boolean;
  hasEncryptedBucket: boolean;
  hasCloudWatchIntegration: boolean;
} {
  const trail = template.Resources.HIPAACloudTrail;
  const bucket = template.Resources.CloudTrailBucket;

  if (!trail || !bucket) {
    return {
      hasTrail: false,
      isMultiRegion: false,
      hasLogFileValidation: false,
      hasEncryptedBucket: false,
      hasCloudWatchIntegration: false
    };
  }

  const isMultiRegion = trail.Properties?.IsMultiRegionTrail === true;
  const hasLogFileValidation = trail.Properties?.EnableLogFileValidation === true;
  const hasEncryptedBucket = bucket.Properties?.BucketEncryption !== undefined;
  const hasCloudWatchIntegration = trail.Properties?.CloudWatchLogsLogGroupArn !== undefined;

  return {
    hasTrail: true,
    isMultiRegion,
    hasLogFileValidation,
    hasEncryptedBucket,
    hasCloudWatchIntegration
  };
}

/**
 * Gets all metric filters configured for security monitoring
 * @param template The CloudFormation template
 * @returns Array of metric filter configurations
 */
export function getMetricFilters(template: any): Array<{
  name: string;
  metricName: string;
  filterPattern: string;
}> {
  const filters: Array<{name: string; metricName: string; filterPattern: string}> = [];

  Object.keys(template.Resources).forEach(resourceName => {
    const resource = template.Resources[resourceName];

    if (resource.Type === 'AWS::Logs::MetricFilter') {
      filters.push({
        name: resourceName,
        metricName: resource.Properties.MetricTransformations[0].MetricName,
        filterPattern: resource.Properties.FilterPattern
      });
    }
  });

  return filters;
}
