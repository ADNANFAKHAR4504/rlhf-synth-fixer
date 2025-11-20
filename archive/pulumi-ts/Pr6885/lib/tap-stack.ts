import * as pulumi from '@pulumi/pulumi';
import { EnvironmentConfig } from './types';
import { PaymentEnvironmentComponent } from './payment-environment';

// Get configuration from Pulumi config
const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');
const environment = config.get('environment') || 'dev';

// Define environment configurations
const environments: { [key: string]: EnvironmentConfig } = {
  dev: {
    name: 'dev',
    logRetentionDays: 7,
    lambdaConcurrency: 10,
    rdsAlarmThreshold: 80,
    enableWaf: false,
  },
  staging: {
    name: 'staging',
    logRetentionDays: 30,
    lambdaConcurrency: 50,
    rdsAlarmThreshold: 75,
    enableWaf: false,
  },
  prod: {
    name: 'prod',
    logRetentionDays: 90,
    lambdaConcurrency: 200,
    rdsAlarmThreshold: 70,
    enableWaf: true,
  },
};

// Get the configuration for the current environment
const envConfig = environments[environment];
if (!envConfig) {
  throw new Error(
    `Invalid environment: ${environment}. Must be one of: dev, staging, prod`
  );
}

// Create infrastructure for the specified environment
const paymentInfra = new PaymentEnvironmentComponent(
  `${environment}-payment-infra`,
  {
    environment: environment,
    environmentSuffix: environmentSuffix,
    config: envConfig,
  }
);

// Export outputs
export const vpcId = paymentInfra.network.vpc.id;
export const subnetIds = pulumi
  .output(paymentInfra.network.privateSubnets)
  .apply(subnets => subnets.map(s => s.id));
export const databaseEndpoint = paymentInfra.database.cluster.endpoint;
export const databaseArn = paymentInfra.database.cluster.arn;
export const apiEndpoint = paymentInfra.api.stage.invokeUrl;
export const transactionTableName = paymentInfra.storage.transactionTable.name;
export const transactionTableArn = paymentInfra.storage.transactionTable.arn;
export const auditBucketName = paymentInfra.storage.auditBucket.bucket;
export const auditBucketArn = paymentInfra.storage.auditBucket.arn;
export const lambdaFunctionArn =
  paymentInfra.compute.paymentProcessorFunction.arn;
export const lambdaFunctionName =
  paymentInfra.compute.paymentProcessorFunction.name;
export const validationFunctionArn =
  paymentInfra.compute.validationFunction.arn;
export const validationFunctionName =
  paymentInfra.compute.validationFunction.name;
export const wafAclArn = paymentInfra.api.wafAcl?.arn;
