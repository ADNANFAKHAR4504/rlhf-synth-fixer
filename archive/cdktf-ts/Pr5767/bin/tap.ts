#!/usr/bin/env node
import { App } from 'cdktf';
import { DataPipelineStack } from '../lib/data-pipeline-stack';

const app = new App();

// Get environment suffix from environment variable or use default
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'default';

// Get environments from context
const environments = app.node.tryGetContext('environments') || {};

// Create a stack for each environment
Object.keys(environments).forEach(envName => {
  const envConfig = environments[envName];

  new DataPipelineStack(app, `DataPipeline-${envConfig.name}-Stack`, {
    environment: envConfig.name,
    environmentSuffix: environmentSuffix,
    region: envConfig.region,
    lambdaMemory: envConfig.lambdaMemory,
    dynamodbReadCapacity: envConfig.dynamodbReadCapacity,
    dynamodbWriteCapacity: envConfig.dynamodbWriteCapacity,
    dynamodbBillingMode: envConfig.dynamodbBillingMode,
    s3LifecycleDays: envConfig.s3LifecycleDays,
    enableXrayTracing: envConfig.enableXrayTracing,
    snsEmail: envConfig.snsEmail,
    costCenter: envConfig.costCenter,
  });
});

app.synth();
