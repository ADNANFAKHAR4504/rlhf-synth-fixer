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

// Deploy to us-west-2 region as specified
new TapStack(app, `TapStack${environmentSuffix}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2',
  },
  description: 'Secure AWS Infrastructure with comprehensive security controls',
  tags: {
    Environment: 'Production',
    Project: 'SecureWebApp',
    Owner: 'DevSecOps',
    CostCenter: 'Engineering',
    EnvironmentSuffix: environmentSuffix,
  },
});
