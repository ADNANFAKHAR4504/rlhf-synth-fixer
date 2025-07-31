#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

// Define the regions where you want to deploy your microservices.
// You can add or remove regions from this list.
const regionsToDeploy = [
  'us-east-1',
  'us-west-2',
  // Add more regions as needed, e.g., 'eu-west-1', 'ap-southeast-2'
];

// Optional: Get repository and author information for tagging
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply global tags to all stacks created by this app.
// These tags will be inherited by all resources within each stack.
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Project', 'ServerlessMicroservices'); // Consistent project tag
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

// Loop through each region and deploy an instance of the TapStack
regionsToDeploy.forEach(region => {
  // Construct a unique stack ID and name for each region and environment.
  // This ensures that deployments in different regions or environments do not conflict.
  const stackId = `TapStack-${environmentSuffix}-${region}`;
  const stackName = `TapStack-${environmentSuffix}-${region}`;

  new TapStack(app, stackId, {
    stackName: stackName, // Explicitly set the CloudFormation stack name
    environmentSuffix: environmentSuffix, // Pass the environment suffix to the stack
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT, // Use the default AWS account
      region: region, // Set the specific region for this stack instance
    },
    // You can add description or other stack-level properties here
    description: `Serverless Microservices for ${environmentSuffix} in ${region}`,
  });
});
