/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration based on the deployment environment. It handles environment-specific settings,
 * tagging, and deployment configuration for AWS resources.
 *
 * The stack created by this module uses environment suffixes to distinguish between
 * different deployment environments (development, staging, production, etc.).
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Initialize Pulumi configuration for the current stack.
const config = new pulumi.Config();

// Get the environment suffix from environment variable first, then Pulumi config, defaulting to 'dev'.
// This allows CI/CD to override using ENVIRONMENT_SUFFIX env var
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository =
  process.env.REPOSITORY || config.get('repository') || 'unknown';
const commitAuthor =
  process.env.COMMIT_AUTHOR || config.get('commitAuthor') || 'unknown';

// Define a set of default tags to apply to all resources.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  ManagedBy: 'Pulumi',
  Project: 'WebApp',
};

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new TapStack('TapStack', {
  environmentSuffix: environmentSuffix,
  tags: defaultTags,
});

// Export stack outputs for easy access
export const loadBalancerDns = stack.loadBalancerDns;
export const bucketName = stack.bucketName;
export const databaseEndpoint = stack.databaseEndpoint;
export const vpcId = stack.vpcId;
export const cacheEndpoint = stack.cacheEndpoint;
export const autoScalingGroupName = stack.autoScalingGroupName;
export const targetGroupArn = stack.targetGroupArn;
export const albSecurityGroupId = stack.albSecurityGroupId;
export const ec2SecurityGroupId = stack.ec2SecurityGroupId;
export const rdsSecurityGroupId = stack.rdsSecurityGroupId;
export const publicSubnet1Id = stack.publicSubnet1Id;
export const publicSubnet2Id = stack.publicSubnet2Id;
export const privateSubnet1Id = stack.privateSubnet1Id;
export const privateSubnet2Id = stack.privateSubnet2Id;
export const ec2RoleArn = stack.ec2RoleArn;
export const instanceProfileName = stack.instanceProfileName;
export const systemLogGroupName = stack.systemLogGroupName;

// To use the stack outputs, you can export them.
// For example, if TapStack had an output `bucketName`:
// export const bucketName = stack.bucketName;
