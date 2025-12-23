import * as random from '@pulumi/random';
import { RDSOptimizationStack } from '../lib/rds-stack';

// Configuration - RDS PostgreSQL Optimization
// Use environment variables for configuration (set by CI/CD deployment script)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Generate a random password for RDS (for synthetic tasks)
const dbPasswordResource = new random.RandomPassword(
  `db-password-${environmentSuffix}`,
  {
    length: 16,
    special: true,
    overrideSpecial: '!#$%&*()-_=+[]{}<>:?',
  }
);
const dbPassword = dbPasswordResource.result;

const region = process.env.AWS_REGION || 'us-east-1';

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
