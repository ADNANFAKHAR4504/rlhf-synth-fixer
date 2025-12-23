#!/usr/bin/env node
/**
 * tap.ts
 *
 * Entry point for the Pulumi program.
 * Instantiates the TapStack with configuration from Pulumi config.
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Get Pulumi configuration
const config = new pulumi.Config();

// Read configuration with defaults
// Support both Pulumi config and environment variable for environmentSuffix
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX;
if (!environmentSuffix) {
  throw new Error(
    'environmentSuffix must be set via Pulumi config or ENVIRONMENT_SUFFIX environment variable'
  );
}
const containerMemory = config.get('containerMemory') || '512';
const containerCpu = config.get('containerCpu') || '256';
const team = config.get('team') || 'platform';
const project = config.get('project') || 'ecs-optimization';

// Create the stack
const stack = new TapStack('tap-stack', {
  environmentSuffix: environmentSuffix,
  containerMemory: containerMemory,
  containerCpu: containerCpu,
  tags: {
    Team: team,
    Project: project,
  },
});

// Export stack outputs
export const albDnsName = stack.albDnsName;
export const serviceArn = stack.serviceArn;
export const clusterName = stack.clusterName;
export const logGroupName = stack.logGroupName;
