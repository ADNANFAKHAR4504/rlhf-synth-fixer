import * as cdk from 'aws-cdk-lib';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface StorageStackProps extends cdk.StackProps {
  environmentSuffix: string;
  regionName: string;
  vpc: ec2.Vpc;
  kmsKey: kms.Key;
}

export class StorageStack extends cdk.NestedStack {
  public readonly fileSystem: efs.FileSystem;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    // Create security group for EFS
    const efsSecurityGroup = new ec2.SecurityGroup(this, 'EFSSecurityGroup', {
      vpc: props.vpc,
      description: `EFS security group for ${props.regionName}`,
      allowAllOutbound: false,
    });

    // Allow NFS traffic from within VPC
    efsSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(2049),
      'Allow NFS traffic from VPC'
    );

    // Create EFS file system with encryption
    this.fileSystem = new efs.FileSystem(this, 'FileSystem', {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroup: efsSecurityGroup,
      encrypted: true,
      kmsKey: props.kmsKey,
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_30_DAYS,
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      throughputMode: efs.ThroughputMode.BURSTING,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Changed for testing - use RETAIN in production
      enableAutomaticBackups: true,
    });

    // Add tags
    cdk.Tags.of(this.fileSystem).add(
      'Name',
      `healthcare-efs-${props.regionName}`
    );
    cdk.Tags.of(this.fileSystem).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this.fileSystem).add('Region', props.regionName);

    // Output file system ID
    new cdk.CfnOutput(this, 'FileSystemId', {
      value: this.fileSystem.fileSystemId,
      description: `EFS file system ID for ${props.regionName}`,
    });
  }
}
