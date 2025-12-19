import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Get the environment suffix from environment variables, defaulting to 'dev'
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get metadata from environment variables for tagging purposes
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const createdAt = new Date().toISOString();

// Define default tags to apply to all resources
const defaultTags = {
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  CreatedAt: createdAt,
};

// Region-agnostic configuration (Requirement 7)
const config = new pulumi.Config('aws');
const region = config.get('region') || process.env.AWS_REGION || 'us-east-1';

// Configure AWS provider with default tags
const provider = new aws.Provider('aws', {
  region: region,
  defaultTags: {
    tags: defaultTags,
  },
});

// Instantiate the optimized stack
const stack = new TapStack(
  'pulumi-infra',
  {
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);

// Export stack outputs
export const distributionUrl = stack.distributionUrl;
export const bucketName = stack.bucketName;
export const invalidationCommand = stack.invalidationCommand;
