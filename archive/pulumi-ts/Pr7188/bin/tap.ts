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
    region: process.env.AWS_REGION || 'us-east-1',
  },
  { provider }
);

// Export stack outputs (only outputs that exist in the current TapStack)
export const secretArn = stack.secretArn;
export const vpcId = stack.vpcId;
export const clusterEndpoint = stack.clusterEndpoint;

// The following exports are from a more comprehensive infrastructure template
// and should be added as the corresponding resources are implemented in tap-stack.ts:
// export const vpcCidr = stack.vpcCidr;
// export const internetGatewayId = stack.internetGatewayId;
// export const publicSubnetIds = stack.publicSubnetIds;
// export const privateSubnetIds = stack.privateSubnetIds;
// export const databaseSubnetIds = stack.databaseSubnetIds;
// export const natInstanceIds = stack.natInstanceIds;
// export const natInstancePrivateIps = stack.natInstancePrivateIps;
// export const webSecurityGroupId = stack.webSecurityGroupId;
// export const appSecurityGroupId = stack.appSecurityGroupId;
// export const databaseSecurityGroupId = stack.databaseSecurityGroupId;
// export const flowLogsBucketName = stack.flowLogsBucketName;
// export const flowLogsLogGroupName = stack.flowLogsLogGroupName;
// export const s3EndpointId = stack.s3EndpointId;

// EKS Cluster outputs (to be implemented):
// export const clusterName = stack.clusterName;
// export const clusterVersion = stack.clusterVersion;
// export const oidcIssuerUrl = stack.oidcIssuerUrl;
// export const kubeconfig = stack.kubeconfig;

// KMS outputs (to be implemented):
// export const kmsKeyId = stack.kmsKeyId;
// export const kmsKeyAliasName = stack.kmsKeyAliasName;
// export const kmsKeyArn = stack.kmsKeyArn;

// Route outputs (to be implemented):
// export const publicRouteId = stack.publicRouteId;

// Addon outputs (to be implemented):
// export const coreDnsAddonVersion = stack.coreDnsAddonVersion;
// export const kubeProxyAddonVersion = stack.kubeProxyAddonVersion;
// export const vpcCniAddonVersion = stack.vpcCniAddonVersion;
