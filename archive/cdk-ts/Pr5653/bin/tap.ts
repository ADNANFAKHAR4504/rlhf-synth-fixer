#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or use default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

// Instantiate TapStack which will create all Aurora DR stacks
new TapStack(app, 'TapStack', {
  environmentSuffix,
});

app.synth();
