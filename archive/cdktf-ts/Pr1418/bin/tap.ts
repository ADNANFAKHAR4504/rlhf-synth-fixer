#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'cdktf';
import { SecureInfraStack } from '../lib/secure-infra-stack';

const app = new App();

new SecureInfraStack(app, 'secure-infra-stack');

app.synth();
