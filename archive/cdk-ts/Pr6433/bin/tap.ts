#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

const stack = new cdk.Stack(app, `TapStack${environmentSuffix}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'eu-south-2',
  },
  description: `Payment processing application infrastructure (${environmentSuffix})`,
});

new TapStack(stack, 'PaymentInfra', {
  environmentSuffix,
});

app.synth();
