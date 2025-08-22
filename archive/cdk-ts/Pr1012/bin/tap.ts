#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
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
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region:
      process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1',
  },
  description: `CI/CD Pipeline Stack for Node.js Application - Environment: ${environmentSuffix}`,
  tags: {
    Environment: environmentSuffix,
    Project: 'NodeJS-CICD-Pipeline',
    ManagedBy: 'CDK',
  },
});
