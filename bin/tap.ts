#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const projectName = process.env.PROJECT_NAME || 'GlobalMountpointFailover';

Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Project', projectName);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('Service', 'MultiRegionFailover');
Tags.of(app).add('DeploymentType', 'MultiRegion');

// Create us-west-2 (secondary) stack first
const westRegion = 'us-west-2';
const westStack = new TapStack(
  app,
  `TapStack-${environmentSuffix}-${westRegion}`,
  {
    stackName: `TapStack-${environmentSuffix}-${westRegion}`,
    environmentSuffix,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: westRegion,
    },
    description: `Multi-Region Failover Infrastructure for ${environmentSuffix} in ${westRegion}`,
  }
);

// Create us-east-1 (primary) stack second, and make it depend on the west stack
const eastRegion = 'us-east-1';
const eastStack = new TapStack(
  app,
  `TapStack-${environmentSuffix}-${eastRegion}`,
  {
    stackName: `TapStack-${environmentSuffix}-${eastRegion}`,
    environmentSuffix,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: eastRegion,
    },
    description: `Multi-Region Failover Infrastructure for ${environmentSuffix} in ${eastRegion}`,
  }
);

eastStack.addDependency(westStack); // ⬅️ Enforce west deployed before east

// Optional app metadata
app.node.addMetadata(
  'description',
  `Multi-Region Failover Infrastructure - ${environmentSuffix} Environment`
);
app.node.addMetadata('regions', `${westRegion}, ${eastRegion}`);
app.node.addMetadata('deploymentTime', new Date().toISOString());
