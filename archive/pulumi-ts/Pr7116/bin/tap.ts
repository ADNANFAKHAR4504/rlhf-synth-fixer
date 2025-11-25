/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the infrastructure with appropriate
 * configuration based on the deployment environment. It handles environment-specific settings,
 * tagging, and deployment configuration for AWS resources.
 *
 * The stack created by this module uses environment suffixes to distinguish between
 * different deployment environments (development, staging, production, etc.).
 */

import * as infra from '../lib/tap-stack';

// Export stack outputs from the infrastructure
export const vpcId = infra.vpcId;
export const vpcCidr = infra.vpcCidr;
export const publicSubnetIds = infra.publicSubnetIds;
export const privateSubnetIds = infra.privateSubnetIds;
export const ecsClusterArn = infra.ecsClusterArn;
export const ecsClusterName = infra.ecsClusterName;
export const ecsTaskExecutionRoleArn = infra.ecsTaskExecutionRoleArn;
export const ecsTaskRoleArn = infra.ecsTaskRoleArn;
export const ecsSecurityGroupId = infra.ecsSecurityGroupId;
export const auroraClusterArn = infra.auroraClusterArn;
export const auroraClusterEndpoint = infra.auroraClusterEndpoint;
export const auroraClusterReaderEndpoint = infra.auroraClusterReaderEndpoint;
export const auroraSecurityGroupId = infra.auroraSecurityGroupId;
export const dbSecretArn = infra.dbSecretArn;
export const kmsKeyArn = infra.kmsKeyArn;
export const kmsKeyId = infra.kmsKeyId;
export const rawDataBucketName = infra.rawDataBucketName;
export const rawDataBucketArn = infra.rawDataBucketArn;
export const processedDataBucketName = infra.processedDataBucketName;
export const processedDataBucketArn = infra.processedDataBucketArn;
export const kinesisStreamArn = infra.kinesisStreamArn;
export const kinesisStreamName = infra.kinesisStreamName;
export const ecsLogGroupName = infra.ecsLogGroupName;
export const backupVaultArn = infra.backupVaultArn;
export const backupPlanId = infra.backupPlanId;
