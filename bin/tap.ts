#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EnvironmentConfigurations } from '../lib/config/environment-config';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment from context or default to dev
const targetEnv = app.node.tryGetContext('env') || 'dev';
const environmentConfig = EnvironmentConfigurations.getByName(targetEnv);

// Get environmentSuffix from context or environment variable
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  environmentConfig.name;

// Create single TapStack with all resources
new TapStack(app, 'TapStack', {
  environmentConfig: environmentConfig,
  stackName: `TapStack${environmentSuffix}`,
  environmentSuffix: environmentSuffix,
  env: environmentConfig.env,
});

app.synth();
