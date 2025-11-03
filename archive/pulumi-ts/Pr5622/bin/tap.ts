/**
 * Pulumi application entry point for EC2 cost optimization infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration for EC2 scheduling and cost optimization.
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Initialize Pulumi configuration for the current stack
const config = new pulumi.Config();

// Get the environment suffix from the CI, Pulumi config, defaulting to 'dev'
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

// Get metadata from environment variables for tagging purposes
const repository = config.get('repository') || 'ec2-cost-optimization';
const commitAuthor = config.get('commitAuthor') || 'unknown';

// Define a set of default tags to apply to all resources
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  Project: 'EC2CostOptimization',
};

// Instantiate the main stack component for the infrastructure
const stack = new TapStack('ec2-cost-optimizer', {
  environmentSuffix,
  tags: defaultTags,
});

// Export stack outputs for use by other systems
export const stopLambdaArn = stack.schedulerOutputs.apply(
  outputs => outputs.stopFunctionArn
);
export const startLambdaArn = stack.schedulerOutputs.apply(
  outputs => outputs.startFunctionArn
);
export const stopRuleArn = stack.schedulerOutputs.apply(
  outputs => outputs.stopRuleArn
);
export const startRuleArn = stack.schedulerOutputs.apply(
  outputs => outputs.startRuleArn
);
export const managedInstanceIds = stack.schedulerOutputs.apply(
  outputs => outputs.managedInstanceIds
);
export const estimatedMonthlySavings = stack.costOutputs.apply(
  outputs => outputs.estimatedMonthlySavings
);
