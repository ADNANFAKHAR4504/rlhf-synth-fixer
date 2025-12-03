import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { RDSOptimizationStack } from '../lib/rds-stack';

// Configuration
const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');
const dbPassword = config.requireSecret('dbPassword');
const region = aws.config.region || 'us-east-1';

// Create the RDS optimization stack
const stack = new RDSOptimizationStack('rds-optimization', {
  environmentSuffix,
  dbPassword,
  region,
});

// Exports
export const vpcId = stack.vpcId;
export const dbInstanceId = stack.dbInstanceId;
export const dbInstanceEndpoint = stack.dbInstanceEndpoint;
export const dbInstanceAddress = stack.dbInstanceAddress;
export const readReplicaEndpoint = stack.readReplicaEndpoint;
export const readReplicaAddress = stack.readReplicaAddress;
export const dbSecurityGroupId = stack.dbSecurityGroupId;
export const dbParameterGroupName = stack.dbParameterGroupName;
export const snsTopicArn = stack.snsTopicArn;
export const cpuAlarmName = stack.cpuAlarmName;
export const storageAlarmName = stack.storageAlarmName;
export const replicaLagAlarmName = stack.replicaLagAlarmName;
