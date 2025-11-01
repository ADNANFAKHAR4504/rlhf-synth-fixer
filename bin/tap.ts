/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();

const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

// Create the stack with proper arguments
const stack = new TapStack('pulumi-infra', {
  stackName: 'TapStack' + environmentSuffix,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  tags: defaultTags, 
  migrationPhase: 'initial',
});

// Export outputs
export const vpcId = stack.vpcId;
export const rdsEndpoint = stack.prodRdsEndpoint;
export const albDnsName = stack.albDnsName;
export const logBucket = stack.prodLogBucketName;
export const migrationStatus = stack.migrationStatus;
