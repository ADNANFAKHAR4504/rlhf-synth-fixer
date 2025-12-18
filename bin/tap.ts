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

// Get regions from config, defaulting to us-east-1 and us-west-1
const regions = config.getObject<string[]>('regions') || [
  'us-east-1',
  'us-west-1',
];

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

// Define a set of default tags to apply to all resources.
const defaultTags = {
  Project: 'IaC-AWS-Nova-Model-Breaking',
  Environment: environmentSuffix,
  Application: 'nova-web-app',
  ManagedBy: 'Pulumi',
  Classification: 'CUI',
  Compliance: 'FedRAMP-High',
  Repository: repository,
  Author: commitAuthor,
  CreatedDate: '2025-08-18',
};

// Define the interface for region data structure
interface RegionData {
  vpcId: pulumi.Output<string>;
  vpcCidr: pulumi.Output<string>;
  ebEnvironmentUrl: pulumi.Output<string>;
  ebEnvironmentName: pulumi.Output<string>;
  dashboardName: pulumi.Output<string>;
  snsTopicArn: pulumi.Output<string>;
}

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new TapStack('pulumi-infra', {
  environmentSuffix: environmentSuffix,
  regions: regions,
  tags: defaultTags,
});

// Export stack outputs for external consumption
// Multi-region summary
export const deployedRegions = stack.regions;
export const totalRegions = stack.regions.length;
export const environment = stack.environmentSuffix;
export const complianceTags = stack.tags;

// Primary region outputs (first region in array)
const primaryRegionName = stack.regions[0];
export const primaryRegion = primaryRegionName;
export const primaryVpcId = stack.regionalNetworks[primaryRegionName].vpcId;
export const primaryVpcCidr =
  stack.regionalNetworks[primaryRegionName].vpc.cidrBlock;
export const primaryPublicSubnetIds =
  stack.regionalNetworks[primaryRegionName].publicSubnetIds;
export const primaryPrivateSubnetIds =
  stack.regionalNetworks[primaryRegionName].privateSubnetIds;
// Elastic Beanstalk outputs (undefined when running on LocalStack)
export const primaryEbApplicationName =
  stack.regionalElasticBeanstalk[primaryRegionName]?.applicationName;
export const primaryEbEnvironmentName =
  stack.regionalElasticBeanstalk[primaryRegionName]?.environmentName;
export const primaryEbEnvironmentUrl =
  stack.regionalElasticBeanstalk[primaryRegionName]?.environmentUrl;
export const primaryEbEnvironmentCname =
  stack.regionalElasticBeanstalk[primaryRegionName]?.environmentCname;
export const primaryDashboardName =
  stack.regionalMonitoring[primaryRegionName].dashboardName;
export const primarySnsTopicArn =
  stack.regionalMonitoring[primaryRegionName].snsTopicArn;

// Secondary region outputs if deployed
export const secondaryRegion =
  stack.regions.length > 1 ? stack.regions[1] : undefined;
export const secondaryVpcId =
  stack.regions.length > 1
    ? stack.regionalNetworks[stack.regions[1]].vpcId
    : undefined;
export const secondaryVpcCidr =
  stack.regions.length > 1
    ? stack.regionalNetworks[stack.regions[1]].vpc.cidrBlock
    : undefined;
export const secondaryPublicSubnetIds =
  stack.regions.length > 1
    ? stack.regionalNetworks[stack.regions[1]].publicSubnetIds
    : undefined;
export const secondaryPrivateSubnetIds =
  stack.regions.length > 1
    ? stack.regionalNetworks[stack.regions[1]].privateSubnetIds
    : undefined;
// Elastic Beanstalk outputs (undefined when running on LocalStack)
export const secondaryEbApplicationName =
  stack.regions.length > 1
    ? stack.regionalElasticBeanstalk[stack.regions[1]]?.applicationName
    : undefined;
export const secondaryEbEnvironmentName =
  stack.regions.length > 1
    ? stack.regionalElasticBeanstalk[stack.regions[1]]?.environmentName
    : undefined;
export const secondaryEbEnvironmentUrl =
  stack.regions.length > 1
    ? stack.regionalElasticBeanstalk[stack.regions[1]]?.environmentUrl
    : undefined;
export const secondaryEbEnvironmentCname =
  stack.regions.length > 1
    ? stack.regionalElasticBeanstalk[stack.regions[1]]?.environmentCname
    : undefined;
export const secondaryDashboardName =
  stack.regions.length > 1
    ? stack.regionalMonitoring[stack.regions[1]].dashboardName
    : undefined;
export const secondarySnsTopicArn =
  stack.regions.length > 1
    ? stack.regionalMonitoring[stack.regions[1]].snsTopicArn
    : undefined;

// All regions data for reference (Elastic Beanstalk fields are undefined on LocalStack)
export const allRegionsData = pulumi.output(
  (() => {
    const data: Record<string, RegionData> = {};
    for (const region of stack.regions) {
      const ebInfra = stack.regionalElasticBeanstalk[region];
      data[region] = {
        vpcId: stack.regionalNetworks[region].vpcId,
        vpcCidr: stack.regionalNetworks[region].vpc.cidrBlock,
        ebEnvironmentUrl: ebInfra?.environmentUrl ?? pulumi.output('N/A'),
        ebEnvironmentName: ebInfra?.environmentName ?? pulumi.output('N/A'),
        dashboardName: stack.regionalMonitoring[region].dashboardName,
        snsTopicArn: stack.regionalMonitoring[region].snsTopicArn,
      };
    }
    return data;
  })()
);

// Security and Identity outputs (global resources)
export const ebServiceRoleArn = stack.identity.ebServiceRoleArn;
export const ebInstanceRoleArn = stack.identity.ebInstanceRoleArn;
export const ebInstanceProfileName = stack.identity.ebInstanceProfileName;
export const autoscalingRoleArn = stack.identity.autoscalingRoleArn;

// Auto-scaling configuration
export const autoscalingConfig = {
  minSize: 2,
  maxSize: 10,
  cpuScaleUpThreshold: 70,
  cpuScaleDownThreshold: 20,
  instanceType: 't3.medium',
};

// Infrastructure summary for operational dashboards
export const infrastructureSummary = pulumi
  .all([primaryEbEnvironmentUrl, secondaryEbEnvironmentUrl])
  .apply(([primaryUrl, secondaryUrl]) => ({
    deployment: {
      environment: environmentSuffix,
      regions: stack.regions,
      totalRegions: stack.regions.length,
      deploymentDate: '2025-08-18',
      managedBy: 'Pulumi',
    },
    endpoints: {
      primary: primaryUrl,
      secondary: secondaryUrl || 'Not deployed',
    },
    compliance: {
      classification: 'CUI',
      framework: 'FedRAMP-High',
    },
  }));
