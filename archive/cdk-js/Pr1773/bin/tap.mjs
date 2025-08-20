#!/usr/bin/env node
import 'source-map-support/register.js';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack.mjs';

const app = new cdk.App();

// Get environment suffix from context or environment variable
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

// Primary region stack - using TapStack naming convention required by CI/CD
new TapStack(app, `TapStack${environmentSuffix}`, {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: 'us-east-1' 
  },
  environmentSuffix: environmentSuffix,
});