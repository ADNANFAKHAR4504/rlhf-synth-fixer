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
import { TapStack } from '../lib/tap-stack';

const normalize = (value: string | undefined, fallback: string): string => {
  if (!value) {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const environmentSuffix = normalize(process.env.ENVIRONMENT_SUFFIX, 'dev');
const primaryRegion = normalize(process.env.AWS_REGION, 'us-east-1');
const secondaryRegion = normalize(
  process.env.SECONDARY_AWS_REGION,
  primaryRegion === 'us-east-1' ? 'us-west-2' : 'us-east-1'
);
const repository = normalize(
  process.env.REPOSITORY ?? process.env.GITHUB_REPOSITORY,
  'unknown'
);
const commitAuthor = normalize(
  process.env.COMMIT_AUTHOR ?? process.env.GITHUB_ACTOR,
  'unknown'
);
const notificationEmails = normalize(process.env.NOTIFICATION_EMAILS, '')
  .split(',')
  .map(email => email.trim())
  .filter(email => email.length > 0);

const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

const stack = new TapStack('pulumi-infra', {
  environmentSuffix,
  primaryRegion,
  secondaryRegion,
  tags: defaultTags,
  notificationEmails: notificationEmails.length
    ? notificationEmails
    : undefined,
});

export const complianceBucketName = stack.complianceBucketName;
export const complianceBucketArn = stack.complianceBucketArn;
export const replicaBucketName = stack.replicaBucketName;
export const replicaBucketArn = stack.replicaBucketArn;
export const snsTopicArn = stack.snsTopicArn;
export const complianceLambdaArn = stack.complianceLambdaArn;
export const replicaLambdaArn = stack.replicaLambdaArn;
export const dashboardName = stack.dashboardName;
export const dashboardUrl = stack.dashboardUrl;
export const securityHubUrl = stack.securityHubUrl;
export const wellArchitectedWorkloadId = stack.wellArchitectedWorkloadId;
export const primaryDeploymentRegion = stack.primaryRegion;
export const secondaryDeploymentRegion = stack.secondaryRegion;
export const environment = environmentSuffix;
