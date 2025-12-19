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
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Initialize Pulumi configuration for the current stack.
const config = new pulumi.Config();

// Get the environment suffix from the CI, Pulumi config, defaulting to 'dev'.
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

// Get metadata from environment variables for tagging purposes.
const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

// Get AWS region from config, defaulting to ap-southeast-1
const awsRegion = config.get('awsRegion') || 'ap-southeast-1';

// Define a set of default tags to apply to all resources.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  ManagedBy: 'Pulumi',
};

// Create AWS provider with explicit region configuration
const awsProvider = new aws.Provider('aws-provider', {
  region: awsRegion,
  defaultTags: {
    tags: defaultTags,
  },
});

// Instantiate the main stack component for the infrastructure.
const stack = new TapStack(
  'pulumi-infra',
  {
    environmentSuffix,
    tags: defaultTags,
    notificationEmail: config.get('notificationEmail'),
  },
  {
    provider: awsProvider,
  }
);

// ============================================================
// STACK OUTPUTS
// ============================================================

// API Gateway
export const apiUrl = stack.apiUrl;
export const apiId = stack.apiId;
export const apiStage = stack.apiStage;

// Storage
export const auditBucketName = stack.auditBucketName;
export const auditBucketArn = stack.auditBucketArn;
export const dynamoTableName = stack.dynamoTableName;
export const dynamoTableArn = stack.dynamoTableArn;

// Lambda Functions
export const validatorFunctionName = stack.validatorFunctionName;
export const validatorFunctionArn = stack.validatorFunctionArn;
export const processorFunctionName = stack.processorFunctionName;
export const processorFunctionArn = stack.processorFunctionArn;
export const notifierFunctionName = stack.notifierFunctionName;
export const notifierFunctionArn = stack.notifierFunctionArn;

// Network
export const vpcId = stack.vpcId;
export const vpcCidr = stack.vpcCidr;
export const publicSubnetIds = stack.publicSubnetIds;
export const privateSubnetIds = stack.privateSubnetIds;
export const s3EndpointId = stack.s3EndpointId;
export const dynamodbEndpointId = stack.dynamodbEndpointId;

// Security
export const kmsKeyId = stack.kmsKeyId;
export const kmsKeyArn = stack.kmsKeyArn;
export const kmsKeyAlias = stack.kmsKeyAlias;

// Notifications
export const snsTopicArn = stack.snsTopicArn;
export const snsTopicName = stack.snsTopicName;

// Monitoring
export const dashboardUrl = stack.dashboardUrl;
export const dashboardName = stack.dashboardName;

// Metadata
export const region = awsRegion;
export const environment = environmentSuffix;
