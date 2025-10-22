/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 */
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

// Define a set of default tags to apply to all resources.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

// Instantiate the main stack component for the infrastructure.
const stack = new TapStack('pulumi-infra', {
  tags: defaultTags,
  environmentSuffix,
});

// ✅ EXPORT ALL OUTPUTS - This is what was missing!
// Network outputs
export const primaryVpcId = stack.primaryVpcId;
export const privateSubnetIds = stack.privateSubnetIds;
export const publicSubnetIds = stack.publicSubnetIds;
export const transitGatewayId = stack.transitGatewayId;

// Security outputs
export const kmsKeyId = stack.kmsKeyId;
export const kmsKeyArn = stack.kmsKeyArn;
export const secretsManagerArns = stack.secretsManagerArns;
export const cognitoUserPoolId = stack.cognitoUserPoolId;
export const cognitoUserPoolArn = stack.cognitoUserPoolArn;

// Database outputs
export const auroraClusterEndpoint = stack.auroraClusterEndpoint;
export const auroraReaderEndpoint = stack.auroraReaderEndpoint;
export const dynamoDbTableName = stack.dynamoDbTableName;
export const elastiCacheEndpoint = stack.elastiCacheEndpoint;

// Compute outputs
export const ecsClusterArn = stack.ecsClusterArn;
export const ecsClusterName = stack.ecsClusterName;
export const appMeshName = stack.appMeshName;

// API outputs
export const apiGatewayUrl = stack.apiGatewayUrl;
export const apiGatewayId = stack.apiGatewayId;
export const loadBalancerDns = stack.loadBalancerDns;
export const globalAcceleratorDns = stack.globalAcceleratorDns;

// Storage outputs
export const transactionBucketName = stack.transactionBucketName;
export const archiveBucketName = stack.archiveBucketName;

// Messaging outputs
export const transactionQueueUrl = stack.transactionQueueUrl;
export const kinesisStreamName = stack.kinesisStreamName;

// Monitoring outputs
export const dashboardUrl = stack.dashboardUrl;
export const snsTopicArn = stack.snsTopicArn;
