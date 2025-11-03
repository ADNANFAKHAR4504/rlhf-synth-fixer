#!/usr/bin/env node
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

const app = new App();

// Generate a timestamp string (YYYYMMDDHHMMSS)
const now = new Date();
const pad = (n: number) => n.toString().padStart(2, '0');
const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

const baseSuffix = process.env.ENV_SUFFIX || 'prod-soc-v5';
const environmentSuffix = `${baseSuffix}-${timestamp}`;

new TapStack(app, 'Soc2BaselineStack', {
  environmentSuffix: environmentSuffix,
});

app.synth();
