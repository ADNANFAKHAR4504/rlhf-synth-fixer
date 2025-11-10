#!/usr/bin/env node
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

const app = new App();

// Get environment suffix from environment variable or use default
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

new TapStack(app, 'tap-stack', {
  environmentSuffix,
  region,
});

app.synth();
