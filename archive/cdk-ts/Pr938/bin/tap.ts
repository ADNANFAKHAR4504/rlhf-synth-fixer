#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (defaults to 'dev')
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

// Define environment configurations
const environments = {
  dev: {
    region: 'us-east-1',
    replicationRegion: 'us-west-2',
    vpcCidr: '10.0.0.0/16',
    maxAzs: 2,
    enableLogging: true,
    s3ExpressOneZone: false,
  },
  staging: {
    region: 'us-east-1',
    replicationRegion: 'us-west-2',
    vpcCidr: '10.1.0.0/16',
    maxAzs: 2,
    enableLogging: true,
    s3ExpressOneZone: false,
  },
  prod: {
    region: 'us-east-1',
    replicationRegion: 'us-west-2',
    vpcCidr: '10.2.0.0/16',
    maxAzs: 3,
    enableLogging: true,
    s3ExpressOneZone: true,
  },
};

const envConfig =
  environments[environmentSuffix as keyof typeof environments] ||
  environments.dev;

// Create the main stack
new TapStack(app, `TapStack${environmentSuffix}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: envConfig.region,
  },
  environmentSuffix,
  envConfig,
});

app.synth();
