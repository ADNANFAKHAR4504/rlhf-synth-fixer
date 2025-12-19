#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags, DefaultStackSynthesizer } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;

const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Detect if running against LocalStack
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                     process.env.AWS_ENDPOINT_URL?.includes('4566');

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

// For LocalStack: Use custom synthesizer that ONLY uses S3 (no ECR)
// This allows Lambda assets while avoiding ECR Pro requirement
if (isLocalStack) {
  new TapStack(app, stackName, {
    stackName: stackName,
    environmentSuffix: environmentSuffix,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT || '000000000000',
      region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
    },
    synthesizer: new DefaultStackSynthesizer({
      qualifier: 'localstack',
      fileAssetsBucketName: 'cdk-localstack-assets-${AWS::AccountId}-${AWS::Region}',
      bucketPrefix: '',
      // Disable Docker/ECR assets (Pro-only in LocalStack)
      dockerTagPrefix: '',
      generateBootstrapVersionRule: false,
    }),
  });
} else {
  new TapStack(app, stackName, {
    stackName: stackName,
    environmentSuffix: environmentSuffix,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  });
}
