// Main Pulumi program entry point
export { getEnvironmentConfig, getEnvironmentSuffix } from './config';
export type { EnvironmentConfig } from './config';
export { TapStack } from './tap-stack';
export type { TapStackArgs } from './tap-stack';

// Export components for advanced usage
export { AlbComponent } from './components/alb-component';
export { EcsComponent } from './components/ecs-component';
export { MonitoringComponent } from './components/monitoring-component';
export { ParameterStoreComponent } from './components/parameter-store-component';
export { RdsComponent } from './components/rds-component';
export { S3Component } from './components/s3-component';
export { SecurityComponent } from './components/security-component';
export { VpcComponent } from './components/vpc-component';

// Re-export the stack outputs from tap-stack.ts (which creates the instance)
export {
  albArn,
  albDnsName,
  dashboardName,
  ecsClusterArn,
  ecsServiceArn,
  privateSubnetIds,
  publicSubnetIds,
  rdsClusterEndpoint,
  rdsClusterReaderEndpoint,
  s3BucketName,
  snsTopicArn,
  vpcId,
} from './tap-stack';
