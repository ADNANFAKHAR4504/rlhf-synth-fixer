#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { MultiRegionVpcStack } from '../lib/multi-region-vpc';
import { IamRolesStack } from '../lib/iam-roles';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  'dev';
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('DeploymentType', 'MultiRegion');

// Define target regions for multi-region deployment
const regions = ['us-east-1', 'us-west-2'];
const account = process.env.CDK_DEFAULT_ACCOUNT;

// Create infrastructure stacks for each region
regions.forEach(region => {
  // Create VPC Stack for each region with proper naming convention
  const vpcStack = new MultiRegionVpcStack(
    app,
    `TapStack${environmentSuffix}VpcStack${region.replace(/-/g, '')}`,
    {
      stackName: `TapStack${environmentSuffix}-VpcStack-${region}`,
      environmentSuffix,
      region,
      env: {
        account,
        region,
      },
    }
  );

  // Create IAM Roles Stack for each region with proper naming convention
  const iamStack = new IamRolesStack(
    app,
    `TapStack${environmentSuffix}IamStack${region.replace(/-/g, '')}`,
    {
      stackName: `TapStack${environmentSuffix}-IamStack-${region}`,
      environmentSuffix,
      region,
      env: {
        account,
        region,
      },
    }
  );

  // Add dependency to ensure proper deployment order
  iamStack.addDependency(vpcStack);
});
