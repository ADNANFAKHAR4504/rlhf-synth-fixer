#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

const stack = new cdk.Stack(app, `PaymentAppStack-${environmentSuffix}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-southeast-1',
  },
  description: `Payment processing application infrastructure (${environmentSuffix})`,
});

new TapStack(stack, 'PaymentInfra', {
  environmentSuffix,
});

app.synth();
