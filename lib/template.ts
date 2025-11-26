import fs from 'fs';
import path from 'path';

/**
 * CloudFormation Template Module
 * This module exports the CloudFormation template for testing and validation purposes.
 * For pure JSON CloudFormation projects, this wrapper enables proper code coverage tracking.
 */

export interface CloudFormationTemplate {
  AWSTemplateFormatVersion: string;
  Description: string;
  Metadata?: any;
  Parameters?: Record<string, any>;
  Resources: Record<string, any>;
  Outputs?: Record<string, any>;
}

/**
 * Load and return the CloudFormation template
 * @returns CloudFormation template object
 */
export function getTemplate(): CloudFormationTemplate {
  const templatePath = path.join(__dirname, 'TapStack.json');
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  return JSON.parse(templateContent);
}

/**
 * Validate template has required sections
 * @param template CloudFormation template
 * @returns true if valid, false otherwise
 */
export function validateTemplateStructure(
  template: CloudFormationTemplate
): boolean {
  if (!template.AWSTemplateFormatVersion) return false;
  if (!template.Description) return false;
  if (!template.Resources || Object.keys(template.Resources).length === 0)
    return false;
  return true;
}

/**
 * Get all resources of a specific type
 * @param template CloudFormation template
 * @param resourceType AWS resource type (e.g., 'AWS::ECS::Cluster')
 * @returns Array of resource keys matching the type
 */
export function getResourcesByType(
  template: CloudFormationTemplate,
  resourceType: string
): string[] {
  return Object.keys(template.Resources).filter(
    key => template.Resources[key].Type === resourceType
  );
}

/**
 * Check if a resource has proper deletion policies
 * @param template CloudFormation template
 * @param resourceKey Resource logical ID
 * @returns true if resource has Delete policies
 */
export function hasDeletePolicies(
  template: CloudFormationTemplate,
  resourceKey: string
): boolean {
  const resource = template.Resources[resourceKey];
  if (!resource) return false;
  return (
    resource.DeletionPolicy === 'Delete' &&
    resource.UpdateReplacePolicy === 'Delete'
  );
}

/**
 * Check if resource name includes environment suffix
 * @param template CloudFormation template
 * @param resourceKey Resource logical ID
 * @returns true if name property includes environment suffix
 */
export function hasEnvironmentSuffix(
  template: CloudFormationTemplate,
  resourceKey: string
): boolean {
  const resource = template.Resources[resourceKey];
  if (!resource || !resource.Properties) return false;

  const nameProperty = Object.keys(resource.Properties).find(key =>
    key.toLowerCase().includes('name')
  );

  if (!nameProperty) return false;

  const nameValue = resource.Properties[nameProperty];
  if (typeof nameValue === 'object' && nameValue['Fn::Sub']) {
    return nameValue['Fn::Sub'].includes('${EnvironmentSuffix}');
  }

  return false;
}

/**
 * Get all resources with missing Delete policies
 * @param template CloudFormation template
 * @returns Array of resource keys with missing Delete policies
 */
export function getResourcesWithoutDeletePolicies(
  template: CloudFormationTemplate
): string[] {
  return Object.keys(template.Resources).filter(
    key => !hasDeletePolicies(template, key)
  );
}

/**
 * Get all resources missing environment suffix in names
 * @param template CloudFormation template
 * @returns Array of resource keys missing environment suffix
 */
export function getResourcesWithoutEnvironmentSuffix(
  template: CloudFormationTemplate
): string[] {
  return Object.keys(template.Resources).filter(key => {
    const resource = template.Resources[key];
    const hasNameProperty =
      resource.Properties &&
      Object.keys(resource.Properties).some(k =>
        k.toLowerCase().includes('name')
      );
    return hasNameProperty && !hasEnvironmentSuffix(template, key);
  });
}

/**
 * Validate ECS cluster configuration
 * @param template CloudFormation template
 * @returns Validation result
 */
export function validateECSCluster(template: CloudFormationTemplate): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const clusters = getResourcesByType(template, 'AWS::ECS::Cluster');

  if (clusters.length === 0) {
    errors.push('No ECS cluster found');
    return { valid: false, errors };
  }

  const clusterKey = clusters[0];
  const cluster = template.Resources[clusterKey];

  // Check Container Insights
  const settings = cluster.Properties.ClusterSettings;
  if (!settings) {
    errors.push('ClusterSettings missing');
  } else {
    const containerInsights = settings.find(
      (s: any) => s.Name === 'containerInsights'
    );
    if (!containerInsights || containerInsights.Value !== 'enabled') {
      errors.push('Container Insights not enabled');
    }
  }

  // Check deletion policies
  if (!hasDeletePolicies(template, clusterKey)) {
    errors.push('Missing Delete policies on ECS cluster');
  }

  // Check environment suffix
  if (!hasEnvironmentSuffix(template, clusterKey)) {
    errors.push('ECS cluster name missing environment suffix');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate ECS service configuration
 * @param template CloudFormation template
 * @returns Validation result
 */
export function validateECSService(template: CloudFormationTemplate): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const services = getResourcesByType(template, 'AWS::ECS::Service');

  if (services.length === 0) {
    errors.push('No ECS service found');
    return { valid: false, errors };
  }

  const serviceKey = services[0];
  const service = template.Resources[serviceKey];
  const props = service.Properties;

  // Check launch type
  if (props.LaunchType !== 'FARGATE') {
    errors.push(`Launch type should be FARGATE, got ${props.LaunchType}`);
  }

  // Check platform version
  if (props.PlatformVersion !== '1.4.0') {
    errors.push(
      `Platform version should be 1.4.0, got ${props.PlatformVersion}`
    );
  }

  // Check deployment configuration
  const deployConfig = props.DeploymentConfiguration;
  if (!deployConfig) {
    errors.push('DeploymentConfiguration missing');
  } else {
    if (deployConfig.MaximumPercent !== 200) {
      errors.push(
        `MaximumPercent should be 200, got ${deployConfig.MaximumPercent}`
      );
    }
    if (deployConfig.MinimumHealthyPercent !== 100) {
      errors.push(
        `MinimumHealthyPercent should be 100, got ${deployConfig.MinimumHealthyPercent}`
      );
    }
    if (
      !deployConfig.DeploymentCircuitBreaker ||
      !deployConfig.DeploymentCircuitBreaker.Enable
    ) {
      errors.push('Deployment circuit breaker not enabled');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate task definition configuration
 * @param template CloudFormation template
 * @returns Validation result
 */
export function validateTaskDefinition(template: CloudFormationTemplate): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const taskDefs = getResourcesByType(template, 'AWS::ECS::TaskDefinition');

  if (taskDefs.length === 0) {
    errors.push('No task definition found');
    return { valid: false, errors };
  }

  const taskDefKey = taskDefs[0];
  const taskDef = template.Resources[taskDefKey];
  const props = taskDef.Properties;

  // Check CPU and memory
  if (props.Cpu !== '2048') {
    errors.push(`CPU should be 2048, got ${props.Cpu}`);
  }
  if (props.Memory !== '4096') {
    errors.push(`Memory should be 4096, got ${props.Memory}`);
  }

  // Check network mode
  if (props.NetworkMode !== 'awsvpc') {
    errors.push(`NetworkMode should be awsvpc, got ${props.NetworkMode}`);
  }

  // Check Fargate compatibility
  if (
    !props.RequiresCompatibilities ||
    !props.RequiresCompatibilities.includes('FARGATE')
  ) {
    errors.push('FARGATE compatibility not specified');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate auto scaling configuration
 * @param template CloudFormation template
 * @returns Validation result
 */
export function validateAutoScaling(template: CloudFormationTemplate): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check scaling target
  const targets = getResourcesByType(
    template,
    'AWS::ApplicationAutoScaling::ScalableTarget'
  );
  if (targets.length === 0) {
    errors.push('No scaling target found');
  } else {
    const target = template.Resources[targets[0]];
    const props = target.Properties;
    if (props.MinCapacity !== 2) {
      errors.push(`MinCapacity should be 2, got ${props.MinCapacity}`);
    }
    if (props.MaxCapacity !== 10) {
      errors.push(`MaxCapacity should be 10, got ${props.MaxCapacity}`);
    }
  }

  // Check scaling policy
  const policies = getResourcesByType(
    template,
    'AWS::ApplicationAutoScaling::ScalingPolicy'
  );
  if (policies.length === 0) {
    errors.push('No scaling policy found');
  } else {
    const policy = template.Resources[policies[0]];
    const config = policy.Properties.TargetTrackingScalingPolicyConfiguration;
    if (!config) {
      errors.push('TargetTrackingScalingPolicyConfiguration missing');
    } else {
      if (config.TargetValue !== 70.0) {
        errors.push(`Target CPU should be 70%, got ${config.TargetValue}%`);
      }
      if (config.ScaleInCooldown !== 120) {
        errors.push(
          `ScaleInCooldown should be 120, got ${config.ScaleInCooldown}`
        );
      }
      if (config.ScaleOutCooldown !== 120) {
        errors.push(
          `ScaleOutCooldown should be 120, got ${config.ScaleOutCooldown}`
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Run comprehensive template validation
 * @param template CloudFormation template
 * @returns Overall validation result
 */
export function validateTemplate(template: CloudFormationTemplate): {
  valid: boolean;
  errors: string[];
} {
  const allErrors: string[] = [];

  // Basic structure
  if (!validateTemplateStructure(template)) {
    allErrors.push('Invalid template structure');
  }

  // Check for resources without Delete policies
  const resourcesWithoutDelete = getResourcesWithoutDeletePolicies(template);
  if (resourcesWithoutDelete.length > 0) {
    allErrors.push(
      `Resources without Delete policies: ${resourcesWithoutDelete.join(', ')}`
    );
  }

  // Check for resources without environment suffix
  const resourcesWithoutSuffix = getResourcesWithoutEnvironmentSuffix(template);
  if (resourcesWithoutSuffix.length > 0) {
    allErrors.push(
      `Resources without environment suffix: ${resourcesWithoutSuffix.join(', ')}`
    );
  }

  // ECS validation
  const ecsClusterValidation = validateECSCluster(template);
  if (!ecsClusterValidation.valid) {
    allErrors.push(...ecsClusterValidation.errors);
  }

  const ecsServiceValidation = validateECSService(template);
  if (!ecsServiceValidation.valid) {
    allErrors.push(...ecsServiceValidation.errors);
  }

  const taskDefValidation = validateTaskDefinition(template);
  if (!taskDefValidation.valid) {
    allErrors.push(...taskDefValidation.errors);
  }

  const autoScalingValidation = validateAutoScaling(template);
  if (!autoScalingValidation.valid) {
    allErrors.push(...autoScalingValidation.errors);
  }

  return { valid: allErrors.length === 0, errors: allErrors };
}
