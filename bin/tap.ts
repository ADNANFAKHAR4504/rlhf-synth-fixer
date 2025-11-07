#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Resolve suffix from context → env → default
const rawSuffix =
  app.node.tryGetContext('environmentSuffix') ??
  process.env.ENVIRONMENT_SUFFIX ??
  'dev';

// Sanitize to CDK-safe chars (letters, numbers, hyphen)
const environmentSuffix = String(rawSuffix).replace(/[^A-Za-z0-9-]/g, '-');

// Build a safe, readable stack id/name
const stackId = `TapStack-${environmentSuffix}`;

new TapStack(app, stackId, {
  stackName: stackId, // optional; keeps CloudFormation stack name aligned
  environmentSuffix,
});
