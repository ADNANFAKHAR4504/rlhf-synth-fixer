#!/usr/bin/env node
/**
 * tap.ts
 *
 * Entry point for the Pulumi program.
 * This file initializes the main TapStack component with configuration.
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Get Pulumi configuration
const config = new pulumi.Config();

// Read configuration values
const environmentSuffix = config.get('environmentSuffix') || 'dev';
const complianceThreshold = config.getNumber('complianceThreshold') || 80;
const minRequiredTags = config.getNumber('minRequiredTags') || 3;
const alertEmail = config.get('alertEmail') || 'compliance-team@example.com';

// Common tags for all resources
const tags = {
  Project: 'InfrastructureCompliance',
  ManagedBy: 'Pulumi',
  Environment: environmentSuffix,
};

// Create the main stack
const stack = new TapStack('tap-stack', {
  environmentSuffix,
  tags,
  complianceThreshold,
  minRequiredTags,
  alertEmail,
});

// Export stack outputs
export const lambdaFunctionArn = stack.lambdaFunctionArn;
export const snsTopicArn = stack.snsTopicArn;
export const dashboardUrl = stack.dashboardUrl;
export const complianceMetricName = stack.complianceMetricName;
