#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'cdktf';
import { MultiRegionSecurityStack } from '../lib/tap-stack';

const app = new App();
new MultiRegionSecurityStack(app, 'multi-region-secure-stack');
app.synth();
