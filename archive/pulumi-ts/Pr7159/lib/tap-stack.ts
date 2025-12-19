import * as pulumi from '@pulumi/pulumi';
import { getConfig } from './config';
import { VpcComponent } from './components/vpc';
import { SecurityGroupsComponent } from './components/security-groups';
import { RdsComponent } from './components/rds';
import { EcsComponent } from './components/ecs';
import { AlbComponent } from './components/alb';
import { S3Component } from './components/s3';
import { CloudWatchComponent } from './components/cloudwatch';

// Get environment configuration
const config = getConfig();
const environmentSuffix = pulumi.getStack();

// VPC Component
const vpc = new VpcComponent('trading-vpc', {
  vpcCidr: config.vpcCidr,
  availabilityZones: config.availabilityZones,
  environmentSuffix: environmentSuffix,
  tags: config.tags,
});

// Security Groups
const securityGroups = new SecurityGroupsComponent('trading-security', {
  vpcId: vpc.vpcId,
  environmentSuffix: environmentSuffix,
  tags: config.tags,
});

// RDS Aurora Cluster
const rds = new RdsComponent('trading-database', {
  subnetIds: vpc.privateSubnetIds,
  securityGroupId: securityGroups.rdsSecurityGroup.id,
  instanceClass: config.rdsInstanceClass,
  engineMode: config.rdsEngineMode,
  backupRetentionDays: config.rdsBackupRetentionDays,
  environmentSuffix: environmentSuffix,
  tags: config.tags,
});

// ECS Fargate Cluster and Service
const ecs = new EcsComponent('trading-compute', {
  vpcId: vpc.vpcId,
  subnetIds: vpc.privateSubnetIds,
  securityGroupId: securityGroups.ecsSecurityGroup.id,
  taskCount: config.ecsTaskCount,
  taskCpu: config.ecsTaskCpu,
  taskMemory: config.ecsTaskMemory,
  enableAutoScaling: config.enableAutoScaling,
  environmentSuffix: environmentSuffix,
  tags: config.tags,
});

// Application Load Balancer
const alb = new AlbComponent('trading-alb', {
  vpcId: vpc.vpcId,
  subnetIds: vpc.publicSubnetIds,
  securityGroupId: securityGroups.albSecurityGroup.id,
  targetGroupArn: ecs.targetGroup.arn,
  sslCertificateArn: config.sslCertificateArn,
  environmentSuffix: environmentSuffix,
  tags: config.tags,
});

// S3 Bucket
const s3 = new S3Component('trading-storage', {
  lifecycleRules: config.s3LifecycleRules,
  enableVersioning: config.environment === 'prod',
  environmentSuffix: environmentSuffix,
  tags: config.tags,
});

// CloudWatch Dashboard
const cloudwatch = new CloudWatchComponent('trading-monitoring', {
  ecsClusterName: ecs.cluster.name,
  ecsServiceName: ecs.service.name,
  rdsClusterId: rds.cluster.id,
  albArn: alb.alb.arn,
  environmentSuffix: environmentSuffix,
  tags: config.tags,
});

// Export infrastructure outputs
export const infraOutputs = {
  vpcId: vpc.vpcId,
  albDnsName: alb.dnsName,
  rdsEndpoint: rds.endpoint,
  ecsClusterId: ecs.cluster.id,
  s3BucketName: s3.bucketName,
  dashboardName: cloudwatch.dashboard.dashboardName,
  environment: config.environment,
  region: config.region,
  ecsTaskCount: config.ecsTaskCount,
  rdsInstanceClass: config.rdsInstanceClass,
};

// Export key values for cross-stack references
export const vpcId = vpc.vpcId;
export const publicSubnetIds = vpc.publicSubnetIds;
export const privateSubnetIds = vpc.privateSubnetIds;
export const albSecurityGroupId = securityGroups.albSecurityGroup.id;
export const ecsSecurityGroupId = securityGroups.ecsSecurityGroup.id;
export const rdsSecurityGroupId = securityGroups.rdsSecurityGroup.id;
