/**
 * Pulumi application entry point for the ECS optimization infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration based on the deployment environment. It handles environment-specific settings,
 * tagging, and deployment configuration for AWS resources.
 *
 * The stack created by this module uses environment suffixes to distinguish between
 * different deployment environments (development, staging, production, etc.).
 */
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Get the environment suffix from environment variables, defaulting to 'dev'.
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Cost center from environment variables
const costCenter = process.env.COST_CENTER || 'engineering';

// Define a set of default tags to apply to all resources.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
  CostCenter: costCenter,
  ManagedBy: 'pulumi',
  Project: 'ecs-optimization',
};

// Configure AWS provider with default tags
const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the ECS optimization infrastructure.
const stack = new TapStack(
  'pulumi-infra',
  {
    environmentSuffix,
    tags: defaultTags,
    costCenter,
  },
  { provider }
);

// Export stack outputs for use by development teams
export const vpcId = stack.vpcId;
export const clusterId = stack.clusterId;
export const clusterName = stack.clusterName;
export const clusterArn = stack.clusterArn;
export const albDnsName = stack.albDnsName;
export const albArn = stack.albArn;
export const targetGroupArn = stack.targetGroupArn;
export const serviceArn = stack.serviceArn;
export const taskDefinitionArn = stack.taskDefinitionArn;
export const launchTemplateId = stack.launchTemplateId;
export const autoScalingGroupName = stack.autoScalingGroupName;
export const capacityProviderName = stack.capacityProviderName;
export const lowCpuAlarmArn = stack.lowCpuAlarmArn;
export const instanceType = stack.instanceType;
