#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { ComputeStack } from '../lib/stacks/compute-stack';
import { CoreStack } from '../lib/stacks/core-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { MonitoringStack } from '../lib/stacks/monitoring-stack';
import { StorageStack } from '../lib/stacks/storage-stack';

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-east-2', // Getting subnets limit in process.env.CDK_DEFAULT_REGION
};

// CoreStack: VPC, KMS key, app SG (no instance role)
const coreStack = new CoreStack(app, 'CoreStack', { env });

// Storage (logs + app data bucket)
const storageStack = new StorageStack(app, 'StorageStack', {
  env,
  dataKey: coreStack.dataKey,
});

// Database (RDS Multi-AZ) – needs VPC, KMS, App SG
const databaseStack = new DatabaseStack(app, 'DatabaseStack', {
  env,
  vpc: coreStack.vpc,
  dataKey: coreStack.dataKey,
  appSecurityGroup: coreStack.appSecurityGroup,
});

// Compute (ALB + ASG + IAM role) – needs VPC, KMS key, app bucket, SG, role
const computeStack = new ComputeStack(app, 'ComputeStack', {
  env,
  vpc: coreStack.vpc,
  dataKey: coreStack.dataKey,
  appBucket: storageStack.appBucket,
  appSecurityGroup: coreStack.appSecurityGroup,
  appInstanceRole: databaseStack.appInstanceRole,
});
// No addDependency needed; resource references are passed via props

// Monitoring (CloudWatch alarms) – needs ALB/ASG/DB references
const monitoringStack = new MonitoringStack(app, 'MonitoringStack', {
  env,
  alb: computeStack.alb,
  asg: computeStack.asg,
  dbInstance: databaseStack.dbInstance,
});
monitoringStack.addDependency(databaseStack);
