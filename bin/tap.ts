#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'cdktf';
import { MultiRegionSecurityStack, StackConfig } from '../lib/tap-stack';

// FIX: Define the production configuration that will be passed to the stack.
const PROD_STACK_CONFIG: StackConfig = {
  commonTags: {
    Project: 'SecureCore',
    Owner: 'SRE-Team',
    Environment: 'Prod',
  },
  regions: [
    {
      region: 'us-east-1',
      vpcCidr: '10.1.0.0/16',
      publicSubnetCidr: '10.1.1.0/24',
      privateSubnetCidr: '10.1.2.0/24',
      dbSubnetACidr: '10.1.3.0/24',
      dbSubnetBCidr: '10.1.4.0/24',
      azA: 'us-east-1a',
      azB: 'us-east-1b',
    },
    {
      region: 'us-west-2',
      vpcCidr: '10.2.0.0/16',
      publicSubnetCidr: '10.2.1.0/24',
      privateSubnetCidr: '10.2.2.0/24',
      dbSubnetACidr: '10.2.3.0/24',
      dbSubnetBCidr: '10.2.4.0/24',
      azA: 'us-west-2a',
      azB: 'us-west-2b',
    },
    {
      region: 'eu-central-1',
      vpcCidr: '10.3.0.0/16',
      publicSubnetCidr: '10.3.1.0/24',
      privateSubnetCidr: '10.3.2.0/24',
      dbSubnetACidr: '10.3.3.0/24',
      dbSubnetBCidr: '10.3.4.0/24',
      azA: 'eu-central-1a',
      azB: 'eu-central-1b',
    },
  ],
};

const app = new App();

// FIX: Pass the production configuration as the third argument.
new MultiRegionSecurityStack(
  app,
  'multi-region-secure-stack',
  PROD_STACK_CONFIG
);

app.synth();
