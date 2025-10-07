#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const sanitizeSuffix = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32) || 'dev';

const deriveEnvironmentSuffix = (): string => {
  const baseContext =
    (app.node.tryGetContext('environmentSuffix') as string | undefined) ||
    process.env.ENVIRONMENT_SUFFIX ||
    'dev';

  let uniquenessHint =
    process.env.DEPLOY_UNIQUE_ID ||
    process.env.GITHUB_RUN_ATTEMPT ||
    process.env.GITHUB_RUN_NUMBER ||
    process.env.GITHUB_RUN_ID ||
    process.env.CODEBUILD_BUILD_NUMBER ||
    process.env.CODEBUILD_BUILD_ID ||
    process.env.BUILD_ID ||
    process.env.CI_PIPELINE_ID ||
    process.env.CI_JOB_ID ||
    process.env.BITBUCKET_BUILD_NUMBER ||
    process.env.CIRCLE_WORKFLOW_ID ||
    process.env.TRAVIS_BUILD_NUMBER ||
    undefined;

  if (!uniquenessHint) {
    const timestamp = Date.now().toString(36).slice(-8);
    const entropy = Math.random().toString(36).slice(2, 6);
    uniquenessHint = `${timestamp}${entropy}`;
  }

  const rawSuffix = `${baseContext}-${uniquenessHint}`;

  return sanitizeSuffix(rawSuffix);
};

const environmentSuffix = deriveEnvironmentSuffix();
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

const digitWords = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
];

const sanitizeTagValue = (value: string): string => {
  const digitExpanded = value.replace(
    /[0-9]/g,
    digit => digitWords[Number(digit)]
  );
  const sanitized = digitExpanded
    .replace(/[^a-zA-Z+\-=._:/]/g, '_')
    .trim()
    .slice(0, 256);
  return sanitized.length > 0 ? sanitized : 'unknown';
};

const stackRegion =
  process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-west-2';
const stackAccount =
  process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID;

const sanitizedEnvironment = sanitizeTagValue(environmentSuffix);
const sanitizedRepository = sanitizeTagValue(repositoryName);
const sanitizedAuthor = sanitizeTagValue(commitAuthor);

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', sanitizedEnvironment);
Tags.of(app).add('Repository', sanitizedRepository);
Tags.of(app).add('Author', sanitizedAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: stackAccount,
    region: stackRegion,
  },
});
