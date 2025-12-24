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
const secondaryRegion = 'us-west-2';
const secondaryStack = new TapStack(
  app,
  `TapStack${environmentSuffix}-${secondaryRegion}`,
  {
    stackName: `TapStack${environmentSuffix}-${secondaryRegion}`,
    environmentSuffix,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: secondaryRegion,
    },
    description: `Multi-Region Failover Infrastructure for ${environmentSuffix} in ${secondaryRegion}`,
  }
);

// Create us-east-1 (primary) stack second, and make it depend on the secondary stack
const primaryRegion = 'us-east-1';
const primaryStack = new TapStack(
  app,
  `TapStack${environmentSuffix}`,
  {
    stackName: `TapStack${environmentSuffix}`,
    environmentSuffix,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: primaryRegion,
    },
    description: `Multi-Region Failover Infrastructure for ${environmentSuffix} in ${primaryRegion}`,
  }
);

primaryStack.addDependency(secondaryStack); // ⬅️ Enforce secondary deployed before primary

// Optional app metadata
app.node.addMetadata(
  'description',
  `Multi-Region Failover Infrastructure - ${environmentSuffix} Environment`
);
app.node.addMetadata('regions', `${primaryRegion} (primary), ${secondaryRegion} (secondary)`);
app.node.addMetadata('deploymentTime', new Date().toISOString());
