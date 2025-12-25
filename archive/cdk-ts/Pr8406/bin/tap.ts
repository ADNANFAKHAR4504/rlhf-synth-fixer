#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

// Define the regions where you want to deploy your serverless data processing pipeline
// You can add or remove regions from this list as needed
const regionsToDeploy = [
  'us-east-1', // Primary region
  'us-west-2', // Secondary region for disaster recovery
  // Add more regions as needed, e.g., 'eu-west-1', 'ap-southeast-2'
];

// Optional: Get repository and author information for tagging
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const projectName = process.env.PROJECT_NAME || 'ServerlessDataPipeline';

// Apply global tags to all stacks created by this app.
// These tags will be inherited by all resources within each stack.
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Project', projectName);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('Service', 'DataProcessing');
Tags.of(app).add('DeploymentType', 'MultiRegion');

// Loop through each region and deploy an instance of the TapStack
regionsToDeploy.forEach(region => {
  // Construct a unique stack ID and name for each region and environment.
  // For us-east-1 (primary region), use TapStack-{environmentSuffix} without region suffix
  // For other regions, include the region suffix: TapStack-{environmentSuffix}-{region}
  // This ensures the deployment script can find the primary stack
  const isPrimaryRegion = region === 'us-east-1';
  const stackId = isPrimaryRegion
    ? `TapStack${environmentSuffix}`
    : `TapStack${environmentSuffix}-${region}`;
  const stackName = isPrimaryRegion
    ? `TapStack${environmentSuffix}`
    : `TapStack${environmentSuffix}-${region}`;

  new TapStack(app, stackId, {
    stackName: stackName, // Explicitly set the CloudFormation stack name
    environmentSuffix: environmentSuffix, // Pass the environment suffix to the stack
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT, // Use the default AWS account
      region: region, // Set the specific region for this stack instance
    },
    // Add description for better stack identification
    description: `Serverless Data Processing Pipeline for ${environmentSuffix} in ${region}`,
  });
});

// Optional: Add app-level metadata for better tracking
app.node.addMetadata(
  'description',
  `Serverless Data Processing Pipeline - ${environmentSuffix} Environment`
);
app.node.addMetadata('regions', regionsToDeploy.join(', '));
app.node.addMetadata('deploymentTime', new Date().toISOString());
