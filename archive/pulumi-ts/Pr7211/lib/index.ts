import * as pulumi from '@pulumi/pulumi';
import { TapStack } from './tap-stack';

// Get configuration
const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');
const createHostedZone = config.getBoolean('createHostedZone') || false;

// Create the main stack
const stack = new TapStack(`tap-stack-${environmentSuffix}`, {
  environmentSuffix,
  createHostedZone,
  primaryRegion: 'us-east-1',
  secondaryRegion: 'us-east-2',
  tags: {
    Environment: environmentSuffix,
    ManagedBy: 'pulumi',
    Project: 'payment-processing',
  },
});

// Export the stack outputs
export const primaryApiEndpoint = stack.primaryApiEndpoint;
export const secondaryApiEndpoint = stack.secondaryApiEndpoint;
export const failoverDnsName = stack.failoverDnsName;
export const primaryHealthCheckUrl = stack.primaryHealthCheckUrl;
export const secondaryHealthCheckUrl = stack.secondaryHealthCheckUrl;
export const healthCheckPrimaryId = stack.healthCheckPrimaryId;
export const healthCheckSecondaryId = stack.healthCheckSecondaryId;
export const replicationLagAlarmArn = stack.replicationLagAlarmArn;
export const dynamoDbTableName = stack.dynamoDbTableName;
export const s3BucketPrimaryName = stack.s3BucketPrimaryName;
export const s3BucketSecondaryName = stack.s3BucketSecondaryName;
export const dlqPrimaryUrl = stack.dlqPrimaryUrl;
export const dlqSecondaryUrl = stack.dlqSecondaryUrl;
export const hostedZoneId = stack.hostedZoneId;
export const hostedZoneNameServers = stack.hostedZoneNameServers;

// Export the TapStack class for use in tests and other modules
export { TapStack } from './tap-stack';
