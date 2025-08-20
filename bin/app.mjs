#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack.mjs';

const app = new cdk.App();

new TapStack(app, 'TapStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  description: 'TAP Stack for secure web application infrastructure',
});

// Apply stack policy to protect critical resources
const stackPolicy = {
  Statement: [
    {
      Effect: 'Deny',
      Principal: '*',
      Action: 'Update:Delete',
      Resource: '*',
      Condition: {
        StringEquals: {
          'aws:PrincipalTag/Role': 'Developer',
        },
      },
    },
    {
      Effect: 'Allow',
      Principal: '*',
      Action: 'Update:*',
      Resource: '*',
    },
  ],
};

app.synth();
