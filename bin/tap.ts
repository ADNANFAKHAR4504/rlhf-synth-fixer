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

// Configure AWS provider for the specified region
const region = config.get('region') || process.env.AWS_REGION || 'us-east-1';
const provider = new aws.Provider('aws-provider', {
  region: region,
});

// Get the environment suffix from the Pulumi config, defaulting to 'dev'.
// You can set this value using the command: `pulumi config set env <value>`
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get configuration values with defaults
const vpcCidr = config.get('vpcCidr') || '10.0.0.0/16';
const instanceType = config.get('instanceType') || 't3.micro';
const dbInstanceClass = config.get('dbInstanceClass') || 'db.t3.micro';
const enableKeyPairs = config.getBoolean('enableKeyPairs') || false;

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository =
  config.get('repository') || process.env.REPOSITORY || 'tap-infrastructure';
const commitAuthor =
  config.get('commitAuthor') || process.env.COMMIT_AUTHOR || 'unknown';

// Define a set of default tags to apply to all resources.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  Project: 'TAP',
  Owner: 'tap-team',
};

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const tapStack = new TapStack(
  'tap-infrastructure',
  {
    environmentSuffix,
    vpcCidr,
    instanceType,
    dbInstanceClass,
    enableKeyPairs,
    tags: defaultTags,
  },
  { provider }
);

// Export stack outputs for integration testing and external access
export const vpcId = tapStack.vpcId;
export const dataBucketName = tapStack.dataBucketName;
export const logsBucketName = tapStack.logsBucketName;
export const databaseEndpoint = tapStack.databaseEndpoint;
export const dbSubnetGroupName = tapStack.dbSubnetGroupName;
export const webInstanceId = tapStack.webInstanceId;
export const webInstancePrivateIp = tapStack.webInstancePrivateIp;
export const stackEnvironmentSuffix = tapStack.environmentSuffix;
export const mainKmsKeyAlias = tapStack.mainKmsKeyAlias;
export const rdsKmsKeyAlias = tapStack.rdsKmsKeyAlias;
export const ec2InstanceProfileName = tapStack.ec2InstanceProfileName;
export const ec2RoleName = tapStack.ec2RoleName;
