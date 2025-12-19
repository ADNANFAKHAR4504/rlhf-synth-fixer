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

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
const defaultConfig = {
  appName: 'myapp',
  environment: 'dev',
  owner: 'platform-team',
  instanceType: 't3.micro', // Cost-efficient for demo
  allowedCidrs: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'], // Private networks only - adjust as needed
  dbEngineVersion: '15', // PostgreSQL version
};
// Get configuration from context or use defaults
const appName = app.node.tryGetContext('appName') || defaultConfig.appName;
const environment =
  app.node.tryGetContext('environment') || defaultConfig.environment;
const owner = app.node.tryGetContext('owner') || defaultConfig.owner;
const instanceType =
  app.node.tryGetContext('instanceType') || defaultConfig.instanceType;
const allowedCidrs =
  app.node.tryGetContext('allowedCidrs') || defaultConfig.allowedCidrs;
const dbEngineVersion =
  app.node.tryGetContext('dbEngineVersion') || defaultConfig.dbEngineVersion;

// Target regions for multi-region deployment
const regions = [
  { name: 'us-east-1', isPrimary: true },
  { name: 'us-west-2', isPrimary: false },
];

// Create stacks for both regions
regions.forEach(region => {
  const stackNameRef = `${stackName}-${region.name}`;
  new TapStack(app, stackNameRef, {
    stackName: stackNameRef,
    environmentSuffix: environmentSuffix,
    description: `${environment} infrastructure stack for ${appName} in ${region.name} (${region.isPrimary ? 'Primary' : 'Secondary'})`,

    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: region.name,
    },

    // Termination protection for production
    terminationProtection: environment === 'prod',

    // Custom properties
    appName,
    environment,
    owner,
    instanceType,
    allowedCidrs,
    dbEngineVersion,
    targetRegion: region.name,

    // Stack tags
    tags: {
      Environment: environment,
      Application: appName,
      Region: region.name,
      Owner: owner,
      IsPrimary: region.isPrimary.toString(),
      ManagedBy: 'CDK',
    },
  });
});
