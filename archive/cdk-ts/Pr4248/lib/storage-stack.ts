import * as cdk from 'aws-cdk-lib';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface StorageStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  efsSecurityGroup: ec2.SecurityGroup;
  kmsKey: kms.Key;
}

export class StorageStack extends Construct {
  public readonly fileSystem: efs.FileSystem;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id);

    // Create EFS file system
    this.fileSystem = new efs.FileSystem(this, 'PaymentFileSystem', {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroup: props.efsSecurityGroup,
      encrypted: true,
      kmsKey: props.kmsKey,
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_30_DAYS,
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      throughputMode: efs.ThroughputMode.BURSTING,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      enableAutomaticBackups: true,
    });

    // Tags for compliance
    cdk.Tags.of(this.fileSystem).add('PCICompliant', 'true');
    cdk.Tags.of(this.fileSystem).add('DataClassification', 'Sensitive');
    cdk.Tags.of(this.fileSystem).add('Environment', props.environmentSuffix);
  }
}
