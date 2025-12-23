#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or default to 'dev'
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

new TapStack(app, `TapStack${environmentSuffix}`, {
  environmentSuffix,
  description: 'Scalable Serverless IoT Data Processor Stack',
  env: {
    region: process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-west-2',
  },
  tags: {
    Project: 'IoT-Data-Processor',
    Environment: environmentSuffix,
  },
});
