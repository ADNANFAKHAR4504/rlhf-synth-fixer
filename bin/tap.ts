/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This entry point creates a production-ready EKS cluster for microservices workloads.
 */
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Get the environment suffix from environment variables, defaulting to 'dev'.
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get metadata from environment variables for tagging purposes.
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'platform';
const createdAt = new Date().toISOString();

// Define default tags to apply to all resources
const defaultTags = {
  Environment: 'production',
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CostCenter: 'engineering',
  CreatedAt: createdAt,
  ManagedBy: 'Pulumi',
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
  'eks-microservices-platform',
  {
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);

// Export important outputs
export const vpcId = stack.vpcId;
export const clusterName = stack.clusterName;
export const clusterEndpoint = stack.clusterEndpoint;
export const clusterOidcProviderUrl = stack.clusterOidcProviderUrl;
export const clusterOidcProviderArn = stack.clusterOidcProviderArn;
export const kubeconfigJson = stack.kubeconfig;
export const generalNodeGroupName = stack.generalNodeGroupName;
export const computeNodeGroupName = stack.computeNodeGroupName;
export const clusterAutoscalerRoleArn = stack.clusterAutoscalerRoleArn;

// Export kubeconfig as a string for easy use
export const kubeconfig = stack.kubeconfig.apply(k =>
  JSON.stringify(k, null, 2)
);
