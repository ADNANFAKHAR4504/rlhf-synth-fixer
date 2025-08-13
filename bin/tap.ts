#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { ComputeStack } from '../lib/stacks/compute-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { KmsStack } from '../lib/stacks/kms-stack';
import { MonitoringStack } from '../lib/stacks/monitoring-stack';
import { NetworkStack } from '../lib/stacks/network-stack';
import { StorageStack } from '../lib/stacks/storage-stack';

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

// Shared KMS for data-at-rest encryption
const kmsStack = new KmsStack(app, 'KmsStack', { env });

// Storage (logs + app data bucket)
const storageStack = new StorageStack(app, 'StorageStack', {
  env,
  dataKey: kmsStack.dataKey,
});

// Networking (region-agnostic AZ discovery)
const networkStack = new NetworkStack(app, 'NetworkStack', { env });

// Compute (ALB + ASG + IAM role) – needs VPC, KMS key, and app bucket
const computeStack = new ComputeStack(app, 'ComputeStack', {
  env,
  vpc: networkStack.vpc,
  dataKey: kmsStack.dataKey,
  appBucket: storageStack.appBucket,
});
computeStack.addDependency(networkStack);
computeStack.addDependency(kmsStack);
computeStack.addDependency(storageStack);

// Database (RDS Multi-AZ) – needs VPC, KMS, App SG + Instance Role
const databaseStack = new DatabaseStack(app, 'DatabaseStack', {
  env,
  vpc: networkStack.vpc,
  dataKey: kmsStack.dataKey,
  appSecurityGroup: computeStack.appSecurityGroup,
  appInstanceRole: computeStack.instanceRole,
});
// DB must be aware of compute layer for SG/role grants
databaseStack.addDependency(computeStack);

// Monitoring (CloudWatch alarms) – needs ALB/ASG/DB references
const monitoringStack = new MonitoringStack(app, 'MonitoringStack', {
  env,
  alb: computeStack.alb,
  asg: computeStack.asg,
  dbInstance: databaseStack.dbInstance,
});
monitoringStack.addDependency(databaseStack);
