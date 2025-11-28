import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface RdsConstructProps {
  environment: string;
  region: string;
  suffix: string;
  environmentSuffix: string;
  vpc: ec2.Vpc;
}

export class RdsConstruct extends Construct {
  public readonly dbInstance: rds.DatabaseInstance;
  public readonly dbSecret: secretsmanager.Secret;
  public readonly dbEndpoint: string;

  constructor(scope: Construct, id: string, props: RdsConstructProps) {
    super(scope, id);

    const { environment, region, suffix, environmentSuffix, vpc } = props;

    // KMS key for RDS encryption
    const rdsKey = new kms.Key(this, `RdsKmsKey${environmentSuffix}${region}`, {
      description: `RDS encryption key for ${environment} in ${region}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow deletion when stack fails
    });

    // Database credentials managed by Secrets Manager - Requirement 11
    this.dbSecret = new secretsmanager.Secret(
      this,
      `DbSecret${environmentSuffix}${region}`,
      {
        secretName: `${environment}-${region}-db-secret-${suffix}`,
        description: `Database credentials for ${environment} environment in ${region}`,
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            username: 'dbadmin',
          }),
          generateStringKey: 'password',
          excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
          passwordLength: 32,
        },
        encryptionKey: rdsKey,
      }
    );

    // Database subnet group using isolated subnets
    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `DbSubnetGroup${environmentSuffix}${region}`,
      {
        description: `Database subnet group for ${environment} in ${region}`,
        vpc: vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Security group for RDS - least privilege access
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      `DbSecurityGroup${environmentSuffix}${region}`,
      {
        securityGroupName: `${environment}-${region}-db-sg-${suffix}`,
        vpc: vpc,
        description: 'Security group for RDS PostgreSQL - least privilege',
        allowAllOutbound: false,
      }
    );

    // Allow connections only from private subnets (not public)
    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from VPC private subnets only'
    );

    // Parameter group for optimal PostgreSQL configuration
    const parameterGroup = new rds.ParameterGroup(
      this,
      `DbParameterGroup${environmentSuffix}${region}`,
      {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15, // Use latest stable version
        }),
        description: `PostgreSQL parameter group for ${environment}`,
        parameters: {
          shared_preload_libraries: 'pg_stat_statements',
          log_statement: 'all',
          log_min_duration_statement: '1000', // Log slow queries
          log_checkpoints: '1',
          log_connections: '1',
          log_disconnections: '1',
          log_lock_waits: '1',
        },
      }
    );

    // PostgreSQL RDS instance with encryption - Requirement 3
    this.dbInstance = new rds.DatabaseInstance(
      this,
      `PostgresInstance${environmentSuffix}${region}`,
      {
        instanceIdentifier: `${environment}-${region}-postgres-${suffix}`,
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          environment === 'prod'
            ? ec2.InstanceSize.LARGE
            : ec2.InstanceSize.MEDIUM
        ),
        vpc: vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [dbSecurityGroup],
        subnetGroup: dbSubnetGroup,
        parameterGroup: parameterGroup,

        // Storage configuration
        allocatedStorage: environment === 'prod' ? 200 : 100,
        maxAllocatedStorage: environment === 'prod' ? 1000 : 500,
        storageType: rds.StorageType.GP3,
        storageEncrypted: true, // Encryption enabled - Requirement 3
        storageEncryptionKey: rdsKey,

        // Credentials and database
        credentials: rds.Credentials.fromSecret(this.dbSecret),
        databaseName: `${environment}db`,

        // High availability and backup
        multiAz: environment === 'prod',
        deletionProtection: false, // Allow destroy for all environments
        deleteAutomatedBackups: true,
        backupRetention:
          environment === 'prod' ? cdk.Duration.days(30) : cdk.Duration.days(7),
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',

        // Monitoring and performance
        enablePerformanceInsights: true,
        performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
        performanceInsightEncryptionKey: rdsKey,
        monitoringInterval: cdk.Duration.minutes(1),
        cloudwatchLogsExports: ['postgresql'],

        // Updates
        autoMinorVersionUpgrade: environment !== 'prod', // Only auto-update non-prod
        allowMajorVersionUpgrade: false,

        // Removal policy
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow deletion when stack fails
      }
    );

    this.dbEndpoint = this.dbInstance.dbInstanceEndpointAddress;

    // Apply tags
    cdk.Tags.of(this.dbInstance).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this.dbInstance).add('Environment', environment);
    cdk.Tags.of(this.dbInstance).add('Region', region);
    cdk.Tags.of(this.dbInstance).add('DatabaseEngine', 'PostgreSQL');
    cdk.Tags.of(this.dbInstance).add(
      'BackupRetention',
      environment === 'prod' ? '30days' : '7days'
    );

    cdk.Tags.of(this.dbSecret).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this.dbSecret).add('Environment', environment);
    cdk.Tags.of(this.dbSecret).add('Region', region);
    cdk.Tags.of(this.dbSecret).add('Purpose', 'DatabaseCredentials');

    cdk.Tags.of(rdsKey).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(rdsKey).add('Environment', environment);
    cdk.Tags.of(rdsKey).add('Region', region);
    cdk.Tags.of(rdsKey).add('Purpose', 'RDSEncryption');
  }
}
