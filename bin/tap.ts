#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SecureNetworkStack } from '../lib/secure-network-stack';

const app = new cdk.App();

// Get environment suffix from context or use default
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') || 'dev';

const account = process.env.CDK_DEFAULT_ACCOUNT || process.env.CURRENT_ACCOUNT_ID;

// Create stacks for multiple regions as top-level stacks
new SecureNetworkStack(app, 'TapStack-SecureNetworkEast', {
  environmentName: `${environmentSuffix}-east`,
  costCenter: 'CC-001-Security',
  env: {
    account,
    region: 'us-east-1',
  },
});

new SecureNetworkStack(app, 'TapStack-SecureNetworkWest', {
  environmentName: `${environmentSuffix}-west`,
  costCenter: 'CC-001-Security',
  env: {
    account,
    region: 'us-west-2',
  },
});
