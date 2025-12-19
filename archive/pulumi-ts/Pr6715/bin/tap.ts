#!/usr/bin/env node

import * as pulumi from '@pulumi/pulumi';
import { PaymentInfrastructure } from '../lib/infrastructure';

const config = new pulumi.Config();
// Use environment variables or defaults if config values aren't set
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';
const environment =
  config.get('environment') || process.env.ENVIRONMENT || 'dev';
const region = config.get('region') || process.env.AWS_REGION || 'us-east-1';

// Create the payment processing infrastructure
const infrastructure = new PaymentInfrastructure(
  `payment-infra-${environmentSuffix}`,
  {
    environmentSuffix,
    environment,
    region,
    rdsInstanceClass: config.get('rdsInstanceClass') || 'db.t3.medium',
    rdsBackupRetentionDays: config.getNumber('rdsBackupRetentionDays') || 3,
    lambdaMemorySize: config.getNumber('lambdaMemorySize') || 512,
    lambdaTimeout: config.getNumber('lambdaTimeout') || 30,
  }
);

// Export outputs
export const vpcId = infrastructure.vpc.id;
export const privateSubnetIds = infrastructure.privateSubnetIds;
export const publicSubnetIds = infrastructure.publicSubnetIds;
export const apiGatewayEndpoint = infrastructure.apiGatewayEndpoint;
export const rdsEndpoint = infrastructure.rdsEndpoint;
export const auditLogsBucketName = infrastructure.auditLogsBucket.bucket;
export const paymentQueueUrl = infrastructure.paymentQueue.url;
export const processPaymentLambdaArn =
  infrastructure.processPaymentLambda.lambdaArn;
export const verifyPaymentLambdaArn =
  infrastructure.verifyPaymentLambda.lambdaArn;
