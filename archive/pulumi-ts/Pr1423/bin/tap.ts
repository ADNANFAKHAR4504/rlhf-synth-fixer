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

// Configure AWS provider with proper region and settings
const config = new pulumi.Config();
const awsRegion =
  config.get('aws:region') || process.env.AWS_REGION || 'us-east-1';

// Configure AWS provider
const awsProvider = new aws.Provider('aws-provider', {
  region: awsRegion,
  defaultTags: {
    tags: {
      ManagedBy: 'Pulumi',
      Project: 'TAP-CICD',
      Stack: pulumi.getStack(),
    },
  },
});

// Get the environment suffix from the Pulumi stack or config, defaulting to 'dev'.
const environmentSuffix =
  pulumi.getStack() || process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Define a set of default tags to apply to all resources.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  CreatedBy: 'Pulumi',
  Stack: pulumi.getStack(),
  Region: awsRegion,
};

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new TapStack(
  'pulumi-infra',
  {
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
  },
  {
    provider: awsProvider,
  }
);

// Export stack outputs for external consumption
export const pipelineName = stack.pipelineName;
export const codeBuildProjectName = stack.codeBuildProjectName;
export const lambdaFunctionName = stack.lambdaFunctionName;
export const sampleLambdaArn = stack.sampleLambdaArn;
export const artifactsBucketName = stack.artifactsBucketName;
export const slackSecretArn = stack.slackSecretArn;
export const webhookUrl = stack.webhookUrl;
export const region = awsRegion;
export const environment = environmentSuffix;
