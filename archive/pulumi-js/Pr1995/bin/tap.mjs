#!/usr/bin/env node
/**
 * Main entry point for Pulumi deployment
 * This file instantiates the TapStack with the appropriate configuration
 */

import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack.mjs';

// Get environment suffix from environment variable or use default
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || `synthtrainr130new`;

// Create the main stack
const stack = new TapStack('TapStack', {
  environmentSuffix: environmentSuffix,
  tags: {
    Project: 'SecureApp',
    Environment: environmentSuffix,
    ManagedBy: 'Pulumi',
    Repository: process.env.REPOSITORY || 'unknown',
    CommitAuthor: process.env.COMMIT_AUTHOR || 'unknown',
  },
});

// Export the stack outputs
export const vpcId = stack.vpcId;
export const bucketName = stack.bucketName;
export const rdsEndpoint = stack.rdsEndpoint;
export const instanceIds = stack.ec2InstanceIds;
