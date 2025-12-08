#!/usr/bin/env node
import { App } from 'cdktf';
import { TapStack } from './lib/tap-stack';

const app = new App();

new TapStack(app, 'TapStackdev', {
  environmentSuffix: process.env.ENVIRONMENT_SUFFIX || 'dev',
  awsRegion: process.env.AWS_REGION || 'us-east-1',
});

app.synth();