#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SynthQ9n9u3x6Stack } from '../lib/synth-q9n9u3x6-stack';

const app = new cdk.App();

// Get environmentSuffix from context
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

new SynthQ9n9u3x6Stack(app, `SynthQ9n9u3x6Stack-${environmentSuffix}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: `ECS Fargate service optimization stack for ${environmentSuffix} environment`,
});

app.synth();
