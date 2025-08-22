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

// Get the environment suffix from the Pulumi config, defaulting to 'dev'.
// You can set this value using the command: `pulumi config set env <value>`
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Define a set of default tags to apply to all resources.
// While not explicitly used in the TapStack instantiation here,
// this is the standard place to define them. They would typically be passed
// into the TapStack or configured on the AWS provider.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

// Configure AWS Provider with explicit region (us-west-1 as per requirements)
const awsProvider = new aws.Provider('aws-provider', {
  region: 'us-west-1',
  defaultTags: {
    tags: defaultTags,
  },
});

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const tapStack = new TapStack(
  'pulumi-infra',
  {
    environment: environmentSuffix,
    tags: defaultTags,
  },
  {
    provider: awsProvider,
  }
);

// Export all required outputs from the TapStack
export const vpcId = tapStack.secureWebApp.vpc.id;
export const publicSubnetId = tapStack.secureWebApp.publicSubnet.id;
export const privateSubnetId = tapStack.secureWebApp.privateSubnet.id;
export const rdsEndpoint = tapStack.secureWebApp.rdsInstance.endpoint;
export const rdsPort = tapStack.secureWebApp.rdsInstance.port;
export const ec2InstanceId = tapStack.secureWebApp.ec2Instance.id;
export const ec2PublicIp = tapStack.secureWebApp.ec2Instance.publicIp;
export const ec2PrivateIp = tapStack.secureWebApp.ec2Instance.privateIp;
export const albDnsName = tapStack.secureWebApp.alb.dnsName;
export const albArn = tapStack.secureWebApp.alb.arn;
export const albZoneId = tapStack.secureWebApp.alb.zoneId;
export const s3BucketName = tapStack.secureWebApp.s3Bucket.bucket;
export const s3BucketArn = tapStack.secureWebApp.s3Bucket.arn;
export const lambdaFunctionName = tapStack.secureWebApp.lambdaFunction.name;
export const lambdaFunctionArn = tapStack.secureWebApp.lambdaFunction.arn;
export const kmsKeyId = tapStack.secureWebApp.kmsKey.keyId;
export const kmsKeyArn = tapStack.secureWebApp.kmsKey.arn;
export const cloudTrailArn = tapStack.secureWebApp.cloudTrail.arn;
export const rdsSecretArn = tapStack.secureWebApp.rdsSecret.arn;
export const sshKeyName = tapStack.secureWebApp.sshKeyPair.keyName;
export const domainUrl = tapStack.secureWebApp.route53Record?.name;
export const applicationUrl = pulumi.interpolate`${domainUrl || 'http://'}${tapStack.secureWebApp.alb.dnsName}`;

// Export Parameter Store paths for configuration
export const parameterStorePaths = {
  databaseName: `/TapStack${environmentSuffix}/app/database/name`,
  databasePort: `/TapStack${environmentSuffix}/app/database/port`,
  environment: `/TapStack${environmentSuffix}/app/environment`,
  region: `/TapStack${environmentSuffix}/app/region`,
};
