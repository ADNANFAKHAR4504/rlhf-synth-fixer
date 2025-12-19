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
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Initialize Pulumi configuration for the current stack.
const config = new pulumi.Config();

// Get the environment suffix from the Pulumi config, defaulting to 'dev'.
// You can set this value using the command: `pulumi config set env <value>`
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

// Define a set of default tags to apply to all resources.
// While not explicitly used in the TapStack instantiation here,
// this is the standard place to define them. They would typically be passed
// into the TapStack or configured on the AWS provider.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new TapStack('pulumi-infra', {
  tags: defaultTags,
  environmentSuffix: environmentSuffix,
});

// Export stack outputs for use by other stacks or external systems
// VPC and Networking outputs
export const vpcId = stack.infrastructure.vpc.id;
export const VPCId = stack.infrastructure.vpc.id;
export const publicSubnetIds = stack.infrastructure.publicSubnets.map(
  subnet => subnet.id
);
export const privateSubnetIds = stack.infrastructure.privateSubnets.map(
  subnet => subnet.id
);
export const internetGatewayId = stack.infrastructure.internetGateway.id;
export const natGatewayIds = stack.infrastructure.natGateways.map(
  nat => nat.id
);

// Load Balancer outputs
export const loadBalancerArn = stack.infrastructure.loadBalancer.arn;
export const loadBalancerDnsName = stack.infrastructure.loadBalancer.dnsName;
export const albDnsName = stack.infrastructure.loadBalancer.dnsName;
export const LoadBalancerDNS = stack.infrastructure.loadBalancer.dnsName;

// Auto Scaling Group outputs
export const autoScalingGroupId = stack.infrastructure.autoScalingGroup.id;
export const asgId = stack.infrastructure.autoScalingGroup.id;
export const AutoScalingGroupId = stack.infrastructure.autoScalingGroup.id;

// S3 Bucket outputs
export const s3BucketName = stack.infrastructure.s3Bucket.id;
export const S3BucketName = stack.infrastructure.s3Bucket.id;
export const s3BucketArn = stack.infrastructure.s3Bucket.arn;

// CloudFront Distribution outputs
export const cloudFrontDistributionId =
  stack.infrastructure.cloudFrontDistribution.id;
export const cloudfrontDistributionId =
  stack.infrastructure.cloudFrontDistribution.id;
export const CloudFrontDistributionId =
  stack.infrastructure.cloudFrontDistribution.id;
export const cloudFrontDistributionDomainName =
  stack.infrastructure.cloudFrontDistribution.domainName;
export const cloudfrontDomainName =
  stack.infrastructure.cloudFrontDistribution.domainName;
export const CloudFrontDomainName =
  stack.infrastructure.cloudFrontDistribution.domainName;

export const albSecurityGroupId = stack.infrastructure.albSecurityGroup.id;
export const ec2SecurityGroupId = stack.infrastructure.ec2SecurityGroup.id;

export const cloudTrailBucketName = stack.infrastructure.cloudTrailBucket.id;

export const rdsInstanceId = stack.infrastructure.rdsInstance.id;
export const flowLogGroupName = stack.infrastructure.flowLogGroup.name;
export const flowLogGroupArn = stack.infrastructure.flowLogGroup.arn;
