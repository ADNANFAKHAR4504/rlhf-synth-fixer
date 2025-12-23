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
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);

// Export all stack outputs for use by tests and other consumers
// Primary region
export const primaryVpcId = stack.primaryVpcId;
export const primaryPublicSubnetIds = stack.primaryPublicSubnetIds;
export const primaryPrivateSubnetIds = stack.primaryPrivateSubnetIds;
export const primaryAuroraEndpoint = stack.primaryAuroraEndpoint;
export const primaryAuroraReaderEndpoint = stack.primaryAuroraReaderEndpoint;
export const primaryLambdaArn = stack.primaryLambdaArn;
export const primaryLambdaName = stack.primaryLambdaName;
export const primaryEventBridgeRuleArn = stack.primaryEventBridgeRuleArn;
export const primarySnsTopicArn = stack.primarySnsTopicArn;

// Secondary region
export const secondaryVpcId = stack.secondaryVpcId;
export const secondaryPublicSubnetIds = stack.secondaryPublicSubnetIds;
export const secondaryPrivateSubnetIds = stack.secondaryPrivateSubnetIds;
export const secondaryAuroraEndpoint = stack.secondaryAuroraEndpoint;
export const secondaryAuroraReaderEndpoint =
  stack.secondaryAuroraReaderEndpoint;
export const secondaryLambdaArn = stack.secondaryLambdaArn;
export const secondaryLambdaName = stack.secondaryLambdaName;
export const secondaryEventBridgeRuleArn = stack.secondaryEventBridgeRuleArn;
export const secondarySnsTopicArn = stack.secondarySnsTopicArn;

// Global resources
export const dynamoDbTableName = stack.dynamoDbTableName;
export const dynamoDbTableArn = stack.dynamoDbTableArn;
export const route53ZoneId = stack.route53ZoneId;
export const route53NameServers = stack.route53NameServers;
export const vpcPeeringConnectionId = stack.vpcPeeringConnectionId;
