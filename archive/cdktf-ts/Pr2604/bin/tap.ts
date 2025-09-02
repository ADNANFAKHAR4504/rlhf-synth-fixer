#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

const app = new App();

new TapStack(app, 'tap-aws-stack', {
  env: {
    region: 'us-east-1',
  },
});

app.synth();
