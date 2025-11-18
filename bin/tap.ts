#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const hostedZoneName =
  app.node.tryGetContext('hostedZoneName') || `dr-${environmentSuffix}.com`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('PRNumber', prNumber);
Tags.of(app).add('Team', team);
Tags.of(app).add('CreatedAt', createdAt);

// Primary Stack in us-east-1
const primaryStack = new TapStack(
  app,
  `TapStack-Primary-${environmentSuffix}`,
  {
    stackName: `TapStack-Primary-${environmentSuffix}`,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-east-1',
    },
    crossRegionReferences: true,
    environmentSuffix: environmentSuffix,
    isPrimaryRegion: true,
    hostedZoneName: hostedZoneName,
    description: 'Multi-region DR primary stack in us-east-1',
  }
);

// Secondary Stack in us-east-2
const secondaryStack = new TapStack(
  app,
  `TapStack-Secondary-${environmentSuffix}`,
  {
    stackName: `TapStack-Secondary-${environmentSuffix}`,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-east-2',
    },
    crossRegionReferences: true,
    environmentSuffix: environmentSuffix,
    isPrimaryRegion: false,
    peerVpcId: primaryStack.vpc.vpcId,
    peerRegion: 'us-east-1',
    globalDatabaseIdentifier: primaryStack.globalDatabase?.ref,
    hostedZoneId: primaryStack.hostedZone?.hostedZoneId,
    hostedZoneName: hostedZoneName,
    description: 'Multi-region DR secondary stack in us-east-2',
  }
);

// Add dependency
secondaryStack.addDependency(primaryStack);

app.synth();
