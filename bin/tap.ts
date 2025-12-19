#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SecureNetworkStack } from '../lib/secure-network-stack';

const app = new cdk.App();

// Get environment suffix from context or use default
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') || 'dev';

const account = process.env.CDK_DEFAULT_ACCOUNT || process.env.CURRENT_ACCOUNT_ID;

// Create primary stack in us-east-1 (required by deployment script)
new SecureNetworkStack(app, 'TapStack', {
  environmentName: `${environmentSuffix}`,
  costCenter: 'CC-001-Security',
  env: {
    account,
    region: 'us-east-1',
  },
});

// Create secondary stack in us-west-2 for multi-region setup
new SecureNetworkStack(app, 'TapStack-SecureNetworkWest', {
  environmentName: `${environmentSuffix}-west`,
  costCenter: 'CC-001-Security',
  env: {
    account,
    region: 'us-west-2',
  },
});
