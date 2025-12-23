#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Read region from AWS_REGION environment variable or use default
const region = process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-east-1';
const account = process.env.CDK_DEFAULT_ACCOUNT || '000000000000';

// Check if running in LocalStack
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                     process.env.AWS_ENDPOINT_URL?.includes('4566');

// Get environment suffix from CDK context (passed via -c environmentSuffix=xxx)
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || '';
const stackName = environmentSuffix ? `TapStack-${environmentSuffix}` : 'TapStack';

new TapStack(app, stackName, {
  env: {
    account,
    region,
  },
  environmentSuffix: environmentSuffix || undefined,
  description: 'Task 277 - Secure multi-tier infrastructure with VPC, ALB, Auto Scaling, RDS, and CloudTrail',
  tags: {
    Environment: 'Production',
    Owner: 'DevOps',
    Project: 'SecureApp',
    ManagedBy: 'CDK',
    Provider: isLocalStack ? 'localstack' : 'aws',
  },
});

app.synth();
