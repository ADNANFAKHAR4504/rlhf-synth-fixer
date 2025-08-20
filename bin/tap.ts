#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'cdktf';
import { TapStack, TapStackConfig } from '../lib/tap-stack';

const app = new App();

const environments: TapStackConfig[] = [
  {
    environment: 'dev',
    vpcCidr: '10.10.0.0/16',
    instanceType: 't3.micro',
    dbInstanceClass: 'db.t3.micro',
    tags: { Environment: 'Development', ManagedBy: 'CDKTF' },
  },
  {
    environment: 'test',
    vpcCidr: '10.20.0.0/16',
    instanceType: 't3.small',
    dbInstanceClass: 'db.t3.small',
    tags: { Environment: 'Test', ManagedBy: 'CDKTF' },
  },
  {
    environment: 'prod',
    vpcCidr: '10.30.0.0/16',
    instanceType: 't3.medium',
    dbInstanceClass: 'db.t3.medium',
    tags: { Environment: 'Production', ManagedBy: 'CDKTF' },
  },
];

// Create a separate stack for each environment
environments.forEach(config => {
  new TapStack(app, `webapp-${config.environment}`, config);
});

app.synth();
