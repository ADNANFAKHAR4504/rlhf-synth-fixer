#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();
const envSuffix = process.env.ENVIRONMENT_SUFFIX || '';
const stackName = envSuffix ? `TapStack-${envSuffix}` : 'TapStack';

new TapStack(app, stackName, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  stackName: stackName,
});
