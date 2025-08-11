#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or env variable or use 'dev'
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  'dev';

const stackName = `TapStack${environmentSuffix}`;

const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Required parameters
const approvedSshCidr = process.env.APPROVED_SSH_CIDR || '10.0.0.0/8'; // More restrictive default
const alarmEmail = process.env.ALARM_EMAIL || 'test@example.com';
const certificateArn = process.env.CERTIFICATE_ARN; // Optional for HTTPS

// Tagging
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

// Stack instantiation
new TapStack(app, stackName, {
  stackName,
  environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-west-2',
  },
  approvedSshCidr,
  alarmEmail,
  certificateArn,
  // testing: true, // Uncomment if needed
});
