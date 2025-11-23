/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */


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
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Get configuration
const config = new pulumi.Config();

// Get the environment suffix from Pulumi config or environment variables, defaulting to 'dev'.
const environmentSuffix = config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Define a set of default tags to apply to all resources.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
};

// Configure AWS provider with default tags
const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new TapStack(
  'pulumi-infra',
  {
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);

// Export all stack outputs for easy access
export const vpcId = stack.vpcId;
export const publicSubnetIds = stack.publicSubnetIds;
export const privateSubnetIds = stack.privateSubnetIds;
export const clusterName = stack.clusterName;
export const clusterEndpoint = stack.clusterEndpoint;
export const clusterVersion = stack.clusterVersion;
export const oidcProviderUrl = stack.oidcProviderUrl;
export const oidcProviderArn = stack.oidcProviderArn;
export const kubeconfig = stack.kubeconfig;
export const onDemandNodeGroupName = stack.onDemandNodeGroupName;
export const spotNodeGroupName = stack.spotNodeGroupName;
export const nodeGroupRoleArn = stack.nodeGroupRoleArn;
export const fargateProfileName = stack.fargateProfileName;
export const fargateRoleArn = stack.fargateRoleArn;
export const devRoleArn = stack.devRoleArn;
export const stagingRoleArn = stack.stagingRoleArn;
export const prodRoleArn = stack.prodRoleArn;
export const clusterAutoscalerRoleArn = stack.clusterAutoscalerRoleArn;
export const albControllerRoleArn = stack.albControllerRoleArn;
