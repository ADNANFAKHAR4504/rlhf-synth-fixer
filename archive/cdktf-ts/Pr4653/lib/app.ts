#!/usr/bin/env node
import { App } from 'cdktf';
import { FinTechTradingStack } from './main';

// Application entry point
const app = new App();

new FinTechTradingStack(app, 'fintech-trading-stack', {
  environmentSuffix: process.env.ENVIRONMENT_SUFFIX || 'dev',
  region: 'ca-central-1',
  vpcCidr: '10.0.0.0/16',
  dbUsername: 'dbadmin',
  enableMutualTls: true,
});

app.synth();
