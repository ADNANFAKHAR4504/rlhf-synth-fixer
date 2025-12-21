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
  environmentSuffix,
  tags: defaultTags,
});

// Export important resource information
export const primaryRegion = stack.secureStack.kmsStack.primaryKmsKey.arn.apply(
    () => 'ap-south-1'
  ),
  secondaryRegion = stack.secureStack.kmsStack.secondaryKmsKey.arn.apply(
    () => 'eu-west-1'
  ),
  primaryVpcId = stack.secureStack.vpcStack.primaryVpc.id,
  primaryVpcCidr = stack.secureStack.vpcStack.primaryVpc.cidrBlock,
  secondaryVpcId = stack.secureStack.vpcStack.secondaryVpc.id,
  secondaryVpcCidr = stack.secureStack.vpcStack.secondaryVpc.cidrBlock,
  primaryKmsKeyId = stack.secureStack.kmsStack.primaryKmsKey.keyId,
  primaryKmsKeyArn = stack.secureStack.kmsStack.primaryKmsKey.arn,
  secondaryKmsKeyId = stack.secureStack.kmsStack.secondaryKmsKey.keyId,
  secondaryKmsKeyArn = stack.secureStack.kmsStack.secondaryKmsKey.arn,
  primaryDbEndpoint = stack.secureStack.rdsStack.primaryRdsInstance.endpoint,
  primaryDbPort = stack.secureStack.rdsStack.primaryRdsInstance.port,
  secondaryDbEndpoint =
    stack.secureStack.rdsStack.secondaryRdsReadReplica?.endpoint,
  secondaryDbPort = stack.secureStack.rdsStack.secondaryRdsReadReplica?.port,
  loadBalancerDnsName =
    stack.secureStack.loadBalancerStack.applicationLoadBalancer.dnsName,
  loadBalancerZoneId =
    stack.secureStack.loadBalancerStack.applicationLoadBalancer.zoneId,
  autoScalingGroupName =
    stack.secureStack.autoScalingStack.autoScalingGroup.name,
  autoScalingGroupArn = stack.secureStack.autoScalingStack.autoScalingGroup.arn,
  snsTopicArn = stack.secureStack.monitoringStack.snsTopicArn,
  snsTopicName = stack.secureStack.monitoringStack.snsTopicName,
  cloudTrailArn = stack.secureStack.loggingStack.cloudTrailArn,
  cloudTrailName = stack.secureStack.loggingStack.cloudTrailName,
  logBucketName = stack.secureStack.loggingStack.logBucketName,
  flowLogsRoleName = stack.secureStack.loggingStack.flowLogsRoleName,
  flowLogsPolicyName = stack.secureStack.loggingStack.flowLogsPolicyName,
  vpcLogGroupName = stack.secureStack.loggingStack.vpcLogGroupName,
  webAclArn = stack.secureStack.wafShieldStack.webAclArn,
  webAclName = stack.secureStack.wafShieldStack.webAclName,
  webAclId = stack.secureStack.wafShieldStack.webAclId;
