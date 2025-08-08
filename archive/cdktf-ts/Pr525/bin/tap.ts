#!/usr/bin/env node
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

const app = new App();

// Get environment variables from the environment or use defaults
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stateBucket = process.env.TERRAFORM_STATE_BUCKET || 'iac-rlhf-tf-states';
const stateBucketRegion =
  process.env.TERRAFORM_STATE_BUCKET_REGION || 'us-east-1';
const awsRegion = process.env.AWS_REGION || 'us-east-1';
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Calculate the stack name
const stackName = `TapStack${environmentSuffix}`;

// Corrected: defaultTags should be a direct map of string keys to string values,
// matching the `defaultTags?: { [key: string]: string };` type in TapStackProps.
// The wrapping into `{ tags: ... }` happens internally within TapStack.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repositoryName,
  CommitAuthor: commitAuthor,
};

// Create the TapStack with the calculated properties
new TapStack(app, stackName, {
  environmentSuffix: environmentSuffix,
  stateBucket: stateBucket,
  stateBucketRegion: stateBucketRegion,
  awsRegion: awsRegion,
  defaultTags: defaultTags, // Now `defaultTags` matches the expected type
});

// Synthesize the app to generate the Terraform configuration
app.synth();
