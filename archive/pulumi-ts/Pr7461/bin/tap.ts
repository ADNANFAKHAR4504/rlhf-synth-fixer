/**
 * Pulumi application entry point for Crypto Alerts Infrastructure.
 *
 * This module orchestrates the deployment of a serverless cryptocurrency price alert system
 * using Lambda, DynamoDB, SNS, EventBridge, and supporting AWS services.
 */

import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Get configuration values
const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || pulumi.getStack();
const region = config.get('region') || 'us-east-1';
const costCenter = config.get('costCenter') || 'crypto-alerts-team';
const complianceScope = config.get('complianceScope') || 'SOC2';

// Lambda configuration
const priceCheckerTimeout = config.getNumber('priceCheckerTimeout') || 60;
const priceCheckerMemorySize =
  config.getNumber('priceCheckerMemorySize') || 512;
const alertProcessorTimeout = config.getNumber('alertProcessorTimeout') || 30;
const alertProcessorMemorySize =
  config.getNumber('alertProcessorMemorySize') || 256;

// Operational configuration
const logRetentionDays = config.getNumber('logRetentionDays') || 14;
const scheduleExpression =
  config.get('scheduleExpression') || 'cron(* * * * ? *)';
const kmsKeyDeletionWindowInDays =
  config.getNumber('kmsKeyDeletionWindowInDays') || 7;
const exchangeApiEndpoint =
  config.get('exchangeApiEndpoint') || 'https://api.exchange.com/v1/prices';

// Get metadata from environment variables for tagging
const repository = process.env.REPOSITORY || 'iac-test-automations';
const commitAuthor = process.env.COMMIT_AUTHOR || 'crypto-alerts-team';
const prNumber = process.env.PR_NUMBER || 'n/a';
const team = process.env.TEAM || 'infrastructure';
const createdAt = new Date().toISOString();

// Define comprehensive tags as per requirements
const defaultTags = {
  Environment: environmentSuffix,
  Service: 'crypto-alerts',
  CostCenter: costCenter,
  ComplianceScope: complianceScope,
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
  ManagedBy: 'Pulumi',
};

// Configure AWS provider with default tags
const provider = new aws.Provider('aws-provider', {
  region: region,
  defaultTags: {
    tags: defaultTags,
  },
});

// Instantiate the main crypto alerts stack
const cryptoAlertsStack = new TapStack(
  'crypto-alerts-stack',
  {
    environmentSuffix,
    logRetentionDays,
    priceCheckerTimeout,
    priceCheckerMemorySize,
    alertProcessorTimeout,
    alertProcessorMemorySize,
    scheduleExpression,
    kmsKeyDeletionWindowInDays,
    exchangeApiEndpoint,
  },
  { provider }
);

// Export stack outputs for monitoring and integration
export const tableName = cryptoAlertsStack.tableName;
export const tableArn = cryptoAlertsStack.tableArn;
export const topicArn = cryptoAlertsStack.topicArn;
export const priceCheckerFunctionName =
  cryptoAlertsStack.priceCheckerFunctionName;
export const priceCheckerFunctionArn =
  cryptoAlertsStack.priceCheckerFunctionArn;
export const alertProcessorFunctionName =
  cryptoAlertsStack.alertProcessorFunctionName;
export const alertProcessorFunctionArn =
  cryptoAlertsStack.alertProcessorFunctionArn;
export const kmsKeyId = cryptoAlertsStack.kmsKeyId;
export const kmsKeyAlias = cryptoAlertsStack.kmsKeyAlias.name;
export const eventRuleName = cryptoAlertsStack.eventRuleName;
export const streamEventSourceMappingId =
  cryptoAlertsStack.streamEventSourceMapping.id;
export const priceCheckerTargetId = cryptoAlertsStack.priceCheckerTarget.id;
export const priceCheckerPermissionId =
  cryptoAlertsStack.priceCheckerPermission.id;
