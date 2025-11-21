/**
 * Template validator module for CloudFormation template
 * This module provides validation logic that will be tested for coverage
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load and parse the CloudFormation template
 * @returns {Object} Parsed CloudFormation template
 */
export function loadTemplate() {
  const templatePath = join(__dirname, 'template.json');
  const templateContent = readFileSync(templatePath, 'utf-8');
  return JSON.parse(templateContent);
}

/**
 * Validate template structure
 * @param {Object} template - CloudFormation template
 * @returns {Object} Validation result
 */
export function validateTemplateStructure(template) {
  const errors = [];

  if (!template.AWSTemplateFormatVersion) {
    errors.push('Missing AWSTemplateFormatVersion');
  }

  if (!template.Description || template.Description.length === 0) {
    errors.push('Missing or empty Description');
  }

  if (!template.Parameters || typeof template.Parameters !== 'object') {
    errors.push('Missing or invalid Parameters section');
  }

  if (!template.Resources || typeof template.Resources !== 'object') {
    errors.push('Missing or invalid Resources section');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate parameters
 * @param {Object} parameters - Template parameters
 * @returns {Object} Validation result
 */
export function validateParameters(parameters) {
  const errors = [];
  const requiredParams = ['EnvironmentSuffix', 'ContainerImage', 'DBUsername'];

  for (const param of requiredParams) {
    if (!parameters[param]) {
      errors.push(`Missing required parameter: ${param}`);
    }
  }

  // Validate EnvironmentSuffix
  if (parameters.EnvironmentSuffix) {
    if (parameters.EnvironmentSuffix.Type !== 'String') {
      errors.push('EnvironmentSuffix must be of type String');
    }
    if (!parameters.EnvironmentSuffix.AllowedPattern) {
      errors.push('EnvironmentSuffix missing AllowedPattern');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get resources by type
 * @param {Object} resources - Template resources
 * @param {string} type - Resource type
 * @returns {Array} Matching resources
 */
export function getResourcesByType(resources, type) {
  return Object.entries(resources)
    .filter(([_, resource]) => resource.Type === type)
    .map(([name, resource]) => ({ name, ...resource }));
}

/**
 * Validate VPC resources
 * @param {Object} resources - Template resources
 * @returns {Object} Validation result
 */
export function validateVPCResources(resources) {
  const errors = [];

  const vpcs = getResourcesByType(resources, 'AWS::EC2::VPC');
  if (vpcs.length === 0) {
    errors.push('No VPC resource found');
  } else if (vpcs.length > 1) {
    errors.push('Multiple VPC resources found');
  } else {
    const vpc = vpcs[0];
    if (!vpc.Properties.EnableDnsHostnames) {
      errors.push('VPC DNS hostnames not enabled');
    }
    if (!vpc.Properties.EnableDnsSupport) {
      errors.push('VPC DNS support not enabled');
    }
    if (vpc.Properties.CidrBlock !== '10.0.0.0/16') {
      errors.push('VPC CIDR block is not 10.0.0.0/16');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate networking resources
 * @param {Object} resources - Template resources
 * @returns {Object} Validation result
 */
export function validateNetworkingResources(resources) {
  const errors = [];

  const subnets = getResourcesByType(resources, 'AWS::EC2::Subnet');
  if (subnets.length !== 4) {
    errors.push(`Expected 4 subnets, found ${subnets.length}`);
  }

  const natGateways = getResourcesByType(resources, 'AWS::EC2::NatGateway');
  if (natGateways.length !== 2) {
    errors.push(`Expected 2 NAT gateways, found ${natGateways.length}`);
  }

  const igws = getResourcesByType(resources, 'AWS::EC2::InternetGateway');
  if (igws.length !== 1) {
    errors.push(`Expected 1 Internet gateway, found ${igws.length}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate security groups
 * @param {Object} resources - Template resources
 * @returns {Object} Validation result
 */
export function validateSecurityGroups(resources) {
  const errors = [];

  const securityGroups = getResourcesByType(resources, 'AWS::EC2::SecurityGroup');
  if (securityGroups.length < 3) {
    errors.push(`Expected at least 3 security groups, found ${securityGroups.length}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate ECS resources
 * @param {Object} resources - Template resources
 * @returns {Object} Validation result
 */
export function validateECSResources(resources) {
  const errors = [];

  const clusters = getResourcesByType(resources, 'AWS::ECS::Cluster');
  if (clusters.length !== 1) {
    errors.push(`Expected 1 ECS cluster, found ${clusters.length}`);
  }

  const services = getResourcesByType(resources, 'AWS::ECS::Service');
  if (services.length !== 1) {
    errors.push(`Expected 1 ECS service, found ${services.length}`);
  }

  const taskDefs = getResourcesByType(resources, 'AWS::ECS::TaskDefinition');
  if (taskDefs.length !== 1) {
    errors.push(`Expected 1 task definition, found ${taskDefs.length}`);
  } else {
    const taskDef = taskDefs[0];
    if (!taskDef.Properties.RequiresCompatibilities?.includes('FARGATE')) {
      errors.push('Task definition must support FARGATE');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Load Balancer resources
 * @param {Object} resources - Template resources
 * @returns {Object} Validation result
 */
export function validateLoadBalancerResources(resources) {
  const errors = [];

  const albs = getResourcesByType(resources, 'AWS::ElasticLoadBalancingV2::LoadBalancer');
  if (albs.length !== 1) {
    errors.push(`Expected 1 ALB, found ${albs.length}`);
  }

  const targetGroups = getResourcesByType(resources, 'AWS::ElasticLoadBalancingV2::TargetGroup');
  if (targetGroups.length !== 1) {
    errors.push(`Expected 1 target group, found ${targetGroups.length}`);
  } else {
    const tg = targetGroups[0];
    if (tg.Properties.TargetType !== 'ip') {
      errors.push('Target group must have TargetType of ip for Fargate');
    }
  }

  const listeners = getResourcesByType(resources, 'AWS::ElasticLoadBalancingV2::Listener');
  if (listeners.length !== 1) {
    errors.push(`Expected 1 listener, found ${listeners.length}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate RDS resources
 * @param {Object} resources - Template resources
 * @returns {Object} Validation result
 */
export function validateRDSResources(resources) {
  const errors = [];

  const clusters = getResourcesByType(resources, 'AWS::RDS::DBCluster');
  if (clusters.length !== 1) {
    errors.push(`Expected 1 DB cluster, found ${clusters.length}`);
  } else {
    const cluster = clusters[0];
    if (cluster.Properties.Engine !== 'aurora-mysql') {
      errors.push('DB cluster must use aurora-mysql engine');
    }
  }

  const instances = getResourcesByType(resources, 'AWS::RDS::DBInstance');
  if (instances.length !== 1) {
    errors.push(`Expected 1 DB instance, found ${instances.length}`);
  }

  const subnetGroups = getResourcesByType(resources, 'AWS::RDS::DBSubnetGroup');
  if (subnetGroups.length !== 1) {
    errors.push(`Expected 1 DB subnet group, found ${subnetGroups.length}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Secrets Manager resources
 * @param {Object} resources - Template resources
 * @returns {Object} Validation result
 */
export function validateSecretsManagerResources(resources) {
  const errors = [];

  const secrets = getResourcesByType(resources, 'AWS::SecretsManager::Secret');
  if (secrets.length !== 1) {
    errors.push(`Expected 1 secret, found ${secrets.length}`);
  }

  const attachments = getResourcesByType(resources, 'AWS::SecretsManager::SecretTargetAttachment');
  if (attachments.length !== 1) {
    errors.push(`Expected 1 secret attachment, found ${attachments.length}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate IAM resources
 * @param {Object} resources - Template resources
 * @returns {Object} Validation result
 */
export function validateIAMResources(resources) {
  const errors = [];

  const roles = getResourcesByType(resources, 'AWS::IAM::Role');
  if (roles.length < 2) {
    errors.push(`Expected at least 2 IAM roles, found ${roles.length}`);
  }

  // Check for ECS task roles
  const ecsTaskRoles = roles.filter(role =>
    role.Properties.AssumeRolePolicyDocument?.Statement?.[0]?.Principal?.Service?.includes('ecs-tasks.amazonaws.com')
  );

  if (ecsTaskRoles.length < 2) {
    errors.push('Expected at least 2 ECS task-related IAM roles');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check environment suffix usage in resources
 * @param {Object} resources - Template resources
 * @returns {Object} Usage statistics
 */
export function checkEnvironmentSuffixUsage(resources) {
  let totalNamingPoints = 0;
  let usingSuffix = 0;

  for (const [name, resource] of Object.entries(resources)) {
    // Check resource naming properties
    const props = resource.Properties || {};

    // Common naming properties
    const namingProps = [
      'ClusterName', 'Name', 'DBClusterIdentifier', 'DBInstanceIdentifier',
      'LogGroupName', 'FunctionName', 'BucketName', 'TopicName',
      'QueueName', 'TableName', 'LoadBalancerName'
    ];

    for (const prop of namingProps) {
      if (props[prop]) {
        totalNamingPoints++;
        const value = JSON.stringify(props[prop]);
        if (value.includes('EnvironmentSuffix')) {
          usingSuffix++;
        }
      }
    }

    // Check Tags for Name tag
    if (props.Tags) {
      const nameTag = props.Tags.find(t => t.Key === 'Name');
      if (nameTag) {
        totalNamingPoints++;
        const value = JSON.stringify(nameTag.Value);
        if (value.includes('EnvironmentSuffix')) {
          usingSuffix++;
        }
      }
    }
  }

  return {
    totalNamingPoints,
    usingSuffix,
    percentage: totalNamingPoints > 0 ? (usingSuffix / totalNamingPoints) * 100 : 0,
  };
}

/**
 * Validate resource count
 * @param {Object} resources - Template resources
 * @returns {Object} Validation result
 */
export function validateResourceCount(resources) {
  const count = Object.keys(resources).length;
  const errors = [];

  if (count !== 40) {
    errors.push(`Expected 40 resources, found ${count}`);
  }

  return {
    valid: errors.length === 0,
    count,
    errors,
  };
}

/**
 * Validate deletion policies
 * @param {Object} resources - Template resources
 * @returns {Object} Validation result
 */
export function validateDeletionPolicies(resources) {
  const errors = [];
  const warnings = [];

  for (const [name, resource] of Object.entries(resources)) {
    if (resource.DeletionPolicy === 'Retain') {
      errors.push(`Resource ${name} has DeletionPolicy=Retain`);
    }
    if (resource.UpdateReplacePolicy === 'Retain') {
      warnings.push(`Resource ${name} has UpdateReplacePolicy=Retain`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Run all validations
 * @param {Object} template - CloudFormation template
 * @returns {Object} Comprehensive validation results
 */
export function validateAll(template) {
  const results = {
    structure: validateTemplateStructure(template),
    parameters: validateParameters(template.Parameters || {}),
    vpc: validateVPCResources(template.Resources || {}),
    networking: validateNetworkingResources(template.Resources || {}),
    securityGroups: validateSecurityGroups(template.Resources || {}),
    ecs: validateECSResources(template.Resources || {}),
    loadBalancer: validateLoadBalancerResources(template.Resources || {}),
    rds: validateRDSResources(template.Resources || {}),
    secretsManager: validateSecretsManagerResources(template.Resources || {}),
    iam: validateIAMResources(template.Resources || {}),
    resourceCount: validateResourceCount(template.Resources || {}),
    deletionPolicies: validateDeletionPolicies(template.Resources || {}),
    environmentSuffixUsage: checkEnvironmentSuffixUsage(template.Resources || {}),
  };

  const allValid = Object.values(results).every(r =>
    r.valid !== false && r.errors?.length === 0
  );

  return {
    valid: allValid,
    results,
  };
}
