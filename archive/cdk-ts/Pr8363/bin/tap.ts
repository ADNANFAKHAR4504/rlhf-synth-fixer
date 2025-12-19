#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack, EnvironmentConfig } from '../lib/tap-stack';

const app = new cdk.App();

// Retrieve the environment name from the context (default to 'dev' if not provided)
const envName = app.node.tryGetContext('env') || 'dev';

// Define environment-specific configurations
const environmentConfigs: Record<string, EnvironmentConfig> = {
  dev: {
    environmentName: 'dev',
    cloudProvider: 'aws',
    awsRegion: process.env.AWS_REGION || 'us-east-1',
    awsVpcCidr: '10.0.0.0/16',
    awsAmi: 'ami-0c02fb55956c7d316', // Amazon Linux 2023 AMI (us-east-1)
    awsInstanceType: 't3.micro',
    awsS3BucketSuffix: 'dev-bucket',
    azureLocation: 'East US',
    azureVnetCidr: '10.1.0.0/16',
    azureVmSize: 'Standard_B1s',
    azureStorageSku: 'Standard_LRS',
    azureStorageAccountName: 'devstorage',
  },
  staging: {
    environmentName: 'staging',
    cloudProvider: 'aws',
    awsRegion: process.env.AWS_REGION || 'us-east-1',
    awsVpcCidr: '10.10.0.0/16',
    awsAmi: 'ami-0c02fb55956c7d316', // Amazon Linux 2023 AMI (us-east-1)
    awsInstanceType: 't3.small',
    awsS3BucketSuffix: 'staging-bucket',
    azureLocation: 'West US',
    azureVnetCidr: '10.11.0.0/16',
    azureVmSize: 'Standard_B2s',
    azureStorageSku: 'Standard_LRS',
    azureStorageAccountName: 'stagingstorage',
  },
  prod: {
    environmentName: 'prod',
    cloudProvider: 'aws',
    awsRegion: process.env.AWS_REGION || 'us-east-1',
    awsVpcCidr: '10.20.0.0/16',
    awsAmi: 'ami-0c02fb55956c7d316', // Amazon Linux 2023 AMI (us-east-1)
    awsInstanceType: 't3.medium',
    awsS3BucketSuffix: 'prod-bucket',
    azureLocation: 'East US',
    azureVnetCidr: '10.21.0.0/16',
    azureVmSize: 'Standard_B4ms',
    azureStorageSku: 'Premium_LRS',
    azureStorageAccountName: 'prodstorage',
  },
};

// Retrieve the configuration for the selected environment
const config = environmentConfigs[envName];

if (!config) {
  throw new Error(
    `Unknown environment: ${envName}. Valid environments are: ${Object.keys(environmentConfigs).join(', ')}`,
  );
}

// Instantiate the TapStack with environment-specific configuration
// Stack name format: TapStack${ENVIRONMENT_SUFFIX} (e.g., TapStackdev, TapStackpr8363)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || config.environmentName;
new TapStack(app, `TapStack${environmentSuffix}`, {
  environmentConfig: config,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
    region: config.awsRegion,
  },
  description: `Multi-cloud infrastructure for ${config.environmentName} environment`,
});

app.synth();
