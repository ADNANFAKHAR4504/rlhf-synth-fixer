import * as cdk from 'aws-cdk-lib';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class StorageStack extends Construct {
  constructor(scope, id, props) {
    super(scope, id);

    const environmentSuffix = props.environmentSuffix;
    const vpc = props.vpc;
    const securityGroup = props.securityGroup;
    const encryptionKey = props.encryptionKey;

    // EFS filesystem for persistent shared storage
    this.fileSystem = new efs.FileSystem(this, 'SharedFileSystem', {
      fileSystemName: `healthtech-efs-${environmentSuffix}`,
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroup: securityGroup,
      encrypted: true,
      kmsKey: encryptionKey,
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_14_DAYS,
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      throughputMode: efs.ThroughputMode.BURSTING,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Access point for ECS tasks
    this.accessPoint = new efs.AccessPoint(this, 'ECSAccessPoint', {
      fileSystem: this.fileSystem,
      path: '/ecs-data',
      createAcl: {
        ownerUid: '1000',
        ownerGid: '1000',
        permissions: '755',
      },
      posixUser: {
        uid: '1000',
        gid: '1000',
      },
    });

    // Export filesystem ID
    new cdk.CfnOutput(this, 'FileSystemId', {
      value: this.fileSystem.fileSystemId,
      exportName: `healthtech-efs-id-${environmentSuffix}`,
    });

    // Tag all resources
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', 'HealthTech-DR');
    cdk.Tags.of(this).add('Compliance', 'HIPAA');
  }
}
