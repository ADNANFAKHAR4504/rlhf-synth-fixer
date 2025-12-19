/**
 * Pulumi application entry point for VPC Peering Infrastructure
 *
 * This module instantiates the TapStack with configuration for VPC peering
 * between payment and audit VPCs with comprehensive security controls
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';
import { VpcHelper } from '../lib/vpc-helper';

// Get configuration from Pulumi config
const config = new pulumi.Config();
const awsConfig = new pulumi.Config('aws');

// Get environment suffix from environment variables
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get metadata from environment variables for tagging
const repository = process.env.REPOSITORY || 'vpc-peering-infrastructure';
const commitAuthor = process.env.COMMIT_AUTHOR || 'pulumi-automation';
const prNumber = process.env.PR_NUMBER || 'N/A';
const team = process.env.TEAM || 'synth-2';
const createdAt = new Date().toISOString();

// Get environment name
const environment = config.get('environment') || 'dev';

// Define default tags
const defaultTags = {
  Environment: environment,
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
  ManagedBy: 'Pulumi',
  Project: 'VPC-Peering',
};

// Configure AWS provider with default tags
const provider = new aws.Provider('aws', {
  region: awsConfig.get('region') || process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

// Create helper VPCs for QA testing (in production, these would already exist)
const vpcHelper = new VpcHelper(
  'vpc-helper',
  {
    environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);

// Get VPC configuration from helper or config
const dataClassification = config.get('dataClassification') || 'Sensitive';
const flowLogsRetentionDays = config.getNumber('flowLogsRetentionDays') || 90;

// Instantiate the main TapStack with VPC helper dependencies
// We use pulumi.all() to handle Output types properly
const stack = pulumi
  .all([
    vpcHelper.paymentVpcId,
    vpcHelper.auditVpcId,
    vpcHelper.paymentAccountId,
    vpcHelper.auditAccountId,
  ])
  .apply(([paymentVpcId, auditVpcId, paymentAccountId, auditAccountId]) => {
    return new TapStack(
      'vpc-peering-infra',
      {
        environmentSuffix,
        paymentVpcId,
        auditVpcId,
        paymentVpcCidr: vpcHelper.paymentVpcCidr,
        auditVpcCidr: vpcHelper.auditVpcCidr,
        paymentAccountId,
        auditAccountId,
        environment,
        dataClassification,
        flowLogsRetentionDays,
        tags: defaultTags,
      },
      { provider, dependsOn: [vpcHelper] }
    );
  });

// Export outputs for verification and downstream use
export const peeringConnectionId = stack.apply(s => s.peeringConnectionId);
export const paymentRouteTableIds = stack.apply(s => s.paymentRouteTableIds);
export const auditRouteTableIds = stack.apply(s => s.auditRouteTableIds);
export const flowLogsBucketName = stack.apply(s => s.flowLogsBucketName);
export const peeringStatusAlarmArn = stack.apply(s => s.peeringStatusAlarmArn);
export const securityGroupIds = stack.apply(s => s.securityGroupIds);
export const paymentVpcId = vpcHelper.paymentVpcId;
export const auditVpcId = vpcHelper.auditVpcId;
