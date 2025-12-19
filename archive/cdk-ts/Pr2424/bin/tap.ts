#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX ||
  app.node.tryGetContext('environmentSuffix') ||
  'dev';
const stackName = `TapStack${environmentSuffix}`;

cdk.Tags.of(app).add('Environment', environmentSuffix);

new TapStack(app, stackName, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  environmentSuffix,
});
