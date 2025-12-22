#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Detect LocalStack environment - use us-east-1 for LocalStack compatibility
// (get-outputs.sh queries CloudFormation in the default region us-east-1)
const isLocalStack = !!process.env.AWS_ENDPOINT_URL;
const primaryRegion = isLocalStack ? 'us-east-1' : 'us-west-1';
const secondaryRegion = isLocalStack ? 'us-east-1' : 'us-west-2';

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

// For LocalStack: deploy single stack to us-east-1
// For AWS: deploy multi-region stacks to us-west-1 and us-west-2
if (isLocalStack) {
  // Single stack for LocalStack testing
  new TapStack(app, `TapStack${environmentSuffix}`, {
    stackName: `TapStack${environmentSuffix}`,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: primaryRegion,
    },
    description: 'Infrastructure stack for LocalStack testing',
  });
} else {
  // Multi-region deployment for real AWS
  new TapStack(app, `TapStack${environmentSuffix}UsWest1`, {
    stackName: `TapStack${environmentSuffix}UsWest1`,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: primaryRegion,
    },
    description:
      'Multi-region infrastructure stack for us-west-1 with fixed DynamoDB capacity',
  });

  new TapStack(app, `TapStack${environmentSuffix}UsWest2`, {
    stackName: `TapStack${environmentSuffix}UsWest2`,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: secondaryRegion,
    },
    description:
      'Multi-region infrastructure stack for us-west-2 with configurable DynamoDB capacity',
  });
}
