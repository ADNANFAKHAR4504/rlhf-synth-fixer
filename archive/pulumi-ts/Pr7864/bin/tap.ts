#!/usr/bin/env node
import * as pulumi from '@pulumi/pulumi';
import { ComplianceMonitoringStack } from '../lib/compliance-monitoring-stack';

const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');

const stack = new ComplianceMonitoringStack(
  `ComplianceMonitoring-${environmentSuffix}`,
  {
    environmentSuffix,
    tags: {
      Environment: environmentSuffix,
      Project: 'ComplianceMonitoring',
      ManagedBy: 'Pulumi',
    },
  }
);

// Export stack outputs
export const reportBucketName = stack.reportBucketName;
export const complianceTopicArn = stack.complianceTopicArn;
export const dashboardName = stack.dashboardName;
export const analyzerFunctionName = stack.analyzerFunctionName;
export const reportGeneratorFunctionName = stack.reportGeneratorFunctionName;
export const deepScannerFunctionName = stack.deepScannerFunctionName;
