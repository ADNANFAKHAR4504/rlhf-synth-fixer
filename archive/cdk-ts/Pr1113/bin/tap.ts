#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const region = process.env.CDK_DEFAULT_REGION || 'us-west-1';

new TapStack(app, `TapStack${environmentSuffix}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: region,
  },
  environmentSuffix,
});

// Enable termination protection for production
if (environmentSuffix === 'prod') {
  cdk.Tags.of(app).add('Environment', 'Production');
  cdk.Tags.of(app).add('CriticalWorkload', 'true');
}

app.synth();
