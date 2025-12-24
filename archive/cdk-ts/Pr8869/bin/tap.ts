#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or environment variable
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const account = process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID || '000000000000';
const primaryRegion = process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-east-1';
const secondaryRegion = process.env.SECONDARY_REGION || 'us-west-2';

// Create multi-region stacks
new TapStack(app, `TapStack-${environmentSuffix}-${primaryRegion}`, {
  environmentSuffix,
  region: primaryRegion,
  isPrimaryRegion: true,
  env: {
    account,
    region: primaryRegion,
  },
  description: `Multi-region CDK infrastructure (Primary: ${primaryRegion})`,
});

new TapStack(app, `TapStack-${environmentSuffix}-${secondaryRegion}`, {
  environmentSuffix,
  region: secondaryRegion,
  isPrimaryRegion: false,
  env: {
    account,
    region: secondaryRegion,
  },
  description: `Multi-region CDK infrastructure (Secondary: ${secondaryRegion})`,
});

app.synth();
