#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack.mjs';

const app = new App();
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

new TapStack(app, `TapStack-${environmentSuffix}`, {
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-2'
  }
});

app.synth();
