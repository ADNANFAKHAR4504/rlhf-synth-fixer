#!/usr/bin/env node
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');
const alertEmail = config.get('alertEmail') || 'compliance-team@example.com';

const stack = new TapStack(`ComplianceMonitoring-${environmentSuffix}`, {
  environmentSuffix,
  alertEmail,
  tags: {
    Environment: environmentSuffix,
    Project: 'ComplianceMonitoring',
    ManagedBy: 'Pulumi',
  },
});

// Export stack outputs
export const bucketName = stack.bucketName;
export const topicArn = stack.topicArn;
export const scannerFunctionName = stack.scannerFunctionName;
export const scannerFunctionArn = stack.scannerFunctionArn;
export const reporterFunctionName = stack.reporterFunctionName;
export const reporterFunctionArn = stack.reporterFunctionArn;
export const dashboardName = stack.dashboardName;
export const scannerLogGroupName = stack.scannerLogGroupName;
export const reporterLogGroupName = stack.reporterLogGroupName;
