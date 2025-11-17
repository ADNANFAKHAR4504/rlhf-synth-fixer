import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { AlbComponent } from './components/alb-component';
import { EcsComponent } from './components/ecs-component';
import { MonitoringComponent } from './components/monitoring-component';
import { ParameterStoreComponent } from './components/parameter-store-component';
import { RdsComponent } from './components/rds-component';
import { S3Component } from './components/s3-component';
import { SecurityComponent } from './components/security-component';
import { VpcComponent } from './components/vpc-component';
import {
  EnvironmentConfig,
  getEnvironmentConfig,
  getEnvironmentSuffix,
} from './config';

export interface TapStackArgs {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly provider: aws.Provider;
  public readonly vpcComponent: VpcComponent;
  public readonly securityComponent: SecurityComponent;
  public readonly albComponent: AlbComponent;
  public readonly ecsComponent: EcsComponent;
  public readonly rdsComponent: RdsComponent;
  public readonly s3Component: S3Component;
  public readonly monitoringComponent: MonitoringComponent;
  public readonly parameterStoreComponent: ParameterStoreComponent;

  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly albDnsName: pulumi.Output<string>;
  public readonly albArn: pulumi.Output<string>;
  public readonly ecsClusterArn: pulumi.Output<string>;
  public readonly ecsServiceArn: pulumi.Output<string>;
  public readonly rdsClusterEndpoint: pulumi.Output<string>;
  public readonly rdsClusterReaderEndpoint: pulumi.Output<string>;
  public readonly s3BucketName: pulumi.Output<string>;
  public readonly dashboardName: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;

  constructor(
    name: string,
    args?: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:stack:TapStack', name, {}, opts);

    // Get environment configuration
    const envConfig: EnvironmentConfig = getEnvironmentConfig();
    const environmentSuffix = args?.environmentSuffix || getEnvironmentSuffix();
    const region = args?.awsRegion || envConfig.region;

    // Configure AWS Provider for the appropriate region
    this.provider = new aws.Provider(
      'aws-provider',
      {
        region: region,
      },
      { parent: this }
    );

    // Create VPC with subnets
    this.vpcComponent = new VpcComponent(
      'vpc',
      {
        environmentSuffix: environmentSuffix,
        vpcCidr: envConfig.vpcCidr,
        availabilityZones: envConfig.availabilityZones,
        publicSubnetCidrs: envConfig.publicSubnetCidrs,
        privateSubnetCidrs: envConfig.privateSubnetCidrs,
      },
      { provider: this.provider, parent: this }
    );

    // Create Security Groups
    this.securityComponent = new SecurityComponent(
      'security',
      {
        environmentSuffix: environmentSuffix,
        vpcId: this.vpcComponent.vpcId,
      },
      { provider: this.provider, parent: this }
    );

    // Create Application Load Balancer
    this.albComponent = new AlbComponent(
      'alb',
      {
        environmentSuffix: environmentSuffix,
        vpcId: this.vpcComponent.vpcId,
        publicSubnetIds: this.vpcComponent.publicSubnetIds,
        albSecurityGroupId: this.securityComponent.albSecurityGroup.id,
      },
      { provider: this.provider, parent: this }
    );

    // Create ECS Cluster and Service
    this.ecsComponent = new EcsComponent(
      'ecs',
      {
        environmentSuffix: environmentSuffix,
        vpcId: this.vpcComponent.vpcId,
        privateSubnetIds: this.vpcComponent.privateSubnetIds,
        ecsSecurityGroupId: this.securityComponent.ecsSecurityGroup.id,
        albTargetGroupArn: this.albComponent.targetGroup.arn,
        albListenerArn: this.albComponent.listener.arn,
        containerImageTag: envConfig.containerImageTag,
        desiredCount: envConfig.environment === 'prod' ? 3 : 2,
        awsRegion: region,
      },
      { provider: this.provider, parent: this }
    );

    // Create RDS Aurora Cluster
    this.rdsComponent = new RdsComponent(
      'rds',
      {
        environmentSuffix: environmentSuffix,
        privateSubnetIds: this.vpcComponent.privateSubnetIds,
        rdsSecurityGroupId: this.securityComponent.rdsSecurityGroup.id,
        dbInstanceCount: envConfig.dbInstanceCount,
        backupRetentionDays: envConfig.backupRetentionDays,
        instanceClass:
          envConfig.instanceType === 't3.medium'
            ? 'db.t3.medium'
            : 'db.r5.large',
      },
      { provider: this.provider, parent: this }
    );

    // Create S3 Bucket
    this.s3Component = new S3Component(
      's3',
      {
        environmentSuffix: environmentSuffix,
      },
      { provider: this.provider, parent: this }
    );

    // Create Parameter Store entries
    this.parameterStoreComponent = new ParameterStoreComponent(
      'params',
      {
        environmentSuffix: environmentSuffix,
        parameters: {
          'db-endpoint': this.rdsComponent.clusterEndpoint,
          environment: envConfig.environment,
          region: region,
          'container-image-tag': envConfig.containerImageTag,
        },
      },
      { provider: this.provider, parent: this }
    );

    // Create Monitoring Dashboard and Alarms
    this.monitoringComponent = new MonitoringComponent(
      'monitoring',
      {
        environmentSuffix: environmentSuffix,
        clusterName: this.ecsComponent.cluster.name,
        serviceName: this.ecsComponent.service.name,
        albArn: this.albComponent.alb.arn,
        targetGroupArn: this.albComponent.targetGroup.arn,
        rdsClusterIdentifier: this.rdsComponent.cluster.clusterIdentifier,
      },
      { provider: this.provider, parent: this }
    );

    // Set outputs
    this.vpcId = this.vpcComponent.vpcId;
    this.publicSubnetIds = this.vpcComponent.publicSubnetIds;
    this.privateSubnetIds = this.vpcComponent.privateSubnetIds;
    this.albDnsName = this.albComponent.alb.dnsName;
    this.albArn = this.albComponent.alb.arn;
    this.ecsClusterArn = this.ecsComponent.cluster.arn;
    this.ecsServiceArn = this.ecsComponent.service.id;
    this.rdsClusterEndpoint = this.rdsComponent.clusterEndpoint;
    this.rdsClusterReaderEndpoint = this.rdsComponent.clusterReaderEndpoint;
    this.s3BucketName = this.s3Component.bucket.id;
    this.dashboardName = this.monitoringComponent.dashboard.dashboardName;
    this.snsTopicArn = this.monitoringComponent.snsTopic.arn;

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      albDnsName: this.albDnsName,
      albArn: this.albArn,
      ecsClusterArn: this.ecsClusterArn,
      ecsServiceArn: this.ecsServiceArn,
      rdsClusterEndpoint: this.rdsClusterEndpoint,
      rdsClusterReaderEndpoint: this.rdsClusterReaderEndpoint,
      s3BucketName: this.s3BucketName,
      dashboardName: this.dashboardName,
      snsTopicArn: this.snsTopicArn,
    });
  }
}

// For backward compatibility, instantiate the stack when this file is imported directly
// (not when imported in tests)
let defaultStack: TapStack | undefined;

if (!process.env.JEST_WORKER_ID) {
  defaultStack = new TapStack('TapStack');
}

// Export outputs (will be undefined in test environment)
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
