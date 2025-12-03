/**
 * Pulumi application entry point for the CI/CD Pipeline infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration based on the deployment environment.
 */
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Get the environment suffix from environment variables, defaulting to 'dev'.
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get metadata from environment variables for tagging purposes.
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// GitHub configuration
const githubOwner = process.env.GITHUB_OWNER || 'example-org';
const githubRepo = process.env.GITHUB_REPO || 'example-repo';
const githubBranch = process.env.GITHUB_BRANCH || 'main';

// Notification email
const notificationEmail =
  process.env.NOTIFICATION_EMAIL || 'devops@example.com';

// Define default tags
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
  Project: 'CI/CD Pipeline',
};

// Configure AWS provider with default tags
const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

// Instantiate the main stack
const stack = new TapStack(
  'pulumi-infra',
  {
    environmentSuffix,
    tags: defaultTags,
    githubOwner,
    githubRepo,
    githubBranch,
    notificationEmail,
  },
  { provider }
);

// Export outputs
export const pipelineArn = stack.pipelineArn;
export const artifactBucketName = stack.artifactBucketName;
export const lambdaFunctionArn = stack.lambdaFunctionArn;
