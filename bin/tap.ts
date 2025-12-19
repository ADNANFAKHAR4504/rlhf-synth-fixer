#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SecurityConfigStack } from '../lib/security-config-stack';

// Check if running on LocalStack
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL?.includes('4566') ||
  process.env.LOCALSTACK === 'true';

// Get environment suffix from context or environment variable
const app = new cdk.App();
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  'dev';

// Get account and region from environment
const account = process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID || '000000000000';
const region = process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1';

// Create the primary stack in the primary region
const primaryStack = new SecurityConfigStack(app, `TapStack${environmentSuffix}`, {
  environmentSuffix,
  isPrimaryRegion: true,
  env: {
    account,
    region,
  },
  description: `Security, Compliance, and Governance Stack for AWS Config (${environmentSuffix})`,
  tags: {
    Environment: environmentSuffix,
    ManagedBy: 'CDK',
    Project: 'SecurityConfig',
    Team: 'synth-2',
    Provider: isLocalStack ? 'localstack' : 'aws',
  },
});

// Add stack-level tags for better organization
cdk.Tags.of(primaryStack).add('Application', 'SecurityConfig');
cdk.Tags.of(primaryStack).add('CostCenter', 'Security');

// Synthesize the app
app.synth();
