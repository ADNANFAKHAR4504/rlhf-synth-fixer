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
// While not explicitly used in the TapStack instantiation here,
// this is the standard place to define them. They would typically be passed
// into the TapStack or configured on the AWS provider.
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
    tags: defaultTags,
  },
  { provider }
);

// Export all stack outputs for integration tests and external consumption
export const vpcId = stack.vpcId;
export const vpcCidr = stack.vpcCidr;
export const privateSubnetIds = stack.privateSubnetIds;
export const nlbArn = stack.nlbArn;
export const nlbDnsName = stack.nlbDnsName;
export const secretArn = stack.secretArn;
export const secretName = stack.secretName;
export const rotationLambdaArn = stack.rotationLambdaArn;
export const auditLogGroupName = stack.auditLogGroupName;
export const wafWebAclArn = stack.wafWebAclArn;
export const microserviceSecurityGroupId = stack.microserviceSecurityGroupId;
export const ec2LaunchTemplateId = stack.ec2LaunchTemplateId;
export const orchestrationLambdaArn = stack.orchestrationLambdaArn;
export const configParameterName = stack.configParameterName;
