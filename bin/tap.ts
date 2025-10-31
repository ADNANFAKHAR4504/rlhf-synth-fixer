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

// Get the environment suffix from the CI, Pulumi config, defaulting to 'dev'.
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new TapStack('pulumi-infra', {
  tags: {
    Environment: environmentSuffix,
    Project: 'disaster-recovery',
    ManagedBy: 'pulumi',
  },
});

// Export outputs that match your get-outputs.sh expectations
export const vpcId = stack.vpcId;
export const privateSubnetIds = stack.privateSubnetIds;
export const publicSubnetIds = stack.publicSubnetIds;
export const s3BucketName = stack.s3BucketName;
export const primaryDbEndpoint = stack.primaryDbEndpoint;
export const primaryDbIdentifier = stack.primaryDbIdentifier;
export const replicaDbEndpoint = stack.replicaDbEndpoint;
export const replicaDbIdentifier = stack.replicaDbIdentifier;
export const backupBucketPrimaryName = stack.backupBucketPrimaryName;
export const backupBucketReplicaName = stack.backupBucketReplicaName;
export const alertTopicArn = stack.alertTopicArn;
export const healthCheckLambdaArn = stack.healthCheckLambdaArn;
export const failoverLambdaArn = stack.failoverLambdaArn;
export const kmsKeyId = stack.kmsKeyId;
export const dbSecretArn = stack.dbSecretArn;
