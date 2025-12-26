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
import { TapStack } from '../lib/tap-stack.mjs';

// Initialize Pulumi configuration for the current stack.
const config = new pulumi.Config();

// Get the environment suffix from the Pulumi config, defaulting to 'dev'.
// You can set this value using the command: `pulumi config set env <value>`
const environmentSuffix = config.get('env') || 'dev';

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

// Create custom AWS provider for LocalStack
// Configure explicit endpoints for LocalStack compatibility
const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
const localstackProvider = new aws.Provider('localstack', {
  region: 'us-east-1',
  accessKey: 'test',
  secretKey: 'test',
  skipCredentialsValidation: true,
  skipRequestingAccountId: true,
  skipMetadataApiCheck: true,
  s3UsePathStyle: true, // Force path-style S3 URLs for LocalStack
  endpoints: [
    { ec2: endpoint },
    { s3: endpoint },
    { iam: endpoint },
    { kms: endpoint },
    { cloudtrail: endpoint },
    { sts: endpoint },
  ],
});

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new TapStack('pulumi-infra', {
  environmentSuffix: environmentSuffix,
  tags: defaultTags,
}, { provider: localstackProvider });

// Export all stack outputs for verification and integration tests
export const bucketName = stack.bucketName;
export const VPCId = stack.vpcId;
export const PublicSubnet1Id = stack.publicSubnet1Id;
export const PublicSubnet2Id = stack.publicSubnet2Id;
export const PrivateSubnet1Id = stack.privateSubnet1Id;
export const PrivateSubnet2Id = stack.privateSubnet2Id;
export const WebSecurityGroupId = stack.webSecurityGroupId;
export const DBSecurityGroupId = stack.dbSecurityGroupId;
export const LogsBucketName = stack.logsBucketName;
export const ApplicationBucketName = stack.applicationBucketName;
export const S3KmsKeyId = stack.s3KmsKeyId;
export const RDSKmsKeyId = stack.rdsKmsKeyId;
