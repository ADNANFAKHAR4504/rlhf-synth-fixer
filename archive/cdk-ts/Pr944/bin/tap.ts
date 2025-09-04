#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX ||
  app.node.tryGetContext('environmentSuffix') ||
  'dev';

// Primary stack in us-east-1
const primaryStack = new TapStack(app, `TapStack${environmentSuffix}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  environmentSuffix,
  stackRegion: 'us-east-1',
  isPrimary: true,
  description: `Primary infrastructure stack for ${environmentSuffix} environment in us-east-1`,
});

// Secondary stack in us-west-2
const secondaryStack = new TapStack(
  app,
  `TapStack${environmentSuffix}-secondary`,
  {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-west-2',
    },
    environmentSuffix,
    stackRegion: 'us-west-2',
    isPrimary: false,
    primaryVpcId: primaryStack.vpcId,
    description: `Secondary infrastructure stack for ${environmentSuffix} environment in us-west-2`,
  }
);

// Add dependency so secondary stack is created after primary
secondaryStack.addDependency(primaryStack);
