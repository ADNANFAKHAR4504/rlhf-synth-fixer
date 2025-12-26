#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'cdktf';
import { TapStack, EnvironmentConfig } from '../lib/tap-stack';

const app = new App();

// Define all environment configurations in a single array.
const allEnvironments: EnvironmentConfig[] = [
  {
    envName: 'dev',
    awsRegion: 'us-east-1',
    instanceType: 't3.micro',
    vpcCidr: '10.10.0.0/16', // Unique CIDR for Development
    tags: {
      Environment: 'Development',
      Project: 'WebApp',
      ManagedBy: 'CDKTF',
    },
  },
  {
    envName: 'staging',
    awsRegion: 'us-east-1',
    instanceType: 't3.small',
    vpcCidr: '10.20.0.0/16', // Unique CIDR for Staging
    tags: {
      Environment: 'Staging',
      Project: 'WebApp',
      ManagedBy: 'CDKTF',
    },
  },
  {
    envName: 'prod',
    awsRegion: 'us-east-1',
    instanceType: 't3.medium',
    vpcCidr: '10.30.0.0/16', // Unique CIDR for Production
    tags: {
      Environment: 'Production',
      Project: 'WebApp',
      ManagedBy: 'CDKTF',
    },
  },
];

// A single stack to manage all environments - RENAMED STACK INSTANCE
new TapStack(app, 'UnifiedWebAppStack', {
  environments: allEnvironments,
});

app.synth();
