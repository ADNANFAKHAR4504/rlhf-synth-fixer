import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'synth';
const createdAt = new Date().toISOString();

const defaultTags = {
  Environment: 'Production',
  DisasterRecovery: 'Enabled',
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
};

const stack = new TapStack('dr-infrastructure', {
  environmentSuffix,
  tags: defaultTags,
});

// Export all stack outputs to make them available to Pulumi CLI and integration tests
export const primaryVpcId = stack.primaryVpcId;
export const drVpcId = stack.drVpcId;
export const auroraGlobalClusterId = stack.auroraGlobalClusterId;
export const primaryClusterEndpoint = stack.primaryClusterEndpoint;
export const drClusterEndpoint = stack.drClusterEndpoint;
export const dynamoTableName = stack.dynamoTableName;
export const primaryBucketName = stack.primaryBucketName;
export const drBucketName = stack.drBucketName;
export const primaryAlbDnsName = stack.primaryAlbDnsName;
export const drAlbDnsName = stack.drAlbDnsName;
export const hostedZoneId = stack.hostedZoneId;
export const hostedZoneName = stack.hostedZoneName;
export const primaryHealthCheckUrl = stack.primaryHealthCheckUrl;
export const drHealthCheckUrl = stack.drHealthCheckUrl;
