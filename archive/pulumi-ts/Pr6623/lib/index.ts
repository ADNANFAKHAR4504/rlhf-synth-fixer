/**
 * index.ts
 *
 * Main Pulumi program for the TapStack infrastructure.
 * This module instantiates all infrastructure resources and exports outputs.
 */
import * as aws from '@pulumi/aws';
import { TapStack } from './tap-stack';

// Get the environment suffix from environment variables, defaulting to 'dev'.
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get metadata from environment variables for tagging purposes.
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Define default tags to apply to all resources.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
};

// Configure AWS provider with default tags
const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

// Instantiate the main stack component
const stack = new TapStack(
  'pulumi-infra',
  {
    environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);

// Export stack outputs - using both naming conventions for compatibility
// Camel case (Pulumi convention)
export const albDnsName = stack.albDnsName;
export const rdsClusterEndpoint = stack.rdsClusterEndpoint;
export const dmsTaskArn = stack.dmsTaskArn;
export const vpcId = stack.vpcId;

// Pascal case (for integration test compatibility)
export const VPCId = stack.vpcId;
export const LoadBalancerDNS = stack.albDnsName;
export const LoadBalancerName = stack.albName;
export const RDSClusterEndpoint = stack.rdsClusterEndpoint;
export const RDSClusterReaderEndpoint = stack.rdsClusterEndpoint.apply(
  (endpoint: string) => endpoint.replace('.cluster-', '.cluster-ro-')
);
export const RDSClusterIdentifier = stack.clusterId;
export const DMSReplicationTaskArn = stack.dmsTaskArn;
export const ALBSecurityGroupId = stack.albSecurityGroupId;

// Re-export all stack components for convenience
export { DatabaseStack } from './database';
export { DmsStack } from './dms';
export { EcsStack } from './ecs';
export { IamRolesStack } from './iam';
export { LambdaStack } from './lambda-stack';
export { LoadBalancerStack } from './load-balancer';
export { MonitoringStack } from './monitoring';
export { NetworkingStack } from './networking';
export { TapStack } from './tap-stack';
