#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as fs from 'fs';
import * as path from 'path';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix for multi-environment support
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX ||
  app.node.tryGetContext('environmentSuffix') ||
  'dev';

// Read AWS region from lib/AWS_REGION if exists, otherwise default to us-east-1
let awsRegion = 'us-east-1';
try {
  const regionFile = path.join(__dirname, '..', 'lib', 'AWS_REGION');
  if (fs.existsSync(regionFile)) {
    awsRegion = fs.readFileSync(regionFile, 'utf8').trim();
  }
} catch (error) {
  console.log('Could not read AWS_REGION file, using default: us-east-1');
}

// For QA testing, deploy to single region
new TapStack(app, `TapStack${environmentSuffix}`, {
  env: {
    region: awsRegion,
  },
  stackName: `TapStack${environmentSuffix}`,
  description: `Healthcare application serverless infrastructure for ${environmentSuffix}`,
});
