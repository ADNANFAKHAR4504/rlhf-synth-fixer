#!/usr/bin/env node
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

// Create a new CDKTF application instance.
const app = new App();

// Instantiate the main security-focused infrastructure stack.
// All resources and configurations are defined within this stack.
new TapStack(app, 'tap-secure-infra-stack');

// Synthesize the application to generate the Terraform JSON configuration.
app.synth();
