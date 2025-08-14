#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const envSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION || 'us-east-1';

new TapStack(app, `TapStack${envSuffix}`, {
  env: {
    account,
    region,
  },
  environmentSuffix: envSuffix,
});
