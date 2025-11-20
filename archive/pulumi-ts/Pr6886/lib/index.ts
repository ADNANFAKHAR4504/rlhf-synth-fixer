import * as pulumi from '@pulumi/pulumi';
import { AuroraCluster } from './infrastructure/aurora-cluster';
import { BaseInfrastructure } from './infrastructure/base-infrastructure';
import { CrossStackReferences } from './infrastructure/cross-stack-references';
import { EcsService } from './infrastructure/ecs-service';
import { ParameterStoreHierarchy } from './infrastructure/parameter-store';
import { CloudWatchDashboard } from './monitoring/cloudwatch-dashboard';
import { DriftDetection } from './monitoring/drift-detection';

// Get configuration - try Pulumi config first, then fall back to environment variables
const config = new pulumi.Config();
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';
const environment =
  config.get('environment') || process.env.DEPLOY_ENV || 'dev'; // dev, staging, prod

// Environment-specific configurations
interface EnvironmentConfig {
  instanceType: string;
  auroraInstanceCount: number;
  backupRetentionDays: number;
  containerImageTag: string;
  vpcCidr: string;
}

const environmentConfigs: Record<string, EnvironmentConfig> = {
  dev: {
    instanceType: 't3.medium',
    auroraInstanceCount: 1,
    backupRetentionDays: 1,
    containerImageTag: 'latest',
    vpcCidr: '10.0.0.0/16',
  },
  staging: {
    instanceType: 'm5.large',
    auroraInstanceCount: 2,
    backupRetentionDays: 7,
    containerImageTag: 'staging-*',
    vpcCidr: '10.1.0.0/16',
  },
  prod: {
    instanceType: 'm5.xlarge',
    auroraInstanceCount: 3,
    backupRetentionDays: 30,
    containerImageTag: 'v*.*.*',
    vpcCidr: '10.2.0.0/16',
  },
};

const envConfig = environmentConfigs[environment];

// Create base infrastructure
const baseInfra = new BaseInfrastructure(`base-infra-${environmentSuffix}`, {
  environmentSuffix,
  environment,
  vpcCidr: envConfig.vpcCidr,
  availabilityZones: ['a', 'b', 'c'],
});

// Create Parameter Store hierarchy
new ParameterStoreHierarchy(`param-store-${environmentSuffix}`, {
  environmentSuffix,
  environment,
  vpcId: baseInfra.vpc.id,
  securityGroupIds: [baseInfra.securityGroup.id],
});

// Create Aurora cluster
const aurora = new AuroraCluster(`aurora-${environmentSuffix}`, {
  environmentSuffix,
  environment,
  vpcId: baseInfra.vpc.id,
  subnetIds: baseInfra.privateSubnetIds,
  securityGroupIds: [baseInfra.databaseSecurityGroup.id],
  instanceCount: envConfig.auroraInstanceCount,
  backupRetentionDays: envConfig.backupRetentionDays,
  instanceClass: envConfig.instanceType,
});

// Create ECS service
const ecsService = new EcsService(`ecs-service-${environmentSuffix}`, {
  environmentSuffix,
  environment,
  cluster: baseInfra.ecsCluster,
  vpcId: baseInfra.vpc.id,
  subnetIds: baseInfra.privateSubnetIds,
  albSubnetIds: baseInfra.publicSubnetIds,
  securityGroupId: baseInfra.securityGroup.id,
  imageTag: envConfig.containerImageTag,
  databaseEndpoint: aurora.endpoint,
  databaseSecretArn: aurora.secretArn,
});

// Set up cross-stack references
new CrossStackReferences(`cross-stack-${environmentSuffix}`, {
  environmentSuffix,
  environment,
  vpcId: baseInfra.vpc.id,
  ecsClusterArn: baseInfra.ecsCluster.arn,
  albArn: ecsService.albArn,
  auroraEndpoint: aurora.endpoint,
});

// Create CloudWatch dashboard
const dashboard = new CloudWatchDashboard(`dashboard-${environmentSuffix}`, {
  environmentSuffix,
  environment,
  ecsClusterName: baseInfra.ecsCluster.name,
  ecsServiceName: ecsService.serviceName,
  albArn: ecsService.albArn,
  auroraClusterId: aurora.clusterId,
});

// Set up drift detection
const driftDetection = new DriftDetection(`drift-${environmentSuffix}`, {
  environmentSuffix,
  environment,
  vpcId: baseInfra.vpc.id,
  ecsClusterArn: baseInfra.ecsCluster.arn,
  auroraClusterArn: aurora.clusterArn,
});

// Export outputs for stack references
export const vpcId = baseInfra.vpc.id;
export const publicSubnetIds = baseInfra.publicSubnetIds;
export const privateSubnetIds = baseInfra.privateSubnetIds;
export const ecsClusterName = baseInfra.ecsCluster.name;
export const ecsClusterArn = baseInfra.ecsCluster.arn;
export const ecsServiceName = ecsService.serviceName;
export const albDnsName = ecsService.albDnsName;
export const albArn = ecsService.albArn;
export const auroraEndpoint = aurora.endpoint;
export const auroraReaderEndpoint = aurora.readerEndpoint;
export const auroraClusterId = aurora.clusterId;
export const snsTopicArn = driftDetection.snsTopicArn;
export const dashboardName = dashboard.dashboardName;
