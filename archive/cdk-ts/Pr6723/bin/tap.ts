#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or generate default
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') || `dev-${Date.now()}`;

new TapStack(app, `TapStack${environmentSuffix}`, {
  environmentSuffix,
  env: {
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
  description:
    'Multi-service ECS orchestration platform with ALB, CloudMap, and X-Ray',
});

app.synth();
