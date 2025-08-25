#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or environment variable
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  'dev';

new TapStack(app, `TapStack${environmentSuffix}`, {
  environmentSuffix,
  env: {
    region: 'us-east-1',
  },
  description: 'Production-ready VPC with EC2 instance in public subnet',
  tags: {
    Environment: environmentSuffix,
    Project: 'TAP',
    Owner: 'DevOps',
  },
});
