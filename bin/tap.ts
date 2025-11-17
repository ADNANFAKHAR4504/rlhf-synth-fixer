#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environmentSuffix from context or environment variable
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  'synthf4z68k';

// Get optional custom domain configuration
const customDomainName = app.node.tryGetContext('customDomainName');
const certificateArn = app.node.tryGetContext('certificateArn');

new TapStack(app, `TapStack${environmentSuffix}`, {
  environmentSuffix,
  customDomainName,
  certificateArn,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: `Payment processing API infrastructure for ${environmentSuffix} environment`,
  tags: {
    Environment: environmentSuffix,
    Project: 'PaymentAPI',
    ManagedBy: 'CDK',
  },
});

app.synth();
