#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import {
  DRRegionStack,
  PrimaryRegionStack,
  Route53FailoverStack,
} from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
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

// Step 1: Create DR Region Stack (us-east-2)
// This stack creates the destination S3 bucket and DR resources
const drStack = new DRRegionStack(app, `DRRegionStack-${environmentSuffix}`, {
  stackName: `DRRegionStack-${environmentSuffix}`,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-2', // DR region
  },
  description:
    'DR region resources for multi-region PostgreSQL disaster recovery',
  crossRegionReferences: true, // Enable cross-region references
});

// Step 2: Create Primary Region Stack (us-east-1)
// This stack creates primary resources AND configures S3 replication using DR bucket ARN
// With crossRegionReferences enabled, CDK automatically handles cross-region references
const primaryStack = new PrimaryRegionStack(
  app,
  `PrimaryRegionStack-${environmentSuffix}`,
  {
    stackName: `PrimaryRegionStack-${environmentSuffix}`,
    environmentSuffix: environmentSuffix,
    // These will use CDK's automatic cross-region reference handling
    drBucketArn: drStack.backupBucketDR.bucketArn,
    drKmsKeyId: drStack.kmsKey.keyId,
    drVpcId: drStack.vpc.vpcId,
    drVpcCidr: drStack.vpc.vpcCidrBlock,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-east-1', // Primary region
    },
    description:
      'Primary region resources for multi-region PostgreSQL disaster recovery',
    crossRegionReferences: true, // Enable cross-region references
  }
);

// Ensure primary stack is created after DR stack
primaryStack.addDependency(drStack);

// Step 3: Create Route53 Failover Stack (region-agnostic, but deployed to primary region)
const route53Stack = new Route53FailoverStack(
  app,
  `Route53FailoverStack-${environmentSuffix}`,
  {
    stackName: `Route53FailoverStack-${environmentSuffix}`,
    environmentSuffix: environmentSuffix,
    primaryDbEndpoint: primaryStack.dbEndpoint,
    drDbEndpoint: drStack.dbEndpoint,
    primaryMonitoringTopicArn: primaryStack.monitoringTopic.topicArn,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-east-1', // Deploy to primary region
    },
    description:
      'Route53 health checks and failover routing for disaster recovery',
    crossRegionReferences: true, // Enable cross-region references
  }
);

// Ensure Route53 stack is created after both regional stacks
route53Stack.addDependency(primaryStack);
route53Stack.addDependency(drStack);

app.synth();
