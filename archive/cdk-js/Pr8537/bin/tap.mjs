#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack.mjs';

const app = new cdk.App();
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || app.node.tryGetContext('environmentSuffix') || 'dev';

new TapStack(app, `TapStack${environmentSuffix}`, {
  environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});

app.synth();
