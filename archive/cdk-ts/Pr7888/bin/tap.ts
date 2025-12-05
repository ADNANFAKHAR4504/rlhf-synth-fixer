#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';
const stagingAccountId = app.node.tryGetContext('stagingAccountId') || process.env.STAGING_ACCOUNT_ID;
const productionAccountId = app.node.tryGetContext('productionAccountId') || process.env.PRODUCTION_ACCOUNT_ID;
// ECS services are disabled by default - enable only after pipeline has built container images
const deployEcsServices = app.node.tryGetContext('deployEcsServices') === 'true' || process.env.DEPLOY_ECS_SERVICES === 'true';

new TapStack(app, `TapStack-${environmentSuffix}`, {
  environmentSuffix,
  stagingAccountId,
  productionAccountId,
  deployEcsServices,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: `Multi-stage CI/CD pipeline for containerized applications - ${environmentSuffix}`,
});

app.synth();
