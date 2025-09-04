#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const projectName = app.node.tryGetContext('projectName') || 'tap';
const environment = app.node.tryGetContext('environment') || 'dev';
const vpcId = app.node.tryGetContext('vpcId') || 'vpc-abc12345';

new TapStack(app, `${projectName}-${environment}-security-stack`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  projectName,
  environment,
  vpcId,
  tags: {
    Project: projectName,
    Environment: environment,
    Owner: 'SecurityTeam',
    CostCenter: 'Security',
    Compliance: 'Required',
  },
});
