#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CliCredentialsStackSynthesizer, Tags } from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or environment variable or use 'dev' as default
let environmentSuffix =
  app.node.tryGetContext('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  'dev';

// Handle bash-style variable expansion that PowerShell doesn't process (e.g., ${ENVIRONMENT_SUFFIX:-dev})
if (
  environmentSuffix &&
  environmentSuffix.startsWith('${') &&
  environmentSuffix.includes(':-')
) {
  const match = environmentSuffix.match(/^\$\{([^:]+):-(.+)\}$/);
  if (match) {
    const envVar = match[1];
    const defaultValue = match[2];
    environmentSuffix = process.env[envVar] || defaultValue;
  }
}
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// TapStack configuration
const stackConfig = {
  environmentSuffix: environmentSuffix,
  serviceName: 'tap-service',
  stage:
    environmentSuffix === 'prod'
      ? ('prod' as const)
      : environmentSuffix === 'staging'
        ? ('staging' as const)
        : ('dev' as const),
  ownerEmail: 'cloud-team@example.com',
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  logRetentionDays: 7,
  lambdaMemorySize: 512,
  lambdaTimeout: 30,
  lambdaConcurrency: 10,
  apiThrottleRate: 100,
  apiThrottleBurst: 200,
  dynamoReadCapacity: 5,
  dynamoWriteCapacity: 5,
  alarmEvaluationPeriods: 2,
  alarmDatapointsToAlarm: 2,
  metricPeriodSeconds: 300,
  s3LifecycleExpirationDays: 90,
  dlqMaxReceiveCount: 3,
  sqsVisibilityTimeout: 300,
  cloudfrontPriceClass: cloudfront.PriceClass.PRICE_CLASS_100,
  vpcMaxAzs: 2,
  natGateways: 1,
};

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('PRNumber', prNumber);
Tags.of(app).add('Team', team);
Tags.of(app).add('CreatedAt', createdAt);

new TapStack(app, stackName, stackConfig, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  // Use CLI credentials directly instead of bootstrap roles to avoid role assumption issues
  synthesizer: new CliCredentialsStackSynthesizer(),
});
