#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { DatabaseStack } from '../lib/database-stack';
import { ComputeStack } from '../lib/compute-stack';
import { MonitoringStack } from '../lib/monitoring-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Apply global tags
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('PRNumber', prNumber);
Tags.of(app).add('Team', team);
Tags.of(app).add('CreatedAt', createdAt);

// Network Stack
const networkStack = new NetworkStack(
  app,
  `NetworkStack-${environmentSuffix}`,
  {
    stackName: `NetworkStack-${environmentSuffix}`,
    environmentSuffix: environmentSuffix,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
    },
  }
);

// Monitoring Stack
const monitoringStack = new MonitoringStack(
  app,
  `MonitoringStack-${environmentSuffix}`,
  {
    stackName: `MonitoringStack-${environmentSuffix}`,
    environmentSuffix: environmentSuffix,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
    },
  }
);

// Database Stack
const databaseStack = new DatabaseStack(
  app,
  `DatabaseStack-${environmentSuffix}`,
  {
    stackName: `DatabaseStack-${environmentSuffix}`,
    environmentSuffix: environmentSuffix,
    vpc: networkStack.vpc,
    alertTopic: monitoringStack.alertTopic,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
    },
  }
);
databaseStack.addDependency(networkStack);
databaseStack.addDependency(monitoringStack);

// Compute Stack
const computeStack = new ComputeStack(
  app,
  `ComputeStack-${environmentSuffix}`,
  {
    stackName: `ComputeStack-${environmentSuffix}`,
    environmentSuffix: environmentSuffix,
    vpc: networkStack.vpc,
    database: databaseStack.database,
    redisCluster: databaseStack.redisCluster,
    alertTopic: monitoringStack.alertTopic,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
    },
  }
);
computeStack.addDependency(databaseStack);

app.synth();
