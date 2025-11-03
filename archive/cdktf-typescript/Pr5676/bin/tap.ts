#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

const app = new App();

// Get environment configuration from environment variables
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const awsRegion = process.env.AWS_REGION || 'eu-west-2';
const stateBucket =
  process.env.STATE_BUCKET || `iac-rlhf-cdktf-states-${awsRegion}`;
const stateBucketRegion = process.env.STATE_BUCKET_REGION || awsRegion;

new TapStack(app, `TapStack${environmentSuffix}`, {
  environmentSuffix,
  stateBucket,
  stateBucketRegion,
  awsRegion,
  defaultTags: {
    tags: {
      Environment: 'production',
      Team: 'platform',
      CostCenter: 'engineering',
      ManagedBy: 'cdktf',
      EnvironmentSuffix: environmentSuffix,
    },
  },
});

app.synth();
