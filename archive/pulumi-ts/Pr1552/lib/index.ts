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

// Export stack outputs for integration tests
export const InstanceId = tapStack.instanceId;
export const S3BucketName = tapStack.bucketName;
export const VPCId = tapStack.vpcId;
export const SubnetId = tapStack.subnetId;
export const SecurityGroupId = tapStack.securityGroupId;
export const InstancePublicIp = tapStack.instancePublicIp;
export const InstancePrivateIp = tapStack.instancePrivateIp;
export const S3BucketArn = tapStack.s3BucketArn;
