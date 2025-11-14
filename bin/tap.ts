/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration based on the deployment environment. It handles environment-specific settings,
 * tagging, and deployment configuration for AWS resources.
 *
 * The stack created by this module uses environment suffixes to distinguish between
 * different deployment environments (development, staging, production, etc.).
 */
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Get the environment suffix from environment variables, defaulting to 'dev'.
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Define a set of default tags to apply to all resources.
// While not explicitly used in the TapStack instantiation here,
// this is the standard place to define them. They would typically be passed
// into the TapStack or configured on the AWS provider.
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

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new TapStack(
  'pulumi-infra',
  {
    environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);

// ============================================================================
// DEPLOYMENT OUTPUTS
// ============================================================================
// These outputs provide detailed information about the deployed infrastructure
// and can be accessed via `pulumi stack output <key>` or used by other stacks
// ============================================================================

// ----------------------------------------------------------------------------
// Deployment Metadata
// ----------------------------------------------------------------------------
export const deploymentEnvironment = environmentSuffix;
export const deploymentRegion = process.env.AWS_REGION || 'us-east-1';
export const deploymentTimestamp = createdAt;
export const deploymentRepository = repository;
export const deploymentPRNumber = prNumber;
export const deploymentAuthor = commitAuthor;
export const deploymentTeam = team;

// ----------------------------------------------------------------------------
// VPC Infrastructure Outputs
// ----------------------------------------------------------------------------
export const vpcId = stack.vpcId;
export const vpcCidr = '10.0.0.0/16'; // From vpc-stack.ts configuration

// ----------------------------------------------------------------------------
// EKS Cluster Outputs
// ----------------------------------------------------------------------------
export const clusterName = stack.clusterName;
export const clusterEndpoint = stack.clusterEndpoint;
export const clusterSecurityGroup = stack.clusterSecurityGroup;
export const clusterVersion = '1.28'; // Default Kubernetes version
export const clusterOidcProviderArn = stack.oidcProviderArn;

// ----------------------------------------------------------------------------
// Cluster Access Information
// ----------------------------------------------------------------------------
// To configure kubectl access, run:
// aws eks update-kubeconfig --region <deploymentRegion> --name <clusterName>
export const kubectlConfigCommand = stack.clusterName.apply(
  name =>
    `aws eks update-kubeconfig --region ${process.env.AWS_REGION || 'us-east-1'} --name ${name}`
);

// ----------------------------------------------------------------------------
// Node Groups Information
// ----------------------------------------------------------------------------
// General purpose node group for standard workloads
export const generalNodeGroupName = `general-${environmentSuffix}`;
export const generalNodeGroupInstanceType = 't3.large';
export const generalNodeGroupMinSize = 2;
export const generalNodeGroupMaxSize = 10;
export const generalNodeGroupDesiredSize = 2;

// Compute-intensive node group for high-performance workloads
export const computeNodeGroupName = `compute-${environmentSuffix}`;
export const computeNodeGroupInstanceType = 'c5.2xlarge';
export const computeNodeGroupMinSize = 1;
export const computeNodeGroupMaxSize = 5;
export const computeNodeGroupDesiredSize = 1;

// ----------------------------------------------------------------------------
// Add-ons and Controllers
// ----------------------------------------------------------------------------
export const calicoVersion = '3.26.4';
export const awsLoadBalancerControllerVersion = '1.6.2';
export const clusterAutoscalerEnabled = true;
export const calicoNetworkingEnabled = true;
export const networkPoliciesEnabled = true;

// ----------------------------------------------------------------------------
// Security and Networking
// ----------------------------------------------------------------------------
export const clusterEndpointPublicAccess = true;
export const clusterEndpointPrivateAccess = true;
export const clusterLoggingEnabled = true;
export const clusterLogTypes = ['api', 'audit', 'authenticator'];

// ----------------------------------------------------------------------------
// Resource Tags
// ----------------------------------------------------------------------------
export const resourceTags = defaultTags;

// ----------------------------------------------------------------------------
// Deployment Summary (JSON format for automation)
// ----------------------------------------------------------------------------
export const deploymentSummary = stack.clusterName.apply(name => ({
  deployment: {
    environment: environmentSuffix,
    region: process.env.AWS_REGION || 'us-east-1',
    timestamp: createdAt,
    repository: repository,
    prNumber: prNumber,
    author: commitAuthor,
    team: team,
  },
  vpc: {
    vpcId: stack.vpcId,
    cidr: '10.0.0.0/16',
  },
  cluster: {
    name: name,
    endpoint: stack.clusterEndpoint,
    version: '1.28',
    oidcProviderArn: stack.oidcProviderArn,
    securityGroup: stack.clusterSecurityGroup,
    publicAccess: true,
    privateAccess: true,
    logging: ['api', 'audit', 'authenticator'],
  },
  nodeGroups: {
    general: {
      name: `general-${environmentSuffix}`,
      instanceType: 't3.large',
      minSize: 2,
      maxSize: 10,
      desiredSize: 2,
    },
    compute: {
      name: `compute-${environmentSuffix}`,
      instanceType: 'c5.2xlarge',
      minSize: 1,
      maxSize: 5,
      desiredSize: 1,
    },
  },
  addons: {
    calico: { version: '3.26.4', enabled: true },
    awsLoadBalancerController: { version: '1.6.2', enabled: true },
    clusterAutoscaler: { enabled: true },
    networkPolicies: { enabled: true },
  },
}));
