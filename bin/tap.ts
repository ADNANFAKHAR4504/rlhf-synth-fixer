#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix');

if (!environmentSuffix) {
  throw new Error(
    'environmentSuffix context variable is required. Deploy with: cdk deploy -c environmentSuffix=<value>'
  );
}

new TapStack(app, 'TapStack', {
  environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-2',
  },
  description: `Secure data analytics platform with defense-in-depth security controls (${environmentSuffix})`,
});

app.synth();
