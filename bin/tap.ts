#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'pr1';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName,
  environmentSuffix,

  // Required TapStackProps
  project: 'tap',
  service: 'api',
  environment: 'dev',

  // Optional metadata tags
  team: 'platform',
  costCenter: 'cc-123',

  // Performance/cost tuning
  lambda95pMemMb: 1536,
  p90DurationMsBaseline: 1000,

  // API auth
  apiAuthType: 'NONE', // or 'IAM' | 'JWT'
  // jwtIssuer: '',
  // jwtAudience: [],

  // S3 lifecycle
  glacierTransitionDays: 90,
  archiveRetentionDays: 1095,

  // Alarms
  lambdaThrottleThreshold: 1,
  lambdaErrorsThreshold: 1,
  ddbThrottledRequestsThreshold: 1,

  // Lambda Layer path
  layerAssetPath: 'lib/lambda-layer',

  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
