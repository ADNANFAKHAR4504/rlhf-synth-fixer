#!/usr/bin/env node
/**
 * tap.ts
 *
 * Entry point for the Pulumi program. Creates the main TapStack
 * and exports stack outputs.
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Get configuration from Pulumi config or environment variables
const config = new pulumi.Config();
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

// Create the main stack
const stack = new TapStack('tap', {
  environmentSuffix: environmentSuffix,
  tags: {
    ManagedBy: 'Pulumi',
    Environment: environmentSuffix,
  },
});

// Export stack outputs
export const bucketName = stack.bucketName;
export const bucketArn = stack.bucketArn;
