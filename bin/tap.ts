#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Resolve suffix from context → env → default
let rawSuffix =
  app.node.tryGetContext('environmentSuffix') ??
  process.env.ENVIRONMENT_SUFFIX ??
  'dev';

// Handle case where context contains unexpanded bash variables (e.g., ${ENVIRONMENT_SUFFIX:-dev})
if (typeof rawSuffix === 'string' && rawSuffix.includes('${')) {
  // If context has unexpanded variables, fall back to environment or default
  rawSuffix = process.env.ENVIRONMENT_SUFFIX ?? 'dev';
}

// Sanitize to CDK-safe chars (letters, numbers, hyphen)
const environmentSuffix = String(rawSuffix).replace(/[^A-Za-z0-9-]/g, '-');

// Build a safe, readable stack id/name (no hyphen to match LocalStack scripts)
const stackId = `TapStackRoot${environmentSuffix}`;

new TapStack(app, stackId, {
  stackName: stackId, // Root stack name - nested PaymentMonitoringStack uses TapStack${env}
  environmentSuffix,
});
