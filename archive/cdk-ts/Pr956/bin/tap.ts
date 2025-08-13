#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or environment variable
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX ||
  app.node.tryGetContext('environmentSuffix') ||
  'dev';

new TapStack(app, `TapStack${environmentSuffix}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  environmentSuffix,
  description:
    'Production-ready VPC infrastructure with security best practices',
  tags: {
    Environment: 'Production',
    Project: 'TAP',
    ManagedBy: 'CDK',
  },
});
