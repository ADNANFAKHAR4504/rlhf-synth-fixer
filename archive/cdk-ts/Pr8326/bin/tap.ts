#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or environment variable
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  'dev';

// Detect LocalStack environment
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL?.includes('4566') ||
  process.env.LOCALSTACK_HOSTNAME !== undefined;

new TapStack(app, `TapStack${environmentSuffix}`, {
  environmentSuffix,
  env: {
    account: isLocalStack ? '000000000000' : process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1',
  },
  description: `Serverless API with Lambda, DynamoDB, Cognito and API Gateway (${environmentSuffix})`,
  tags: {
    Environment: environmentSuffix,
    ManagedBy: 'CDK',
    Provider: isLocalStack ? 'LocalStack' : 'AWS',
  },
});

app.synth();
