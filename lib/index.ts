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

// Create and export the default stack instance
import { TapStack } from './tap-stack';

// Only instantiate if not in test environment
let defaultStack: TapStack | undefined;

if (!process.env.JEST_WORKER_ID) {
  defaultStack = new TapStack('TapStack');
}

// Export stack outputs (will be undefined in test environment)
export const vpcId = defaultStack?.vpcId;
export const publicSubnetIds = defaultStack?.publicSubnetIds;
export const privateSubnetIds = defaultStack?.privateSubnetIds;
export const albDnsName = defaultStack?.albDnsName;
export const albArn = defaultStack?.albArn;
export const ecsClusterArn = defaultStack?.ecsClusterArn;
export const ecsServiceArn = defaultStack?.ecsServiceArn;
export const rdsClusterEndpoint = defaultStack?.rdsClusterEndpoint;
export const rdsClusterReaderEndpoint = defaultStack?.rdsClusterReaderEndpoint;
export const s3BucketName = defaultStack?.s3BucketName;
export const dashboardName = defaultStack?.dashboardName;
export const snsTopicArn = defaultStack?.snsTopicArn;