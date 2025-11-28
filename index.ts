import * as pulumi from '@pulumi/pulumi';
import { TapStack } from './lib/tap-stack';

// Create the stack instance
const stack = new TapStack('crypto-alerts-stack', {
  environmentSuffix: pulumi.getStack(),
  logRetentionDays: 14,
  priceCheckerTimeout: 60,
  priceCheckerMemorySize: 512,
  alertProcessorTimeout: 30,
  alertProcessorMemorySize: 256,
  scheduleExpression: 'cron(* * * * ? *)', // Every minute
  kmsKeyDeletionWindowInDays: 7,
  exchangeApiEndpoint: 'https://api.exchange.com/v1/prices',
});

// Export stack outputs
export const tableName = stack.tableName;
export const tableArn = stack.tableArn;
export const topicArn = stack.topicArn;
export const priceCheckerFunctionName = stack.priceCheckerFunctionName;
export const priceCheckerFunctionArn = stack.priceCheckerFunctionArn;
export const alertProcessorFunctionName = stack.alertProcessorFunctionName;
export const alertProcessorFunctionArn = stack.alertProcessorFunctionArn;
export const kmsKeyId = stack.kmsKeyId;
export const kmsKeyAlias = stack.kmsKeyAlias.name;
export const eventRuleName = stack.eventRuleName;
export const streamEventSourceMapping = stack.streamEventSourceMapping.id;
export const priceCheckerTarget = stack.priceCheckerTarget.id;
export const priceCheckerPermission = stack.priceCheckerPermission.id;
