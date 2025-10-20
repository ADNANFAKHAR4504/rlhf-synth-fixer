#!/usr/bin/env node
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

const app = new App();
new TapStack(app, 'MultiRegionDrStack');
app.synth();
