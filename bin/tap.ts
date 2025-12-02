#!/usr/bin/env node
/**
 * Pulumi application entry point for the TAP CI/CD Pipeline infrastructure.
 *
 * This module configures and instantiates the TapStack with CI/CD pipeline components
 * including CodePipeline, CodeBuild, S3 buckets, IAM roles, and CloudWatch Logs.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Get configuration from Pulumi config and environment variables
const config = new pulumi.Config();
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

// GitHub configuration (required for pipeline)
const githubOwner = config.require('githubOwner');
const githubRepo = config.require('githubRepo');
const githubBranch = config.get('githubBranch') || 'main';
const githubToken = config.requireSecret('githubToken');

// Get metadata from environment variables for tagging purposes
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
  Project: 'TAP',
  ManagedBy: 'Pulumi',
};

// Configure AWS provider with default tags
const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

// Instantiate the CI/CD pipeline stack
const stack = new TapStack(
  'tap-cicd-stack',
  {
    environmentSuffix,
    githubOwner,
    githubRepo,
    githubBranch,
    githubToken,
    tags: defaultTags,
  },
  { provider }
);

// Export stack outputs for easy access
export const artifactBucket = stack.artifactBucketName;
export const deployBucket = stack.deployBucketName;
export const codeBuildProject = stack.codeBuildProjectName;
export const pipelineExecutionUrl = stack.pipelineUrl;
