#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import 'source-map-support/register';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
let environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

// sanitize suffix: allow only alphanumerics and underscore (prevent hyphens/spaces)
environmentSuffix = String(environmentSuffix).replace(/[^A-Za-z0-9_]/g, '');

const alertEmail = app.node.tryGetContext('alertEmail');
// Stack name format: TapStack${ENVIRONMENT_SUFFIX} (no hyphen, matching deploy script)
const stackName = `TapStack${environmentSuffix}`;

const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Apply tags to the whole app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('PRNumber', prNumber);
Tags.of(app).add('Team', team);
Tags.of(app).add('CreatedAt', createdAt);

// Ensure we use the correct account and region
const account = process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID;
const region = process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1';

if (!account) {
  throw new Error(
    'AWS Account ID must be set via CDK_DEFAULT_ACCOUNT or AWS_ACCOUNT_ID environment variable. ' +
    'Ensure GitHub Actions sets these or the job assumes a role that populates CDK_DEFAULT_ACCOUNT.'
  );
}

new TapStack(app, stackName, {
  stackName: stackName, // Ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  alertEmail: alertEmail, // Optional email for drift alerts
  env: {
    account: account,
    region: region,
  },
  // Use default synthesizer without custom configuration to ensure proper bootstrap compatibility
  description: 'Automated CloudFormation drift detection system',
});

app.synth();