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
import { TapStack } from '../lib/tap-stack';

// Get the environment suffix from environment variables, defaulting to 'dev'.
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Get GitHub configuration
const githubToken = process.env.GITHUB_TOKEN;
const githubRepo = process.env.GITHUB_REPO || 'owner/repo';
const githubBranch = process.env.GITHUB_BRANCH || 'main';
const ecsClusterName = process.env.ECS_CLUSTER_NAME || 'app-cluster';
const ecsServiceName = process.env.ECS_SERVICE_NAME || 'app-service';

// Define a set of default tags to apply to all resources.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
};

// Configure AWS provider with default tags
const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

// Instantiate the main stack component for the infrastructure.
const stack = new TapStack(
  'pulumi-infra',
  {
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
    githubToken: githubToken,
    githubRepo: githubRepo,
    githubBranch: githubBranch,
    ecsClusterName: ecsClusterName,
    ecsServiceName: ecsServiceName,
  },
  { provider }
);

// Export stack outputs
export const artifactBucketName = stack.artifactBucketName;
export const ecrRepositoryUrl = stack.ecrRepositoryUrl;
export const pipelineName = stack.pipelineName;
export const snsTopicArn = stack.snsTopicArn;
