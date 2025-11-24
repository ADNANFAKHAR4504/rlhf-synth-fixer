import { TapStack } from '../lib/tap-stack';

// Create the main stack
const stack = new TapStack('tap-stack');

// Export outputs
export const vpcIds = stack.vpcIds;
export const globalClusterIdentifier = stack.auroraGlobalCluster.id;
export const migrationTableName = stack.migrationStateTable.name;
export const validationLambdaArn = stack.validationLambda.arn;
export const notificationTopicArn = stack.notificationTopic.arn;
