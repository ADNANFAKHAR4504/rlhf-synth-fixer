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

// Get the environment suffix from the Pulumi config, defaulting to 'dev'.
// You can set this value using the command: `pulumi config set env <value>`
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Define a set of default tags to apply to all resources.
// While not explicitly used in the TapStack instantiation here,
// this is the standard place to define them. They would typically be passed
// into the TapStack or configured on the AWS provider.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

// Configure AWS Provider for us-west-2 region
const awsProvider = new aws.Provider('aws', {
  region: 'us-west-2',
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
  { provider: awsProvider }
);

// Export stack outputs for reference
export const vpcId = stack.securityStack.vpcId;
export const albDnsName = stack.securityStack.albDnsName;
export const rdsEndpoint = stack.securityStack.rdsEndpoint;
export const snsTopicArn = stack.securityStack.snsTopicArn;
export const albArn = stack.securityStack.albArn;
export const targetGroupArn = stack.securityStack.targetGroupArn;
export const autoScalingGroupName = stack.securityStack.autoScalingGroupName;
export const launchTemplateId = stack.securityStack.launchTemplateId;
export const wafWebAclArn = stack.securityStack.wafWebAclArn;
export const dbSecurityGroupId = stack.securityStack.dbSecurityGroupId;
export const appSecurityGroupId = stack.securityStack.appSecurityGroupId;
export const albSecurityGroupId = stack.securityStack.albSecurityGroupId;
