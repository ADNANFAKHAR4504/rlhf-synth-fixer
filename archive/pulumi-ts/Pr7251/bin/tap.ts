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

// Export all stack outputs for easy access and testing
// VPC and Network Outputs
export const primaryVpcId = stack.primaryVpcId;
export const drVpcId = stack.drVpcId;
export const vpcPeeringConnectionId = stack.vpcPeeringConnectionId;
export const primaryPublicSubnetIds = stack.primaryPublicSubnetIds;
export const primaryPrivateSubnetIds = stack.primaryPrivateSubnetIds;
export const drPublicSubnetIds = stack.drPublicSubnetIds;
export const drPrivateSubnetIds = stack.drPrivateSubnetIds;

// Database Outputs
export const globalClusterId = stack.globalClusterId;
export const primaryDbEndpoint = stack.primaryDbEndpoint;
export const drDbEndpoint = stack.drDbEndpoint;
export const primaryDbClusterId = stack.primaryDbClusterId;
export const drDbClusterId = stack.drDbClusterId;

// Compute Outputs
export const primaryAlbEndpoint = stack.primaryAlbEndpoint;
export const failoverEndpoint = stack.failoverEndpoint;
export const primaryAlbDnsName = stack.primaryAlbDnsName;
export const drAlbDnsName = stack.drAlbDnsName;
export const primaryLambdaName = stack.primaryLambdaName;
export const drLambdaName = stack.drLambdaName;
export const primaryLambdaArn = stack.primaryLambdaArn;
export const drLambdaArn = stack.drLambdaArn;

// Storage Outputs
export const primaryBucketName = stack.primaryBucketName;
export const drBucketName = stack.drBucketName;
export const primaryBucketArn = stack.primaryBucketArn;
export const drBucketArn = stack.drBucketArn;

// Route53 and Health Check Outputs
export const route53ZoneId = stack.route53ZoneId;
export const primaryEndpoint = stack.primaryEndpoint;
export const primaryHealthCheckId = stack.primaryHealthCheckId;
export const drHealthCheckId = stack.drHealthCheckId;

// EventBridge Outputs
export const primaryEventBusName = stack.primaryEventBusName;
export const drEventBusName = stack.drEventBusName;
export const primaryEventBusArn = stack.primaryEventBusArn;
export const drEventBusArn = stack.drEventBusArn;

// Monitoring Outputs
export const alarmTopicArn = stack.alarmTopicArn;
export const dashboardUrl = stack.dashboardUrl;
export const dashboardName = stack.dashboardName;
