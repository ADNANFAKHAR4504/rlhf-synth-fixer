#!/usr/bin/env node
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

const app = new App();

// Use the CI-provided suffix (ENV_SUFFIX) if it exists,
// but fall back to 'local-dev' for local synth/builds.
// This makes the app self-sufficient for local development.
const environmentSuffix = process.env.ENV_SUFFIX || 'prod-v3-soc';

// Instantiate the stack with the required props
new TapStack(app, 'Soc2BaselineStack', {
  environmentSuffix: environmentSuffix,
});

app.synth();
