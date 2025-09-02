#!/usr/bin/env node
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

const app = new App();

// The stack itself is now responsible for handling its multi-region nature.
new TapStack(app, 'tap-multi-region-stack');

app.synth();
