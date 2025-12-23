#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

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

// Set Pulumi configuration values programmatically
const config = new pulumi.Config();

// Set environment suffix if not already configured
try {
  config.require('environmentSuffix');
} catch (error) {
  // Configuration doesn't exist, we need to set it programmatically
  // Note: We'll pass it via environment variables that the stack will read
  pulumi.log.info(`Using environment suffix from ENV: ${environmentSuffix}`);
}

// Instantiate the main stack component for the image processing infrastructure.
// This encapsulates all the Lambda functions, S3 buckets, and related resources.
const stack = new TapStack(
  'tap-stack',
  {
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);

// Export comprehensive deployment outputs for visibility and integration
export const thumbnailFunctionUrl = stack.thumbnailFunctionUrl;
export const watermarkFunctionUrl = stack.watermarkFunctionUrl;
export const metadataFunctionUrl = stack.metadataFunctionUrl;
export const inputBucketName = stack.inputBucketName;
export const outputBucketName = stack.outputBucketName;

// Export environment information
export const environment = environmentSuffix;
export const deploymentRegion = process.env.AWS_REGION || 'us-east-1';
export const deploymentTags = defaultTags;

// Export stack summary for easy reference
export const stackSummary = pulumi.all([
  stack.thumbnailFunctionUrl,
  stack.watermarkFunctionUrl,
  stack.metadataFunctionUrl,
  stack.inputBucketName,
  stack.outputBucketName,
]).apply(([thumbnailUrl, watermarkUrl, metadataUrl, inputBucket, outputBucket]) => ({
  environment: environmentSuffix,
  deploymentRegion: process.env.AWS_REGION || 'us-east-1',
  imageProcessing: {
    thumbnailGenerator: {
      url: thumbnailUrl,
      runtime: 'nodejs20.x',
      architecture: 'arm64',
    },
    watermarkApplier: {
      url: watermarkUrl,
      runtime: 'java21',
      architecture: 'arm64',
      snapStart: 'enabled',
    },
    metadataExtractor: {
      url: metadataUrl,
      runtime: 'nodejs20.x',
      architecture: 'arm64',
    },
  },
  storage: {
    inputBucket: inputBucket,
    outputBucket: outputBucket,
  },
  features: [
    'Lambda Function URLs',
    'ARM64 Architecture',
    'X-Ray Tracing',
    'CloudWatch Logs (7-day retention)',
    'Lambda Layers',
    'SnapStart for Java',
    'CORS Configuration',
  ],
  tags: defaultTags,
  deployedAt: createdAt,
}));
