/**
 * index.ts
 *
 * Main entry point for the Pulumi program.
 * Instantiates the TapStack component with environment-specific configuration.
 */
import { TapStack } from './tap-stack';

// Get environment suffix from environment variable or use default
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synth-trainr147';

// Create the main stack
const tapStack = new TapStack('TapStack', {
  environmentSuffix: environmentSuffix,
  tags: {
    Environment: 'Development',
    Repository: process.env.REPOSITORY || 'unknown',
    CommitAuthor: process.env.COMMIT_AUTHOR || 'unknown',
  },
});

// Export stack outputs
export const bucketName = tapStack.bucketName;
export const instanceId = tapStack.instanceId;
