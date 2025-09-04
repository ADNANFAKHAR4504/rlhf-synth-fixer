#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'cdktf';
import { TapStack, TapStackConfig } from '../lib/tap-stack';

const app = new App();

// A single list containing the configuration for every environment
const allEnvironments: TapStackConfig[] = [
  {
    environment: 'dev',
    vpcCidr: '10.10.0.0/16',
    instanceType: 't3.micro',
    dbInstanceClass: 'db.t3.micro',
    tags: { Environment: 'Development', ManagedBy: 'CDKTF' },
  },
  {
    environment: 'staging',
    vpcCidr: '10.20.0.0/16',
    instanceType: 't3.small',
    dbInstanceClass: 'db.t3.small',
    tags: { Environment: 'Staging', ManagedBy: 'CDKTF' },
  },
  {
    environment: 'prod',
    vpcCidr: '10.30.0.0/16',
    instanceType: 't3.medium',
    dbInstanceClass: 'db.t3.medium',
    tags: { Environment: 'Production', ManagedBy: 'CDKTF' },
  },
];

// Instantiate the single stack ONCE and pass all environment configs to it.
// This one stack will manage all the resources defined in the list above.
new TapStack(app, 'unified-infra-stack', { environments: allEnvironments });

app.synth();
