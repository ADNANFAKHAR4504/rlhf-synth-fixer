#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Tags } from 'aws-cdk-lib';
import { TapStack, EnvironmentConfig } from '../lib/tap-stack';

// Environment configurations
const environmentConfigs: Record<string, EnvironmentConfig> = {
  development: {
    environment: 'Development',
    vpcCidr: '10.0.0.0/16',
    instanceType: ec2.InstanceType.of(
      ec2.InstanceClass.T3,
      ec2.InstanceSize.MICRO
    ),
    dbInstanceClass: ec2.InstanceType.of(
      ec2.InstanceClass.T3,
      ec2.InstanceSize.SMALL
    ),
    dbAllocatedStorage: 20,
    bucketVersioning: false,
  },
  staging: {
    environment: 'Staging',
    vpcCidr: '10.1.0.0/16',
    instanceType: ec2.InstanceType.of(
      ec2.InstanceClass.T3,
      ec2.InstanceSize.SMALL
    ),
    dbInstanceClass: ec2.InstanceType.of(
      ec2.InstanceClass.T3,
      ec2.InstanceSize.SMALL
    ),
    dbAllocatedStorage: 50,
    bucketVersioning: true,
  },
  production: {
    environment: 'Production',
    vpcCidr: '10.2.0.0/16',
    instanceType: ec2.InstanceType.of(
      ec2.InstanceClass.T3,
      ec2.InstanceSize.MEDIUM
    ),
    dbInstanceClass: ec2.InstanceType.of(
      ec2.InstanceClass.T3,
      ec2.InstanceSize.MEDIUM
    ),
    dbAllocatedStorage: 100,
    customAmiId: 'ami-0abcdef1234567890', // Custom production AMI
    bucketVersioning: true,
  },
};

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Get environment name from context or default to development
const envName = app.node.tryGetContext('environment') || 'development';
const config = environmentConfigs[envName];

if (!config) {
  throw new Error(
    `Unknown environment: ${envName}. Available environments: ${Object.keys(environmentConfigs).join(', ')}`
  );
}

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  config: config, // Pass the configuration
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});
