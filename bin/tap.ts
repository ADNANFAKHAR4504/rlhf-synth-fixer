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

// 1. Bootstrap backend infra
new BootstrapBackendStack(app, 'BootstrapBackend');

new TapStack(app, stackName, {
  // new prop names (environment instead of environmentSuffix)
  environment,
  stateBucket,
  stateBucketRegion,
  // optional: provider default tags supplement
  defaultTags: {
    tags: {
      Repository: repositoryName,
      CommitAuthor: commitAuthor,
    },
  },
  // optional: set regions here or rely on env vars
  primaryRegion: process.env.AWS_REGION_PRIMARY || 'us-east-1',
  secondaryRegion: process.env.AWS_REGION_SECONDARY || 'eu-west-1',
});

app.synth();
