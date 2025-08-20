#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

const app = new App();

// Instantiate a single stack that manages all multi-region resources internally.
// This resolves the "Found more than one stack" error.
new TapStack(app, 'tap-pci-multi-region-stack');

app.synth();
