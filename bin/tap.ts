#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const isDeployCommand = process.argv.includes('deploy');

const account = process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID;

const region =
  process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1';

if (isDeployCommand && !account) {
  console.error(
    'Error: CDK_DEFAULT_ACCOUNT or AWS_ACCOUNT_ID environment variable is required for deployment.'
  );
  console.error('   Please set one of these environment variables:');
  console.error('   - CDK_DEFAULT_ACCOUNT');
  console.error('   - AWS_ACCOUNT_ID');
  console.error('');
  console.error('   For GitHub Actions, ensure these secrets are configured:');
  console.error('   - AWS_ACCOUNT_ID');
  console.error('   - AWS_ACCESS_KEY_ID');
  console.error('   - AWS_SECRET_ACCESS_KEY');
  process.exit(1);
}

if (account) {
  process.env.CDK_DEFAULT_ACCOUNT = account;
}

if (region) {
  process.env.CDK_DEFAULT_REGION = region;
}

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

const stackName = `TapStack${environmentSuffix}`;

const repositoryName =
  process.env.REPOSITORY || process.env.GITHUB_REPOSITORY || 'unknown';

const commitAuthor =
  process.env.COMMIT_AUTHOR || process.env.GITHUB_ACTOR || 'unknown';

const prNumber =
  process.env.PR_NUMBER || process.env.GITHUB_PR_NUMBER || 'unknown';

const team = process.env.TEAM || 'unknown';

const createdAt = new Date().toISOString();

Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('PRNumber', prNumber);
Tags.of(app).add('Team', team);
Tags.of(app).add('CreatedAt', createdAt);

new TapStack(app, stackName, {
  stackName,
  environmentSuffix,
  env: {
    account,
    region,
  },
});
