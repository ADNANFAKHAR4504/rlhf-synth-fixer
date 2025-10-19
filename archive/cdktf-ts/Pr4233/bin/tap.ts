#!/usr/bin/env node
import { App } from 'cdktf';
import { EksDrStack } from '../lib/tap-stack';

const app = new App();

// Instantiate the self-contained stack
new EksDrStack(app, 'EksDrStack');

app.synth();
