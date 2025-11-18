import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';

interface DatabaseStackProps extends cdk.StackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
}

export class DatabaseStack extends cdk.Stack {
  public readonly cluster: rds.DatabaseCluster;
  public readonly securityGroup: ec2.SecurityGroup;
  public readonly clusterIdentifier: string;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { environmentSuffix, vpc } = props;
    this.clusterIdentifier = `payment-db-${environmentSuffix}`;

    // KMS key for encryption
    const encryptionKey = new kms.Key(this, `DatabaseKey${environmentSuffix}`, {
      enableKeyRotation: true,
      description: 'KMS key for payment database encryption',
    });

    // Security group for database
    this.securityGroup = new ec2.SecurityGroup(
      this,
      `DatabaseSecurityGroup${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for payment database',
        allowAllOutbound: true,
      }
    );

    // Allow inbound traffic on port 5432 from VPC
    this.securityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'PostgreSQL access from VPC'
    );

    // S3 bucket for backups (created but not directly used in this simplified implementation)
    new s3.Bucket(this, `DatabaseBackupBucket${environmentSuffix}`, {
      bucketName: `payment-db-backups-${environmentSuffix}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'BackupRetention',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(365),
            },
          ],
          expiration: cdk.Duration.days(2555), // 7 years
        },
      ],
    });

    // RDS Aurora PostgreSQL cluster
    this.cluster = new rds.DatabaseCluster(
      this,
      `PaymentDatabase${environmentSuffix}`,
      {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_14_6,
        }),
        credentials: rds.Credentials.fromGeneratedSecret('payment_admin', {
          secretName: `payment-db-secret-${environmentSuffix}`,
        }),
        clusterIdentifier: this.clusterIdentifier,
        instances: 2,
        instanceProps: {
          vpc,
          vpcSubnets: {
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          },
          securityGroups: [this.securityGroup],
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.R6G,
            ec2.InstanceSize.LARGE
          ),
          allowMajorVersionUpgrade: false,
          autoMinorVersionUpgrade: true,
          deleteAutomatedBackups: false,
          enablePerformanceInsights: true,
          performanceInsightRetention: 7,
        },
        port: 5432,
        defaultDatabaseName: 'paymentdb',
        storageEncrypted: true,
        storageEncryptionKey: encryptionKey,
        backup: {
          retention: cdk.Duration.days(30),
          preferredWindow: '03:00-04:00',
        },
        monitoringInterval: cdk.Duration.minutes(1),
        cloudwatchLogsExports: ['postgresql'],
        deletionProtection: true,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      }
    );

    // Read replicas for read-heavy operations
    // Note: In CDK, readers are typically configured during cluster creation
    // For production, consider adding readers to the instances array above

    // Database parameter group (created but not directly used in this simplified implementation)
    new rds.ParameterGroup(this, `DatabaseParameterGroup${environmentSuffix}`, {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_14_6,
      }),
      description: 'Custom parameter group for payment database',
      parameters: {
        shared_preload_libraries: 'pg_stat_statements',
        'pg_stat_statements.track': 'all',
        'pg_stat_statements.max': '10000',
        log_statement: 'ddl',
        log_min_duration_statement: '1000',
      },
    });

    // Note: Parameter group would be applied during cluster creation in production

    // Outputs for cross-stack references
    new cdk.CfnOutput(this, `DatabaseClusterEndpoint${environmentSuffix}`, {
      value: this.cluster.clusterEndpoint.hostname,
      exportName: `PaymentDbEndpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `DatabaseClusterPort${environmentSuffix}`, {
      value: this.cluster.clusterEndpoint.port.toString(),
      exportName: `PaymentDbPort-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `DatabaseSecurityGroupId${environmentSuffix}`, {
      value: this.securityGroup.securityGroupId,
      exportName: `PaymentDbSecurityGroup-${environmentSuffix}`,
    });
  }
}
