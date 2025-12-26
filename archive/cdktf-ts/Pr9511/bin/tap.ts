#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'cdktf';
import { TapStack, EnvironmentConfig } from '../lib/tap-stack';

const app = new App();

// Define all environment configurations.
// The stack now creates its own VPC, so we only need to provide a CIDR block.
const allEnvironments: EnvironmentConfig[] = [
  {
    envName: 'dev',
    awsRegion: 'us-east-1',
    replicaRegion: 'us-west-2',
    vpcCidr: '10.10.0.0/16', // CIDR for the new VPC
    tags: {
      Environment: 'Development',
      ManagedBy: 'CDKTF',
      CostCenter: 'DevTeam',
    },
  },
  {
    envName: 'prod',
    awsRegion: 'us-east-1',
    replicaRegion: 'us-west-2',
    vpcCidr: '10.20.0.0/16', // A different CIDR for the prod VPC
    tags: {
      Environment: 'Production',
      ManagedBy: 'CDKTF',
      CostCenter: 'ProdOps',
    },
  },
];

// A single stack to manage all environments and regions
new TapStack(app, 'unified-ecs-stack', { environments: allEnvironments });

app.synth();
