/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 * 
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration based on the deployment environment. It handles environment-specific settings,
 * tagging, and deployment configuration for AWS resources.
 * 
 * The stack created by this module uses environment suffixes to distinguish between
 * different deployment environments (development, staging, production, etc.).
 */

import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Initialize Pulumi configuration for the current stack.
const config = new pulumi.Config();

// Get the environment suffix from the Pulumi config, defaulting to 'dev'.
// You can set this value using the command: `pulumi config set env <environment>`
const environmentSuffix = config.get('env') || 'dev';

// Get the migration phase from config (defaults to 'initial')
const migrationPhase = config.get('migrationPhase') as 'initial' | 'peering' | 'replication' | 'cutover' | 'complete' || 'initial';

// Get traffic weight target from config (defaults to 0)
const trafficWeightTarget = config.getNumber('trafficWeightTarget') || 0;

// Get error threshold from config (defaults to 5)
const errorThreshold = config.getNumber('errorThreshold') || 5;

// Get rollback enabled setting from config (defaults to true)
const rollbackEnabled = config.getBoolean('rollbackEnabled') !== false;

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new TapStack('pulumi-infra', {
  environmentSuffix: environmentSuffix,
  migrationPhase: migrationPhase,
  trafficWeightTarget: trafficWeightTarget,
  errorThreshold: errorThreshold,
  rollbackEnabled: rollbackEnabled,
});

// Export individual stack outputs for easy access
export const targetVpcId = stack.targetVpc.id;
export const targetVpcCidr = stack.targetVpc.cidrBlock;
export const vpcPeeringId = stack.vpcPeering.id;
export const targetRdsEndpoint = stack.targetRdsInstance.endpoint;
export const loadBalancerDns = stack.targetLoadBalancer.dnsName;
export const route53RecordName = stack.route53Record.name;
export const dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=${stack.migrationDashboard.dashboardName}`;
export const rollbackTopicArn = stack.rollbackTopic.arn;

// Export the outputs object without explicit type annotation to avoid TS4023 error
// TypeScript will infer the type from stack.outputs
export const stackOutputs = stack.outputs;
