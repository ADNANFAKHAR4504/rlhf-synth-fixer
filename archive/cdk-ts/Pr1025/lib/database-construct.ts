import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface DatabaseConstructProps {
  vpc: ec2.IVpc;
  environmentSuffix: string;
  securityGroup: ec2.ISecurityGroup;
  instanceType?: ec2.InstanceType;
}

export class DatabaseConstruct extends Construct {
  public readonly database: rds.DatabaseInstance;
  public readonly credentials: rds.DatabaseSecret;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    // Create database credentials
    this.credentials = new rds.DatabaseSecret(this, 'DbCredentials', {
      username: 'admin',
    });

    // Create RDS database instance
    this.database = new rds.DatabaseInstance(this, 'Database', {
      databaseName: `webapp${props.environmentSuffix}`,
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType:
        props.instanceType ||
        ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      credentials: rds.Credentials.fromSecret(this.credentials),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [props.securityGroup],
      storageEncrypted: true,
      allocatedStorage: 20,
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: false,
      deletionProtection: false, // Set to true in production
      multiAz: false, // Cost optimization for dev/test
      autoMinorVersionUpgrade: true,
      cloudwatchLogsExports: ['error', 'general', 'slowquery'],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add tags
    cdk.Tags.of(this.database).add('Component', 'Database');
    cdk.Tags.of(this.database).add('Environment', props.environmentSuffix);
  }
}
