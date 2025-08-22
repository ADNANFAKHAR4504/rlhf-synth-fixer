#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'cdktf';
import { MultiEnvironmentStack } from '../lib/tap-stack';

const app = new App();

// Use the new class name here
new MultiEnvironmentStack(app, 'multi-environment-stack');

app.synth();
