#!/usr/bin/env node
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

const app = new App();

new TapStack(app, 'tap-stack', {
  env: {
    region: 'ap-southeast-2',
  },
});

app.synth();
