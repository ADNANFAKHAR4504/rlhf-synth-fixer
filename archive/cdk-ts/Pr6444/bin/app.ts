#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const region = 'us-east-1';

// TAP Stack (single region - us-east-1)
new TapStack(app, `TapStack${environmentSuffix}`, {
  env: { region },
  environmentSuffix,
  region,
});

app.synth();
