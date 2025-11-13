#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environment = app.node.tryGetContext('environment') || 'dev';
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') || `${environment}-${Date.now()}`;

new TapStack(app, `TapStack${environmentSuffix}`, {
  environmentSuffix,
  environment,
  env: {
    region: 'ap-southeast-1',
  },
});

app.synth();
