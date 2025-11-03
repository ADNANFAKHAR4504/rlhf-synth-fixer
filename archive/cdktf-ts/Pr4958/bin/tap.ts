#!/usr/bin/env node
import { App } from 'cdktf';
import { MultiRegionDrStack } from '../lib/tap-stack'; // Renamed stack class

const app = new App();

// Instantiate the stack
new MultiRegionDrStack(app, 'MultiRegionDrStack'); // Use a descriptive name

app.synth();
