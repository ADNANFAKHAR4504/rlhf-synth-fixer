#!/usr/bin/env node
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

/* eslint-disable @typescript-eslint/no-unused-vars */
const app = new App();

// Get environment variables from the environment or use defaults
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const _stateBucket = process.env.TERRAFORM_STATE_BUCKET || 'iac-rlhf-tf-states';
const _stateBucketRegion =
  process.env.TERRAFORM_STATE_BUCKET_REGION || 'us-east-1';
const awsRegion = process.env.AWS_REGION || 'us-east-1';
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Calculate the stack name
const stackName = `TapStack${environmentSuffix}`;

// defaultTags is structured in adherence to the TapStackProps interface
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repositoryName,
  CommitAuthor: commitAuthor,
};

// Create the TapStack with the calculated properties
// Note: stateBucket and stateBucketRegion removed for local development/testing
new TapStack(app, stackName, {
  environmentSuffix: environmentSuffix,
  awsRegion: awsRegion,
  defaultTags: {
    Environment: environmentSuffix,
    Repository: repositoryName,
    CommitAuthor: commitAuthor,
  },
});

// Synthesize the app to generate the Terraform configuration
app.synth();
