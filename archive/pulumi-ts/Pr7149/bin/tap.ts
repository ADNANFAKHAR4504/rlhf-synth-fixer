import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Get environment suffix from environment variable or default to 'dev'
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Configure AWS provider
const provider = new aws.Provider('aws-provider', {
  region: 'us-east-1',
});

// Default tags for all resources
const defaultTags = {
  Environment: environmentSuffix,
  ManagedBy: 'Pulumi',
  Project: 'TapStack',
};

// Create the stack
const stack = new TapStack(
  'pulumi-infra',
  {
    environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);

// Export stack outputs
export const albDnsName = stack.albDnsName;
export const clusterEndpoint = stack.clusterEndpoint;
export const staticBucketName = stack.staticBucketName;
export const auditBucketName = stack.auditBucketName;
