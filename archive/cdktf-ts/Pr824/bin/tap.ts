#!/usr/bin/env node
import { App } from 'cdktf';
import { BootstrapBackendStack } from '../lib/bootstrap-backend-stack';
import { TapStack } from '../lib/tap-stack';

const app = new App();

const environment = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stateBucket = process.env.TERRAFORM_STATE_BUCKET || 'iac-rlhf-tf-states';
const stateBucketRegion =
  process.env.TERRAFORM_STATE_BUCKET_REGION || 'us-east-1';
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

const stackName = `TapStack${environment}`;

// Only create the bootstrap stack if explicitly requested.
// Default is OFF so CI sees exactly one stack.
if (process.env.BOOTSTRAP_BACKEND === 'true') {
  new BootstrapBackendStack(app, 'BootstrapBackend');
}

// Main application stack (always created)
new TapStack(app, stackName, {
  environment,
  stateBucket,
  stateBucketRegion,
  defaultTags: {
    tags: {
      Environment: environment,
      Repository: repositoryName,
      CommitAuthor: commitAuthor,
    },
  },
});

app.synth();
