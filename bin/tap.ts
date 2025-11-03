#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { AuroraGlobalStack } from '../lib/stacks/aurora-global-stack';
// import { FailoverStack } from '../lib/stacks/failover-stack';
import { MonitoringStack } from '../lib/stacks/monitoring-stack';

const app = new cdk.App();

// Environment configurations
const primaryEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-east-1',
};
const secondaryEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-west-2',
};

// Default tags for all resources
const defaultTags = {
  CostCenter: 'Platform',
  Environment: 'Production',
  'DR-Role': 'Active',
};

// Deploy stacks in both regions
const primaryStack = new AuroraGlobalStack(app, 'Aurora-DR-Primary', {
  env: primaryEnv,
  isPrimary: true,
  tags: defaultTags,
  crossRegionReferences: true,
});

const secondaryStack = new AuroraGlobalStack(app, 'Aurora-DR-Secondary', {
  env: secondaryEnv,
  isPrimary: false,
  globalClusterIdentifier: primaryStack.globalClusterIdentifier,
  tags: { ...defaultTags, 'DR-Role': 'Standby' },
  crossRegionReferences: true,
});

// Monitoring stack
new MonitoringStack(app, 'Aurora-DR-Monitoring', {
  env: { region: primaryEnv.region, account: process.env.CDK_DEFAULT_ACCOUNT },
  primaryCluster: primaryStack.cluster,
  secondaryCluster: secondaryStack.cluster,
  crossRegionReferences: true,
});

// Failover automation stack
// Note: Commented out due to complex cross-stack dependencies
// Deploy separately or after primary/secondary stacks are deployed
// new FailoverStack(app, 'Aurora-DR-Failover', {
//   env: { region: primaryEnv.region, account: process.env.CDK_DEFAULT_ACCOUNT },
//   primaryStack,
//   secondaryStack,
//   crossRegionReferences: true,
// });

app.synth();
