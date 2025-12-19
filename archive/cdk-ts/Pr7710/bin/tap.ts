#!/usr/bin/env node

import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';
import { CliCredentialsStackSynthesizer } from 'aws-cdk-lib';

import { TapStack } from '../lib/tap-stack';
import { Environment } from 'aws-cdk-lib';

const app = new cdk.App();

// Pipeline uses environmentSuffix context, but also support environment context for compatibility
let environmentSuffix =
  app.node.tryGetContext('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  'dev';

// Handle case where shell variable syntax is passed literally (e.g., ${ENVIRONMENT_SUFFIX:-dev})
if (environmentSuffix && environmentSuffix.includes('${')) {
  environmentSuffix = 'dev'; // Default to dev if shell syntax is passed
}
const environment =
  app.node.tryGetContext('environment') ||
  (environmentSuffix === 'dev'
    ? 'development'
    : environmentSuffix === 'prod'
      ? 'production'
      : 'staging');
const emailAddress =
  app.node.tryGetContext('emailAddress') || 'admin@example.com';

// Configure AWS environment for CDK deployment
const account =
  process.env.CDK_DEFAULT_ACCOUNT ||
  process.env.AWS_ACCOUNT ||
  process.env.AWS_ACCOUNT_ID;
const region =
  process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-east-1';

// Dynamic configuration from environment variables
const dbUsername = process.env.DB_USERNAME || 'dbadmin';
const dbName = process.env.DB_NAME || 'ecommerce_db';
const containerImage =
  process.env.CONTAINER_IMAGE || 'public.ecr.aws/nginx/nginx';
const containerTag = process.env.CONTAINER_TAG || 'latest';

// Set environment configuration - CDK will auto-resolve account if not provided
const env: Environment = account ? { region, account } : { region };

// Use CliCredentialsStackSynthesizer to bypass bootstrap role trust issues
// This uses CLI credentials directly instead of assuming bootstrap roles
const synthesizer = new CliCredentialsStackSynthesizer();

new TapStack(app, `TapStack${environmentSuffix}`, {
  env,
  synthesizer,
  description: 'Production-ready e-commerce infrastructure stack',
  tags: {
    Environment: environment,
    Project: 'ECommerce',
    ManagedBy: 'CDK',
    CostCenter: 'Engineering',
  },
  environment,
  emailAddress,
  dbConfig: {
    username: dbUsername,
    databaseName: dbName,
  },
  containerConfig: {
    image: containerImage,
    tag: containerTag,
  },
});
