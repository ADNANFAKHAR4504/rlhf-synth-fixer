import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

export interface DatabaseConstructProps {
  vpc: ec2.Vpc;
  instanceSize: string;
  environmentSuffix: string;
}

export class DatabaseConstruct extends Construct {
  public readonly instance: rds.DatabaseInstance;
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    const { vpc, instanceSize, environmentSuffix } = props;

    // Convert string to InstanceSize enum with validation
    const getInstanceSize = (size: string): ec2.InstanceSize => {
      const sizeMap: Record<string, ec2.InstanceSize> = {
        NANO: ec2.InstanceSize.NANO,
        MICRO: ec2.InstanceSize.MICRO,
        SMALL: ec2.InstanceSize.SMALL,
        MEDIUM: ec2.InstanceSize.MEDIUM,
        LARGE: ec2.InstanceSize.LARGE,
        XLARGE: ec2.InstanceSize.XLARGE,
      };
      return sizeMap[size?.toUpperCase() || 'MICRO'] || ec2.InstanceSize.MICRO;
    };
    const ec2InstanceSize = getInstanceSize(instanceSize);

    // --- Database Security Group ---
    this.securityGroup = new ec2.SecurityGroup(this, 'DatabaseSG', {
      vpc,
      description: 'Security group for the RDS database',
    });

    // --- RDS Database Instance ---
    this.instance = new rds.DatabaseInstance(this, 'AppDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_35,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE4_GRAVITON,
        ec2InstanceSize
      ),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [this.securityGroup],
      storageEncrypted: true,
      backupRetention: cdk.Duration.days(7),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
    });

    // Apply comprehensive tagging
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Component', 'Database');
  }
}
