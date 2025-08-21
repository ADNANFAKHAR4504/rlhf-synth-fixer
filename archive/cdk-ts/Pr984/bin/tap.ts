#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const awsRegion = process.env.AWS_REGION || 'us-west-1';

new TapStack(app, `TapStack${environmentSuffix}`, {
  env: {
    region: awsRegion,
  },
  environmentSuffix,
});

app.synth();
