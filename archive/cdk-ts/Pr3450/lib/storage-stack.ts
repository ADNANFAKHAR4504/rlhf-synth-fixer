import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as kms from 'aws-cdk-lib/aws-kms';

interface StorageStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  kmsKey: kms.Key;
}

export class StorageStack extends cdk.Stack {
  public readonly fileSystem: efs.FileSystem;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    // Create a security group for the EFS mount targets
    const efsSg = new ec2.SecurityGroup(this, 'EfsSecurityGroup', {
      vpc: props.vpc,
      description: 'Allow NFS traffic to EFS from EC2 instances',
      allowAllOutbound: false,
    });

    // Allow NFS traffic from EC2 instances
    efsSg.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(2049),
      'Allow NFS traffic from within the VPC'
    );

    // Create the EFS file system
    this.fileSystem = new efs.FileSystem(this, 'AppFileSystem', {
      vpc: props.vpc,
      encrypted: true,
      kmsKey: props.kmsKey,
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_30_DAYS, // Move files to infrequent access after 30 days
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      throughputMode: efs.ThroughputMode.BURSTING,
      securityGroup: efsSg,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Destroyable for testing
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Enable automatic backups
    const cfnFileSystem = this.fileSystem.node
      .defaultChild as efs.CfnFileSystem;
    cfnFileSystem.backupPolicy = {
      status: 'ENABLED',
    };

    // Output the EFS DNS name and ID
    new cdk.CfnOutput(this, 'EfsId', {
      value: this.fileSystem.fileSystemId,
      description: 'The ID of the EFS file system',
    });

    new cdk.CfnOutput(this, 'EfsDnsName', {
      value: `${this.fileSystem.fileSystemId}.efs.${this.region}.amazonaws.com`,
      description: 'The DNS name of the EFS file system',
    });
  }
}
