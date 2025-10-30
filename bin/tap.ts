/**
 * bin/tap.ts
 *
 * Main entry point for the Pulumi program.
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Get the Pulumi configuration
const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || 'dev';

// Create the main stack
const stack = new TapStack('payment-webhook-stack', {
  environmentSuffix: environmentSuffix,
});

// Export the outputs
export const apiEndpoint = stack.apiEndpoint;
export const tableName = stack.tableName;
export const bucketName = stack.bucketName;
