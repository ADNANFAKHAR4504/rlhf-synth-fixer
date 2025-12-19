#!/usr/bin/env node
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

const app = new App();

const environmentSuffix = process.env.ENV_SUFFIX || 'prod';

new TapStack(app, 'MultiRegionDrStack', {
  environmentSuffix: environmentSuffix,
});

app.synth();
