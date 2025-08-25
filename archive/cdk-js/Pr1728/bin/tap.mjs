#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack.js';

const app = new App();

// Get environment suffix from context or environment variable
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

// Deploy the secure financial application infrastructure
new TapStack(app, `TapStack${environmentSuffix}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Secure Financial Application Infrastructure with Advanced Security Controls',
});

app.synth();