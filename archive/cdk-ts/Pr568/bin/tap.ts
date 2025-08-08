#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { SecureNetworkStack } from '../lib/secure-network-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

const repositoryName = process.env.REPOSITORY || 'enterprise-security-network';
const commitAuthor = process.env.COMMIT_AUTHOR || 'cloud-ops-team';

// Get the target region from environment or use default
const targetRegion = process.env.CDK_DEFAULT_REGION || 'us-east-1';

// Determine the environment name based on region
const regionSuffix = targetRegion === 'us-west-2' ? 'west' : 'east';
const stackName = `TapStack${environmentSuffix}`;

// Apply enterprise-level tags to all resources
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('SecurityLevel', 'Enterprise');
Tags.of(app).add('Compliance', 'SOC2-PCI');
Tags.of(app).add('BackupRequired', 'true');
Tags.of(app).add('MonitoringLevel', 'Enhanced');

// Create a single stack for the target region
new SecureNetworkStack(app, stackName, {
  stackName: stackName,
  environmentName: `${environmentSuffix}-${regionSuffix}`,
  costCenter: 'CC-001-Security',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: targetRegion,
  },
});

app.synth();
