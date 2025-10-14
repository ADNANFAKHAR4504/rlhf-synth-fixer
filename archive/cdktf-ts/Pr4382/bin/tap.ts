#!/usr/bin/env node
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

const app = new App();

// Get environment variables
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stateBucket = process.env.TERRAFORM_STATE_BUCKET || 'iac-rlhf-tf-states';
const stateBucketRegion =
  process.env.TERRAFORM_STATE_BUCKET_REGION || 'us-east-1';
const awsRegion = process.env.AWS_REGION || 'eu-west-1';
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Stack name
const stackName = `TapStack${environmentSuffix}`;

// Default tags
const defaultTags = {
  tags: {
    Environment: environmentSuffix,
    Repository: repositoryName,
    CommitAuthor: commitAuthor,
    Project: 'student-assessment-pipeline',
  },
};

// Create the TapStack
new TapStack(app, stackName, {
  environmentSuffix: environmentSuffix,
  stateBucket: stateBucket,
  stateBucketRegion: stateBucketRegion,
  awsRegion: awsRegion,
  defaultTags: defaultTags,
});

// Synthesize
app.synth();
