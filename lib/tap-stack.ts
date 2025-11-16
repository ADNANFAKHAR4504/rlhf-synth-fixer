import * as aws from '@pulumi/aws';
import { getEnvironmentConfig, getEnvironmentSuffix } from './config';
import { VpcComponent } from './components/vpc-component';
import { SecurityComponent } from './components/security-component';
import { AlbComponent } from './components/alb-component';
import { EcsComponent } from './components/ecs-component';
import { RdsComponent } from './components/rds-component';
import { MonitoringComponent } from './components/monitoring-component';
import { ParameterStoreComponent } from './components/parameter-store-component';
import { S3Component } from './components/s3-component';

// Get environment configuration
const envConfig = getEnvironmentConfig();
const environmentSuffix = getEnvironmentSuffix();

// Configure AWS Provider for the appropriate region
const provider = new aws.Provider('aws-provider', {
  region: envConfig.region,
});

// Create VPC with subnets
const vpcComponent = new VpcComponent(
  'vpc',
  {
    environmentSuffix: environmentSuffix,
    vpcCidr: envConfig.vpcCidr,
    availabilityZones: envConfig.availabilityZones,
    publicSubnetCidrs: envConfig.publicSubnetCidrs,
    privateSubnetCidrs: envConfig.privateSubnetCidrs,
  },
  { provider }
);

// Create Security Groups
const securityComponent = new SecurityComponent(
  'security',
  {
    environmentSuffix: environmentSuffix,
    vpcId: vpcComponent.vpcId,
  },
  { provider }
);

// Create Application Load Balancer
const albComponent = new AlbComponent(
  'alb',
  {
    environmentSuffix: environmentSuffix,
    vpcId: vpcComponent.vpcId,
    publicSubnetIds: vpcComponent.publicSubnetIds,
    albSecurityGroupId: securityComponent.albSecurityGroup.id,
  },
  { provider }
);

// Create ECS Cluster and Service
const ecsComponent = new EcsComponent(
  'ecs',
  {
    environmentSuffix: environmentSuffix,
    vpcId: vpcComponent.vpcId,
    privateSubnetIds: vpcComponent.privateSubnetIds,
    ecsSecurityGroupId: securityComponent.ecsSecurityGroup.id,
    albTargetGroupArn: albComponent.targetGroup.arn,
    albListenerArn: albComponent.listener.arn,
    containerImageTag: envConfig.containerImageTag,
    desiredCount: envConfig.environment === 'prod' ? 3 : 2,
    awsRegion: envConfig.region,
  },
  { provider }
);

// Create RDS Aurora Cluster
const rdsComponent = new RdsComponent(
  'rds',
  {
    environmentSuffix: environmentSuffix,
    privateSubnetIds: vpcComponent.privateSubnetIds,
    rdsSecurityGroupId: securityComponent.rdsSecurityGroup.id,
    dbInstanceCount: envConfig.dbInstanceCount,
    backupRetentionDays: envConfig.backupRetentionDays,
    instanceClass:
      envConfig.instanceType === 't3.medium' ? 'db.t3.medium' : 'db.r5.large',
  },
  { provider }
);

// Create S3 Bucket
const s3Component = new S3Component(
  's3',
  {
    environmentSuffix: environmentSuffix,
  },
  { provider }
);

// Create Parameter Store entries (side effect only)
new ParameterStoreComponent(
  'params',
  {
    environmentSuffix: environmentSuffix,
    parameters: {
      'db-endpoint': rdsComponent.clusterEndpoint,
      environment: envConfig.environment,
      region: envConfig.region,
      'container-image-tag': envConfig.containerImageTag,
    },
  },
  { provider }
);

// Create Monitoring Dashboard and Alarms
const monitoringComponent = new MonitoringComponent(
  'monitoring',
  {
    environmentSuffix: environmentSuffix,
    clusterName: ecsComponent.cluster.name,
    serviceName: ecsComponent.service.name,
    albArn: albComponent.alb.arn,
    targetGroupArn: albComponent.targetGroup.arn,
    rdsClusterIdentifier: rdsComponent.cluster.clusterIdentifier,
  },
  { provider }
);

// Export outputs
export const vpcId = vpcComponent.vpcId;
export const publicSubnetIds = vpcComponent.publicSubnetIds;
export const privateSubnetIds = vpcComponent.privateSubnetIds;
export const albDnsName = albComponent.alb.dnsName;
export const albArn = albComponent.alb.arn;
export const ecsClusterArn = ecsComponent.cluster.arn;
export const ecsServiceArn = ecsComponent.service.id;
export const rdsClusterEndpoint = rdsComponent.clusterEndpoint;
export const rdsClusterReaderEndpoint = rdsComponent.clusterReaderEndpoint;
export const s3BucketName = s3Component.bucket.id;
export const dashboardName = monitoringComponent.dashboard.dashboardName;
export const snsTopicArn = monitoringComponent.snsTopic.arn;
