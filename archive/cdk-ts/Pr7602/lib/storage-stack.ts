import * as cdk from 'aws-cdk-lib';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface StorageStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  securityGroup: ec2.SecurityGroup;
}

export class StorageStack extends Construct {
  public readonly fileSystem: efs.FileSystem;
  public readonly accessPoint: efs.AccessPoint;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id);

    // Create EFS file system
    this.fileSystem = new efs.FileSystem(this, 'HealthcareEfs', {
      vpc: props.vpc,
      fileSystemName: `healthcare-efs-${props.environmentSuffix}`,
      encrypted: true,
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_7_DAYS,
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      throughputMode: efs.ThroughputMode.BURSTING,
      securityGroup: props.securityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Destroyable for test
    });

    // Create access point for ECS tasks
    this.accessPoint = new efs.AccessPoint(this, 'EcsAccessPoint', {
      fileSystem: this.fileSystem,
      path: '/ecs-data',
      posixUser: {
        uid: '1000',
        gid: '1000',
      },
      createAcl: {
        ownerUid: '1000',
        ownerGid: '1000',
        permissions: '755',
      },
    });

    // Outputs
    new cdk.CfnOutput(this, 'FileSystemId', {
      value: this.fileSystem.fileSystemId,
      exportName: `healthcare-efs-id-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AccessPointId', {
      value: this.accessPoint.accessPointId,
      exportName: `healthcare-efs-ap-${props.environmentSuffix}`,
    });
  }
}
