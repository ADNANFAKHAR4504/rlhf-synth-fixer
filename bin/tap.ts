#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'cdktf';
import { TapStack, EnvironmentConfig } from '../lib/tap-stack';

const app = new App();

// Define all environment configurations in one place.
const allEnvironments: EnvironmentConfig[] = [
  {
    envName: 'dev',
    awsRegion: 'us-east-1',
    replicaRegion: 'us-west-2', // Region for S3 bucket replication
    awsAccountId: '123456789012', // Replace with your Dev Account ID
    vpcId: 'vpc-0123abcd',
    publicSubnetIds: ['subnet-0123puba', 'subnet-0123pubb'],
    privateSubnetIds: ['subnet-0123pria', 'subnet-0123prib'],
    amiId: 'ami-0c55b159cbfafe1f0',
    cpu: 256,
    memory: 512,
    tags: {
      Environment: 'Development',
      ManagedBy: 'CDKTF',
      CostCenter: 'DevTeam',
    },
  },
  {
    envName: 'prod',
    awsRegion: 'us-east-1',
    replicaRegion: 'us-west-2', // Region for S3 bucket replication
    awsAccountId: '210987654321', // Replace with your Prod Account ID
    vpcId: 'vpc-prod1234',
    publicSubnetIds: ['subnet-prodpuba', 'subnet-prodpubb'],
    privateSubnetIds: ['subnet-prodpria', 'subnet-prodprib'],
    amiId: 'ami-0c55b159cbfafe1f0',
    cpu: 1024,
    memory: 2048,
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
