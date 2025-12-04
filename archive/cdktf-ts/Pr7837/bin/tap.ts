#!/usr/bin/env node
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

const app = new App();

// Get environment variables from the environment or use defaults
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const awsRegion = process.env.AWS_REGION || 'us-east-1';

// Calculate the stack name
const stackName = `tap`;

// Create the TapStack with the calculated properties
new TapStack(app, stackName, {
  environmentSuffix: environmentSuffix,
  region: awsRegion,
});

// Synthesize the app to generate the Terraform configuration
app.synth();
