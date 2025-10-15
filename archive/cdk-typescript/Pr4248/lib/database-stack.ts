import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface DatabaseStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  databaseSecurityGroup: ec2.SecurityGroup;
  databaseSecret: secretsmanager.Secret;
  kmsKey: kms.Key;
}

export class DatabaseStack extends Construct {
  public readonly database: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id);

    // Create RDS subnet group
    const subnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc: props.vpc,
      description: 'Subnet group for payment processing database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create RDS PostgreSQL instance
    this.database = new rds.DatabaseInstance(this, 'PaymentDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_6,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [props.databaseSecurityGroup],
      subnetGroup: subnetGroup,
      credentials: rds.Credentials.fromSecret(props.databaseSecret),
      databaseName: 'paymentdb',
      multiAz: false,
      storageEncrypted: true,
      storageEncryptionKey: props.kmsKey,
      backupRetention: cdk.Duration.days(30),
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      performanceInsightEncryptionKey: props.kmsKey,
      autoMinorVersionUpgrade: true,
      allocatedStorage: 100,
      maxAllocatedStorage: 500,
      storageType: rds.StorageType.GP3,
      publiclyAccessible: false,
      cloudwatchLogsExports: ['postgresql', 'upgrade'],
      cloudwatchLogsRetention: cdk.aws_logs.RetentionDays.THREE_MONTHS,
    });

    // Enable automatic rotation for database credentials
    props.databaseSecret.addRotationSchedule('DatabaseRotation', {
      automaticallyAfter: cdk.Duration.days(30),
      hostedRotation: secretsmanager.HostedRotation.postgreSqlSingleUser({
        functionName: `db-rotation-${props.environmentSuffix}`,
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [props.databaseSecurityGroup],
      }),
    });

    // Tags for compliance
    cdk.Tags.of(this.database).add('PCICompliant', 'true');
    cdk.Tags.of(this.database).add('DataClassification', 'Sensitive');
    cdk.Tags.of(this.database).add('Environment', props.environmentSuffix);
  }
}
