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

// Determine stage from environment suffix
const stage =
  environmentSuffix === 'prod'
    ? ('prod' as const)
    : environmentSuffix === 'staging'
      ? ('staging' as const)
      : ('dev' as const);

// TapStack configuration - all configurable via environment variables
const stackConfig = {
  environmentSuffix: environmentSuffix,
  serviceName: process.env.SERVICE_NAME || 'tap-service',
  stage,
  // Owner email - parameterized via environment variable with sensible default
  ownerEmail:
    process.env.OWNER_EMAIL ||
    process.env.ALERT_EMAIL ||
    'cloud-team@example.com',
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  logRetentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '7', 10),
  lambdaMemorySize: parseInt(process.env.LAMBDA_MEMORY_SIZE || '512', 10),
  lambdaTimeout: parseInt(process.env.LAMBDA_TIMEOUT || '30', 10),
  lambdaConcurrency: parseInt(process.env.LAMBDA_CONCURRENCY || '10', 10),
  apiThrottleRate: parseInt(process.env.API_THROTTLE_RATE || '100', 10),
  apiThrottleBurst: parseInt(process.env.API_THROTTLE_BURST || '200', 10),
  dynamoReadCapacity: parseInt(process.env.DYNAMO_READ_CAPACITY || '5', 10),
  dynamoWriteCapacity: parseInt(process.env.DYNAMO_WRITE_CAPACITY || '5', 10),
  alarmEvaluationPeriods: 2,
  alarmDatapointsToAlarm: 2,
  metricPeriodSeconds: 300,
  s3LifecycleExpirationDays: parseInt(
    process.env.S3_LIFECYCLE_DAYS || '90',
    10
  ),
  dlqMaxReceiveCount: 3,
  sqsVisibilityTimeout: 300,
  cloudfrontPriceClass: cloudfront.PriceClass.PRICE_CLASS_100,
  vpcMaxAzs: parseInt(process.env.VPC_MAX_AZS || '2', 10),
  natGateways: parseInt(process.env.NAT_GATEWAYS || '1', 10),
  // Security configurations
  enableWaf: process.env.ENABLE_WAF !== 'false', // Enabled by default
  allowedCorsOrigins:
    process.env.ALLOWED_CORS_ORIGINS?.split(',').filter(Boolean),
  enableLambdaConcurrencyLimit:
    process.env.ENABLE_LAMBDA_CONCURRENCY_LIMIT === 'true',
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
