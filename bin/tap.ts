/**
 * Pulumi application entry point for the CI/CD Pipeline infrastructure.
 *
 * This module instantiates the TapStack to create an automated CodePipeline
 * with Source, Build, and Deploy stages for continuous integration and deployment.
 */
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Get the environment suffix from environment variables, defaulting to 'dev'.
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get metadata from environment variables for tagging purposes.
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'synth';
const createdAt = new Date().toISOString();

// Define default tags to apply to all resources
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
  ManagedBy: 'Pulumi',
  Project: 'TAP-CICD',
};

// Configure AWS provider with default tags
const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

// GitHub repository configuration
const githubOwner = process.env.GITHUB_OWNER || 'example-org';
const githubRepo = process.env.GITHUB_REPO || 'example-repo';
const githubBranch = process.env.GITHUB_BRANCH || 'main';
const githubTokenSecretName = process.env.GITHUB_TOKEN_SECRET || 'github-token';

// Instantiate the CI/CD pipeline stack
const stack = new TapStack(
  'cicd-pipeline',
  {
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
    githubOwner: githubOwner,
    githubRepo: githubRepo,
    githubBranch: githubBranch,
    githubTokenSecretName: githubTokenSecretName,
  },
  { provider }
);

// Export stack outputs
export const pipelineArn = stack.pipelineArn;
export const pipelineName = stack.pipelineName;
export const artifactBucketName = stack.artifactBucketName;
export const buildProjectName = stack.buildProjectName;
export const deployBucketName = stack.deployBucketName;
