#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment context
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

// Deploy to multiple regions as required by the task
const regions = ['us-east-1', 'eu-west-1', 'ap-southeast-1'];

regions.forEach(region => {
  new TapStack(app, `TapStack-${region}-${environmentSuffix}`, {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: region,
    },
    description:
      'Multi-region infrastructure with S3 cross-region replication and IAM roles',
    tags: {
      Environment: 'Production',
      Project: 'trainr302',
      Region: region,
    },
  });
});
