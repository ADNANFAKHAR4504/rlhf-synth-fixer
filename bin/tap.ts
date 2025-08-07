// bin/tap.ts

import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack'; // Import the TapStack class

// This file is the entry point for your CDKTF application.
// It instantiates your main stack with the desired configuration.

const app = new App();

new TapStack(app, 'tap-stack-dev-new', {
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
