#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Get required properties from environment variables or use defaults
const projectName = process.env.PROJECT_NAME || 'tap-financial-services';
const officeCidr = process.env.OFFICE_CIDR || '10.0.0.0/8';
const devOpsEmail = process.env.DEVOPS_EMAIL || 'devops@example.com';
const dbUsername = process.env.DB_USERNAME || 'admin';

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  projectName: projectName,
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  officeCidr: officeCidr,
  devOpsEmail: devOpsEmail,
  dbUsername: dbUsername,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
