/**
 * Main entry point for Pulumi deployment
 */
import { TapStack } from './lib/tap-stack.mjs';

// Get environment suffix from environment variable
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synthtrainr129new';

// Create the serverless infrastructure stack
const stack = new TapStack('TapStack', {
    environmentSuffix: environmentSuffix,
    tags: {
        Project: 'TapServerless',
        Environment: environmentSuffix,
        ManagedBy: 'Pulumi',
        Repository: process.env.REPOSITORY || 'iac-test-automations',
        CommitAuthor: process.env.COMMIT_AUTHOR || 'qa-agent'
    }
});

// Export the outputs
export const bucketName = stack.bucketName;
export const apiUrl = stack.apiUrl;
export const lambdaArns = stack.lambdaArns;