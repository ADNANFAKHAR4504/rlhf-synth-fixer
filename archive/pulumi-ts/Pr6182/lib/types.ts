/**
 * Shared TypeScript interfaces and types for the multi-environment infrastructure
 */
import * as pulumi from '@pulumi/pulumi';

export interface EnvironmentConfig {
  environment: string;
  environmentSuffix: string;
  vpcCidr: string;
  availabilityZones: string[];
  ecsTaskCount: number;
  rdsInstanceClass: string;
  rdsMultiAz: boolean;
  s3LifecycleDays: number;
  enableSsl: boolean;
  enableMonitoring: boolean;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export interface VpcOutputs {
  vpcId: pulumi.Output<string>;
  publicSubnetIds: pulumi.Output<string>[];
  privateSubnetIds: pulumi.Output<string>[];
  natGatewayIds: pulumi.Output<string>[];
}

export interface EcsOutputs {
  clusterId: pulumi.Output<string>;
  serviceArn: pulumi.Output<string>;
  taskDefinitionArn: pulumi.Output<string>;
  securityGroupId: pulumi.Output<string>;
}

export interface AlbOutputs {
  albArn: pulumi.Output<string>;
  albDnsName: pulumi.Output<string>;
  albUrl: pulumi.Output<string>;
  targetGroupArn: pulumi.Output<string>;
  securityGroupId: pulumi.Output<string>;
}

export interface RdsOutputs {
  instanceId: pulumi.Output<string>;
  endpoint: pulumi.Output<string>;
  port: pulumi.Output<number>;
  securityGroupId: pulumi.Output<string>;
  secretArn: pulumi.Output<string>;
}

export interface S3Outputs {
  bucketName: pulumi.Output<string>;
  bucketArn: pulumi.Output<string>;
}
