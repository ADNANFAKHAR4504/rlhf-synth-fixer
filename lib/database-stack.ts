import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface DatabaseStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  isPrimary: boolean;
  primaryRegion: string;
  drRegion: string;
  vpc: ec2.Vpc;
  kmsKey: kms.Key;
}

export class DatabaseStack extends cdk.NestedStack {
  public readonly database: rds.DatabaseInstance;
  public readonly readReplica?: rds.DatabaseInstanceReadReplica;
  public readonly credentials: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const {
      environmentSuffix,
      isPrimary,
      primaryRegion,
      drRegion,
      vpc,
      kmsKey,
    } = props;
    const currentRegion = isPrimary ? primaryRegion : drRegion;

    // Database credentials stored in Secrets Manager
    this.credentials = new secretsmanager.Secret(this, 'DatabaseCredentials', {
      secretName: `postgres-dr-credentials-${environmentSuffix}-${currentRegion}`,
      description: `PostgreSQL credentials for ${currentRegion}`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'postgres' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 32,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Database subnet group
    const subnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      subnetGroupName: `postgres-dr-subnet-group-${environmentSuffix}-${currentRegion}`,
      description: `Subnet group for PostgreSQL in ${currentRegion}`,
      vpc: vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Database parameter group for PostgreSQL 14
    const parameterGroup = new rds.ParameterGroup(
      this,
      'DatabaseParameterGroup',
      {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_14,
        }),
        description: `Parameter group for PostgreSQL 14 in ${currentRegion}`,
        parameters: {
          'rds.force_ssl': '1',
          log_statement: 'all',
          log_min_duration_statement: '1000',
          shared_preload_libraries: 'pg_stat_statements',
          track_activity_query_size: '2048',
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Option group (required for some PostgreSQL features)
    const optionGroup = new rds.OptionGroup(this, 'DatabaseOptionGroup', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14,
      }),
      description: `Option group for PostgreSQL 14 in ${currentRegion}`,
      configurations: [],
    });

    // Primary RDS PostgreSQL instance
    this.database = new rds.DatabaseInstance(this, 'Database', {
      instanceIdentifier: `postgres-dr-${environmentSuffix}-${currentRegion}`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.R6G,
        ec2.InstanceSize.XLARGE
      ),
      vpc: vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      multiAz: isPrimary, // Multi-AZ only for primary
      subnetGroup: subnetGroup,
      parameterGroup: parameterGroup,
      optionGroup: optionGroup,
      credentials: rds.Credentials.fromSecret(this.credentials),
      allocatedStorage: 100,
      maxAllocatedStorage: 500,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      deletionProtection: false, // Must be false for testing/destroyability
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      backupRetention: cdk.Duration.days(7),
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      performanceInsightEncryptionKey: kmsKey,
      cloudwatchLogsExports: ['postgresql', 'upgrade'],
      autoMinorVersionUpgrade: true,
      allowMajorVersionUpgrade: false,
      publiclyAccessible: false,
    });

    // Create read replica in DR region (only from primary)
    if (isPrimary) {
      // Note: Cross-region read replica requires manual creation or custom resources
      // CDK L2 constructs don't directly support cross-region read replicas
      // This would typically be done via L1 constructs or custom resources

      // For now, we'll create a local read replica as an example
      // In production, you'd use custom resources to create cross-region replicas
      this.readReplica = new rds.DatabaseInstanceReadReplica(
        this,
        'ReadReplica',
        {
          instanceIdentifier: `postgres-dr-replica-${environmentSuffix}-${currentRegion}`,
          sourceDatabaseInstance: this.database,
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.R6G,
            ec2.InstanceSize.XLARGE
          ),
          vpc: vpc,
          vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
          deletionProtection: false,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          publiclyAccessible: false,
          autoMinorVersionUpgrade: true,
          enablePerformanceInsights: true,
          performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
          performanceInsightEncryptionKey: kmsKey,
          storageEncryptionKey: kmsKey,
        }
      );
    }

    // Tags
    cdk.Tags.of(this.database).add(
      'Name',
      `postgres-dr-${environmentSuffix}-${currentRegion}`
    );
    cdk.Tags.of(this.database).add('Region', currentRegion);
    cdk.Tags.of(this.database).add('Purpose', 'PostgreSQL-DR');
    cdk.Tags.of(this.database).add('RPO', 'under-1-hour');
    cdk.Tags.of(this.database).add('RTO', 'under-4-hours');

    // Outputs
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.dbInstanceEndpointAddress,
      description: `Database endpoint for ${currentRegion}`,
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: this.database.dbInstanceEndpointPort,
      description: `Database port for ${currentRegion}`,
    });

    new cdk.CfnOutput(this, 'DatabaseIdentifier', {
      value: this.database.instanceIdentifier,
      description: `Database identifier for ${currentRegion}`,
    });

    new cdk.CfnOutput(this, 'CredentialsSecretArn', {
      value: this.credentials.secretArn,
      description: `Database credentials secret ARN for ${currentRegion}`,
    });

    if (this.readReplica) {
      new cdk.CfnOutput(this, 'ReadReplicaEndpoint', {
        value: this.readReplica.dbInstanceEndpointAddress,
        description: `Read replica endpoint for ${currentRegion}`,
      });
    }
  }
}
