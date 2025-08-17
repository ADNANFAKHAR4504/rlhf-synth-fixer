#!/usr/bin/env node
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

// Create a new CDKTF application instance.
const app = new App();

// Instantiate the main infrastructure stack.
// This is where all the resources are defined.
// The name 'tap-production-us-east-1' is the logical stack name used by CDKTF.
// FIXED: Removed the third argument to match the constructor's signature.
new TapStack(app, 'tap-production-us-east-1');

// Synthesize the application to generate the Terraform JSON configuration.
// This command translates the TypeScript code into a format that Terraform can understand.
app.synth();
