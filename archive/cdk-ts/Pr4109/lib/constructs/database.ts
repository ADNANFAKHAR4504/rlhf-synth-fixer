import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface DatabaseConstructProps {
  vpc: ec2.Vpc;
  securityGroup: ec2.SecurityGroup;
  kmsKey: kms.Key;
  environment: string;
}

export class DatabaseConstruct extends Construct {
  public readonly cluster: rds.DatabaseCluster;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    // Create secret for database credentials
    const databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `tap-${props.environment}-db-credentials`,
      description: 'RDS database master credentials',
      encryptionKey: props.kmsKey,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32,
      },
    });

    // Create Aurora PostgreSQL cluster with encryption
    this.cluster = new rds.DatabaseCluster(this, 'Database', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_14_6,
      }),
      credentials: rds.Credentials.fromSecret(databaseSecret),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [props.securityGroup],
      writer: rds.ClusterInstance.provisioned('WriterInstance', {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T4G,
          ec2.InstanceSize.MEDIUM
        ),
      }),
      readers: [
        rds.ClusterInstance.provisioned('ReaderInstance', {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.T4G,
            ec2.InstanceSize.MEDIUM
          ),
        }),
      ],
      storageEncrypted: true,
      storageEncryptionKey: props.kmsKey,
      backup: {
        retention: cdk.Duration.days(30),
        preferredWindow: '03:00-04:00',
      },
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: props.environment === 'prod',
      cloudwatchLogsExports: ['postgresql'],
      cloudwatchLogsRetention: cdk.aws_logs.RetentionDays.ONE_MONTH,
      defaultDatabaseName: `tap_${props.environment}`,
    });

    // Enable automated backups to another region for disaster recovery
    new rds.CfnDBClusterParameterGroup(this, 'ClusterParameterGroup', {
      family: 'aurora-postgresql14',
      description: 'Custom parameter group for TAP database',
      parameters: {
        log_statement: 'all',
        log_min_duration_statement: '100', // Log slow queries
        shared_preload_libraries: 'pg_stat_statements',
      },
    });
  }
}
