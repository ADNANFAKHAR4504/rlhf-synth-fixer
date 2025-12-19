#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { SecureVpcStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

new SecureVpcStack(app, `TapStack${environmentSuffix}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2',
  },
  environmentSuffix,
});
