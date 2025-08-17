#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'cdktf';
import { MultiRegionStack } from '../lib/tap-stack'; // Correct import

// Create the CDKTF application
const app = new App();

// Instantiate your main stack. The MultiRegionStack defines its own regions,
// CIDR blocks, and tags internally, so no arguments are needed here.
new MultiRegionStack(app, 'tap-multi-region'); // Removed unnecessary arguments

// Synthesize the Terraform configuration
app.synth();
