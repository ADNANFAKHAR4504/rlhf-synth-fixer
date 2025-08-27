#!/usr/bin/env node
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

const app = new App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;

// Create the main TAP stack
new TapStack(app, stackName, {
  environmentSuffix: environmentSuffix,
  awsRegion: process.env.CDK_DEFAULT_REGION || 'us-west-2',
});

// Synthesize the CDKTF app
app.synth();
