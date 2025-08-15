import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

export interface SecureRDSProps {
  vpc: ec2.IVpc;
  databaseName: string;
  instanceIdentifier: string;
  securityGroup: ec2.ISecurityGroup;
  environmentSuffix?: string;
}

export class SecureRDS extends Construct {
  public readonly database: rds.DatabaseInstance;
  public readonly encryptionKey: kms.Key;

  constructor(scope: Construct, id: string, props: SecureRDSProps) {
    super(scope, id);

    // Create KMS key for RDS encryption
    this.encryptionKey = new kms.Key(this, 'RDSEncryptionKey', {
      description: 'KMS key for RDS instance encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create subnet group for RDS in isolated subnets
    const subnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc: props.vpc,
      description: 'Subnet group for secure RDS instance',
      subnetGroupName:
        `secure-db-subnet-group-${props.environmentSuffix || 'dev'}`.toLowerCase(),
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Create parameter group with secure settings
    const parameterGroup = new rds.ParameterGroup(
      this,
      'DatabaseParameterGroup',
      {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15_13,
        }),
        description: 'Secure parameter group for PostgreSQL',
        parameters: {
          log_statement: 'all',
          log_min_duration_statement: '1000',
          shared_preload_libraries: 'pg_stat_statements',
          ssl: '1',
          log_connections: '1',
          log_disconnections: '1',
        },
      }
    );

    // Create RDS security group
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for RDS instance',
      allowAllOutbound: false,
    });

    // Allow PostgreSQL access only from application security group
    rdsSecurityGroup.addIngressRule(
      props.securityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from application'
    );

    // Create the RDS instance with encryption at rest
    this.database = new rds.DatabaseInstance(this, 'SecureDatabase', {
      instanceIdentifier: props.instanceIdentifier,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_13,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      credentials: rds.Credentials.fromGeneratedSecret('postgres', {
        secretName: `${props.instanceIdentifier}-credentials`,
        excludeCharacters: '"@/\\\'',
      }),
      vpc: props.vpc,
      subnetGroup: subnetGroup,
      securityGroups: [rdsSecurityGroup],
      databaseName: props.databaseName,

      // Encryption at rest (required)
      storageEncrypted: true,
      storageEncryptionKey: this.encryptionKey,

      // Backup and maintenance
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: false,
      deletionProtection: true,

      // Monitoring and logging
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: true,
      performanceInsightEncryptionKey: this.encryptionKey,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,

      cloudwatchLogsExports: ['postgresql'],
      parameterGroup: parameterGroup,

      // Multi-AZ for high availability
      multiAz: false, // Set to true for production

      // Auto minor version upgrade
      autoMinorVersionUpgrade: true,

      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create CloudWatch log group for RDS logs
    new logs.LogGroup(this, 'RDSLogGroup', {
      logGroupName: `/aws/rds/instance/${props.instanceIdentifier}/postgresql`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
  }
}
