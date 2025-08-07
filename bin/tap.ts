// bin/tap.ts

import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack'; // Import the TapStack class

// This file is the entry point for your CDKTF application.
// It instantiates your main stack with the desired configuration.

const app = new App();

// Only create the development stack to avoid the "Found more than one stack" error
new TapStack(app, 'tap-stack-dev', {
  awsRegion: 'us-east-1',
  vpcCidr: '10.0.0.0/16',
  tags: {
    Project: 'TapProject',
    Environment: 'dev',
    Owner: 'Akshat Jain',
  },
  allowedIngressCidrBlocks: ['192.168.1.0/24'],
});

app.synth();
