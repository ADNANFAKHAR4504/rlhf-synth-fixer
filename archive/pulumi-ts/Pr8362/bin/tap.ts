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
const environmentSuffix = config.get('env') || 'dev';

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
  Project: 'IaC-AWS-Model-Breaking',
};

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
// Region configuration is handled entirely by TapStack
const stack = new TapStack('pulumi-infra', {
  environmentSuffix: environmentSuffix,
  // regions: removed - let TapStack handle region configuration
  tags: defaultTags,
});

// STACK-LEVEL EXPORTS
export const stackEnvironment = stack.environmentSuffix;
export const stackRegions = stack.regions;

// IDENTITY INFRASTRUCTURE EXPORTS
export const identityEc2RoleArn = stack.identity.ec2RoleArn;
export const identityEc2InstanceProfileArn =
  stack.identity.ec2InstanceProfileArn;
export const identityRdsRoleArn = stack.identity.rdsRoleArn;
export const identityAlbRoleArn = stack.identity.albRoleArn;

// REGIONAL EXPORTS - PRIMARY REGION
const primaryRegion = stack.regions[0];

// Security Infrastructure - Primary Region
export const primaryRegionApplicationKmsKeyArn =
  stack.regionalSecurity[primaryRegion]?.applicationKms.keyArn;
export const primaryRegionApplicationKmsKeyId =
  stack.regionalSecurity[primaryRegion]?.applicationKms.keyId;
export const primaryRegionDatabaseKmsKeyArn =
  stack.regionalSecurity[primaryRegion]?.databaseKms.keyArn;
export const primaryRegionDatabaseKmsKeyId =
  stack.regionalSecurity[primaryRegion]?.databaseKms.keyId;
export const primaryRegionS3KmsKeyArn =
  stack.regionalSecurity[primaryRegion]?.s3Kms.keyArn;
export const primaryRegionS3KmsKeyId =
  stack.regionalSecurity[primaryRegion]?.s3Kms.keyId;

// Networking Infrastructure - Primary Region
export const primaryRegionVpcId =
  stack.regionalNetworks[primaryRegion]?.vpc.vpcId;
export const primaryRegionVpcCidr =
  stack.regionalNetworks[primaryRegion]?.vpc.cidrBlock;
// FIXED: Remove the .subnets reference since subnet IDs are now directly on regionalNetworks
export const primaryRegionPublicSubnetIds =
  stack.regionalNetworks[primaryRegion]?.publicSubnetIds;
export const primaryRegionPrivateSubnetIds =
  stack.regionalNetworks[primaryRegion]?.privateSubnetIds;
export const primaryRegionInternetGatewayId =
  stack.regionalNetworks[primaryRegion]?.igw.internetGatewayId;
export const primaryRegionNatGatewayIds =
  stack.regionalNetworks[primaryRegion]?.natGateways.natGatewayIds;
export const primaryRegionAlbSecurityGroupId =
  stack.regionalNetworks[primaryRegion]?.albSg.securityGroupId;
export const primaryRegionApplicationSecurityGroupId =
  stack.regionalNetworks[primaryRegion]?.appSg.securityGroupId;
export const primaryRegionDatabaseSecurityGroupId =
  stack.regionalNetworks[primaryRegion]?.dbSg.securityGroupId;

// Secrets Infrastructure - Primary Region
export const primaryRegionDatabaseCredentialsArn =
  stack.regionalSecrets[primaryRegion]?.dbCredentials.secretArn;
export const primaryRegionDatabaseCredentialsName =
  stack.regionalSecrets[primaryRegion]?.dbCredentials.secretName;

// Storage Infrastructure - Primary Region
export const primaryRegionConfigBucketId =
  stack.regionalStorage[primaryRegion]?.configBucket.bucketId;
export const primaryRegionConfigBucketArn =
  stack.regionalStorage[primaryRegion]?.configBucket.bucketArn;
export const primaryRegionDataBucketId =
  stack.regionalStorage[primaryRegion]?.dataBucket.bucketId;
export const primaryRegionDataBucketArn =
  stack.regionalStorage[primaryRegion]?.dataBucket.bucketArn;
export const primaryRegionDatabaseEndpoint =
  stack.regionalStorage[primaryRegion]?.database.endpoint;
export const primaryRegionDatabasePort =
  stack.regionalStorage[primaryRegion]?.database.port;
export const primaryRegionDatabaseInstanceId =
  stack.regionalStorage[primaryRegion]?.database.instanceId;

// Compute Infrastructure - Primary Region
export const primaryRegionAlbDnsName =
  stack.regionalCompute[primaryRegion]?.alb.dnsName;
export const primaryRegionAlbZoneId =
  stack.regionalCompute[primaryRegion]?.alb.zoneId;
export const primaryRegionAlbArn =
  stack.regionalCompute[primaryRegion]?.alb.loadBalancerArn;
export const primaryRegionTargetGroupArn =
  stack.regionalCompute[primaryRegion]?.targetGroup.targetGroupArn;
export const primaryRegionLaunchTemplateId =
  stack.regionalCompute[primaryRegion]?.launchTemplate.launchTemplateId;
export const primaryRegionAutoScalingGroupName =
  stack.regionalCompute[primaryRegion]?.asg.autoScalingGroupName;

// Monitoring Infrastructure - Primary Region
export const primaryRegionSystemLogsArn =
  stack.regionalMonitoring[primaryRegion]?.logGroups.systemLogs.logGroupArn;
export const primaryRegionSecurityLogsArn =
  stack.regionalMonitoring[primaryRegion]?.logGroups.securityLogs.logGroupArn;
export const primaryRegionApplicationLogsArn =
  stack.regionalMonitoring[primaryRegion]?.logGroups.applicationLogs
    .logGroupArn;
export const primaryRegionAccessLogsArn =
  stack.regionalMonitoring[primaryRegion]?.logGroups.accessLogs.logGroupArn;
export const primaryRegionConfigRecorderName =
  stack.regionalMonitoring[primaryRegion]?.awsConfig.configurationRecorder.name;

// REGIONAL EXPORTS - SECONDARY REGION
const secondaryRegion = stack.regions[1];

// Security Infrastructure - Secondary Region
export const secondaryRegionApplicationKmsKeyArn =
  stack.regionalSecurity[secondaryRegion]?.applicationKms.keyArn;
export const secondaryRegionApplicationKmsKeyId =
  stack.regionalSecurity[secondaryRegion]?.applicationKms.keyId;
export const secondaryRegionDatabaseKmsKeyArn =
  stack.regionalSecurity[secondaryRegion]?.databaseKms.keyArn;
export const secondaryRegionDatabaseKmsKeyId =
  stack.regionalSecurity[secondaryRegion]?.databaseKms.keyId;
export const secondaryRegionS3KmsKeyArn =
  stack.regionalSecurity[secondaryRegion]?.s3Kms.keyArn;
export const secondaryRegionS3KmsKeyId =
  stack.regionalSecurity[secondaryRegion]?.s3Kms.keyId;

// Networking Infrastructure - Secondary Region
export const secondaryRegionVpcId =
  stack.regionalNetworks[secondaryRegion]?.vpc.vpcId;
export const secondaryRegionVpcCidr =
  stack.regionalNetworks[secondaryRegion]?.vpc.cidrBlock;
// FIXED: Remove the .subnets reference since subnet IDs are now directly on regionalNetworks
export const secondaryRegionPublicSubnetIds =
  stack.regionalNetworks[secondaryRegion]?.publicSubnetIds;
export const secondaryRegionPrivateSubnetIds =
  stack.regionalNetworks[secondaryRegion]?.privateSubnetIds;
export const secondaryRegionInternetGatewayId =
  stack.regionalNetworks[secondaryRegion]?.igw.internetGatewayId;
export const secondaryRegionNatGatewayIds =
  stack.regionalNetworks[secondaryRegion]?.natGateways.natGatewayIds;
export const secondaryRegionAlbSecurityGroupId =
  stack.regionalNetworks[secondaryRegion]?.albSg.securityGroupId;
export const secondaryRegionApplicationSecurityGroupId =
  stack.regionalNetworks[secondaryRegion]?.appSg.securityGroupId;
export const secondaryRegionDatabaseSecurityGroupId =
  stack.regionalNetworks[secondaryRegion]?.dbSg.securityGroupId;

// Certificates Infrastructure - Secondary Region

// Secrets Infrastructure - Secondary Region
export const secondaryRegionDatabaseCredentialsArn =
  stack.regionalSecrets[secondaryRegion]?.dbCredentials.secretArn;
export const secondaryRegionDatabaseCredentialsName =
  stack.regionalSecrets[secondaryRegion]?.dbCredentials.secretName;

// Storage Infrastructure - Secondary Region
export const secondaryRegionConfigBucketId =
  stack.regionalStorage[secondaryRegion]?.configBucket.bucketId;
export const secondaryRegionConfigBucketArn =
  stack.regionalStorage[secondaryRegion]?.configBucket.bucketArn;
export const secondaryRegionDataBucketId =
  stack.regionalStorage[secondaryRegion]?.dataBucket.bucketId;
export const secondaryRegionDataBucketArn =
  stack.regionalStorage[secondaryRegion]?.dataBucket.bucketArn;
export const secondaryRegionDatabaseEndpoint =
  stack.regionalStorage[secondaryRegion]?.database.endpoint;
export const secondaryRegionDatabasePort =
  stack.regionalStorage[secondaryRegion]?.database.port;
export const secondaryRegionDatabaseInstanceId =
  stack.regionalStorage[secondaryRegion]?.database.instanceId;

// Compute Infrastructure - Secondary Region
export const secondaryRegionAlbDnsName =
  stack.regionalCompute[secondaryRegion]?.alb.dnsName;
export const secondaryRegionAlbZoneId =
  stack.regionalCompute[secondaryRegion]?.alb.zoneId;
export const secondaryRegionAlbArn =
  stack.regionalCompute[secondaryRegion]?.alb.loadBalancerArn;
export const secondaryRegionTargetGroupArn =
  stack.regionalCompute[secondaryRegion]?.targetGroup.targetGroupArn;
export const secondaryRegionLaunchTemplateId =
  stack.regionalCompute[secondaryRegion]?.launchTemplate.launchTemplateId;
export const secondaryRegionAutoScalingGroupName =
  stack.regionalCompute[secondaryRegion]?.asg.autoScalingGroupName;

// Monitoring Infrastructure - Secondary Region
export const secondaryRegionSystemLogsArn =
  stack.regionalMonitoring[secondaryRegion]?.logGroups.systemLogs.logGroupArn;
export const secondaryRegionSecurityLogsArn =
  stack.regionalMonitoring[secondaryRegion]?.logGroups.securityLogs.logGroupArn;
export const secondaryRegionApplicationLogsArn =
  stack.regionalMonitoring[secondaryRegion]?.logGroups.applicationLogs
    .logGroupArn;
export const secondaryRegionAccessLogsArn =
  stack.regionalMonitoring[secondaryRegion]?.logGroups.accessLogs.logGroupArn;
export const secondaryRegionConfigRecorderName =
  stack.regionalMonitoring[secondaryRegion]?.awsConfig.configurationRecorder
    .name;

// AGGREGATED EXPORTS - ALL REGIONS
export const allVpcIds = pulumi
  .output(
    stack.regions.map(region => stack.regionalNetworks[region]?.vpc.vpcId)
  )
  .apply(ids => ids.filter(id => id !== undefined));

export const allAlbDnsNames = pulumi
  .output(
    stack.regions.map(region => stack.regionalCompute[region]?.alb.dnsName)
  )
  .apply(names => names.filter(name => name !== undefined));

export const allDatabaseEndpoints = pulumi
  .output(
    stack.regions.map(
      region => stack.regionalStorage[region]?.database.endpoint
    )
  )
  .apply(endpoints => endpoints.filter(endpoint => endpoint !== undefined));

export const allS3BucketArns = pulumi
  .output(
    stack.regions.flatMap(region => [
      stack.regionalStorage[region]?.configBucket.bucketArn,
      stack.regionalStorage[region]?.dataBucket.bucketArn,
    ])
  )
  .apply(arns => arns.filter(arn => arn !== undefined));

export const allKmsKeyArns = pulumi
  .output(
    stack.regions.flatMap(region => [
      stack.regionalSecurity[region]?.applicationKms.keyArn,
      stack.regionalSecurity[region]?.databaseKms.keyArn,
      stack.regionalSecurity[region]?.s3Kms.keyArn,
    ])
  )
  .apply(arns => arns.filter(arn => arn !== undefined));

// ============================================================================
// SUMMARY EXPORTS
// ============================================================================

export const infrastructureSummary = pulumi.output({
  environment: environmentSuffix,
  regions: stack.regions,
  totalRegions: stack.regions.length,
  primaryRegion: primaryRegion,
  secondaryRegion: secondaryRegion,
});

// FIXED: Changed from https to http since we're using HTTP-only ALB now
export const primaryApplicationUrl = pulumi.interpolate`http://${primaryRegionAlbDnsName}`;
export const secondaryApplicationUrl = pulumi.interpolate`http://${secondaryRegionAlbDnsName}`;

export const primaryDatabaseConnectionString = pulumi.interpolate`mysql://admin@${primaryRegionDatabaseEndpoint}:${primaryRegionDatabasePort}/appdb`;
export const secondaryDatabaseConnectionString = pulumi.interpolate`mysql://admin@${secondaryRegionDatabaseEndpoint}:${secondaryRegionDatabasePort}/appdb`;
