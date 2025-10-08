#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  description: `Production IoT data pipeline for processing 500k daily sensor readings - ${environmentSuffix}`,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  tags: {
    Environment: environmentSuffix,
    Project: 'IoT-DataPipeline',
  },
  terminationProtection: false,
});

// Add stack-level configurations
cdk.Tags.of(app).add('DataClassification', 'Sensitive');
cdk.Tags.of(app).add('Compliance', 'GDPR');

app.synth();
