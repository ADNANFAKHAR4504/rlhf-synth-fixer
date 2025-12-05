#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

new TapStack(app, 'TapStack', {
  environmentSuffix: environmentSuffix,
  stackName: `TapStack${environmentSuffix}`,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: `ECS infrastructure refactoring with optimizations - ${environmentSuffix}`,
});

app.synth();
