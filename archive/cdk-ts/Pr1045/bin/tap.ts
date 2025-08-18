#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';
import { DynamoDBStack } from '../lib/dynamodb-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;

const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

// Create DynamoDB stack for us-west-1
const dynamoDbWest1Stack = new DynamoDBStack(
  app,
  `DynamoDBWest1Stack${environmentSuffix}`,
  {
    stackName: `DynamoDBWest1Stack${environmentSuffix}`,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-west-1',
    },
    readCapacity: 5,
    writeCapacity: 5,
    environmentSuffix: environmentSuffix,
  }
);

// Create DynamoDB stack for us-west-2 with configurable capacities
const west2ReadCapacity =
  Number(app.node.tryGetContext('west2ReadCapacity')) || 10;
const west2WriteCapacity =
  Number(app.node.tryGetContext('west2WriteCapacity')) || 10;

const dynamoDbWest2Stack = new DynamoDBStack(
  app,
  `DynamoDBWest2Stack${environmentSuffix}`,
  {
    stackName: `DynamoDBWest2Stack${environmentSuffix}`,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-west-2',
    },
    readCapacity: west2ReadCapacity,
    writeCapacity: west2WriteCapacity,
    environmentSuffix: environmentSuffix,
  }
);

// Create the main TapStack for coordination
new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  west1Stack: dynamoDbWest1Stack,
  west2Stack: dynamoDbWest2Stack,
});
