#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

new TapStack(app, `TapStack${environmentSuffix}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description:
    'Secure infrastructure stack with S3, IAM, RDS, GuardDuty, and API Gateway',
  tags: {
    Environment: environmentSuffix,
    Project: 'corp-security-infrastructure',
    Owner: 'security-team',
  },
});
