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

// Get the environment suffix from the Pulumi config, defaulting to 'dev'.
// You can set this value using the command: `pulumi config set env <value>`
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

// Define a set of default tags to apply to all resources.
// While not explicitly used in the TapStack instantiation here,
// this is the standard place to define them. They would typically be passed
// into the TapStack or configured on the AWS provider.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new TapStack('pulumi-infra', {
  tags: defaultTags,
  environmentSuffix: environmentSuffix,
});

// Export all stack outputs for use by other stacks or external systems
// These outputs can be accessed via `pulumi stack output <outputName>`

// Network Infrastructure Outputs
export const vpcId = stack.vpcId;
export const publicSubnetIds = stack.publicSubnetIds;
export const privateSubnetIds = stack.privateSubnetIds;

// Security Group Outputs
export const webSecurityGroupId = stack.webSecurityGroupId;
export const dbSecurityGroupId = stack.dbSecurityGroupId;

// IAM and Access Outputs
export const iamRoleArn = stack.iamRoleArn;
export const instanceProfileName = stack.instanceProfileName;

// Data Storage Outputs
export const dynamoTableName = stack.dynamoTableName;
export const s3BucketName = stack.s3BucketName;

// Encryption Outputs
export const kmsKeyId = stack.kmsKeyId;
export const kmsKeyArn = stack.kmsKeyArn;

// Monitoring and Logging Outputs
export const cloudtrailArn = stack.cloudtrailArn;
export const snsTopicArn = stack.snsTopicArn;

// Security and Compliance Outputs
export const guardDutyDetectorId = stack.guardDutyDetectorId;
export const configDeliveryChannelName = stack.configDeliveryChannelName;

// Infrastructure Metadata Outputs
export const availableAZs = stack.availableAZs;

// Environment Information Output
export const environment = pulumi.output(environmentSuffix);
