#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'cdktf';
import { EnterpriseStack } from '../lib/tap-stack';

const app = new App();
new EnterpriseStack(app, 'enterprise-stack-prod', 'prod');
app.synth();
