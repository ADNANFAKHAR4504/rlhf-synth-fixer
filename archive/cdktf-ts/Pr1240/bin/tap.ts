#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'cdktf';
// FIX: Import the correct class name 'DualRegionHardenedStack' and the 'StackConfig' interface.
import { DualRegionHardenedStack, StackConfig } from '../lib/tap-stack';

// The production configuration for the stack.
const PROD_STACK_CONFIG: StackConfig = {
  commonTags: {
    Project: 'HardenedProject',
    Owner: 'SRE-Team',
    Environment: 'Prod',
  },
  regions: [
    {
      region: 'us-east-1',
      vpcCidr: '10.1.0.0/16',
      privateSubnetACidr: '10.1.1.0/24',
      privateSubnetBCidr: '10.1.2.0/24',
      azA: 'us-east-1a',
      azB: 'us-east-1b',
    },
    {
      region: 'us-west-2',
      vpcCidr: '10.2.0.0/16',
      privateSubnetACidr: '10.2.1.0/24',
      privateSubnetBCidr: '10.2.2.0/24',
      azA: 'us-west-2a',
      azB: 'us-west-2b',
    },
  ],
};

const app = new App();

// FIX: Instantiate the correct class and pass the configuration object.
new DualRegionHardenedStack(
  app,
  'dual-region-hardened-stack',
  PROD_STACK_CONFIG
);

app.synth();
