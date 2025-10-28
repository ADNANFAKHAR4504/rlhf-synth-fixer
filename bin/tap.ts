#!/usr/bin/env node
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

const app = new App();

const environmentSuffix = process.env.ENV_SUFFIX;

if (!environmentSuffix) {
  console.error('ERROR: ENV_SUFFIX environment variable is not set.');
  console.error('Usage: ENV_SUFFIX="my-suffix" npm run build');
  process.exit(1);
}

new TapStack(app, 'MultiRegionDrStack', {
  environmentSuffix: environmentSuffix,
});

app.synth();
