#!/usr/bin/env node
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

const app = new App();

const environmentSuffix = process.env.ENV_SUFFIX || 'prod-soc-v5';

new TapStack(app, 'Soc2BaselineStack', {
  environmentSuffix: environmentSuffix,
});

app.synth();
